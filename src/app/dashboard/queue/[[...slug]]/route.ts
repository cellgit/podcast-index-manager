import { extname, join, normalize } from "node:path";
import { readFile, stat } from "node:fs/promises";

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getBullBoardApp } from "@/lib/bull-board";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/dashboard/queue";
const STATIC_PREFIX = `${BASE_PATH}/static/`;
const UI_STATIC_ROOT = normalize(
  join(process.cwd(), "node_modules/@bull-board/ui/dist/static"),
);

async function handle(request: NextRequest) {
  const url = new URL(request.url);

  if (url.pathname.startsWith(STATIC_PREFIX)) {
    const relativePath = url.pathname.slice(STATIC_PREFIX.length);
    const response = await serveStaticAsset(relativePath);
    if (response) {
      return response;
    }
    return NextResponse.json({ error: "Static asset not found" }, { status: 404 });
  }

  let app;
  try {
    app = getBullBoardApp();
  } catch (error) {
    const message = error instanceof Error ? error.message : "任务队列不可用";
    logger.error({ err: error }, "Bull Board bootstrap failure");
    return NextResponse.json({ error: message }, { status: 503 });
  }

  const forwardedRequest = rewriteRequestUrl(request);
  return app.fetch(forwardedRequest);
}

function rewriteRequestUrl(request: NextRequest) {
  const url = new URL(request.url);
  if (url.pathname.startsWith(BASE_PATH)) {
    const remainder = url.pathname.slice(BASE_PATH.length) || "/";
    url.pathname = remainder.startsWith("/") ? remainder : `/${remainder}`;
  }
  return new Request(url.toString(), request);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
export const OPTIONS = handle;
export const HEAD = handle;

async function serveStaticAsset(relativePath: string) {
  try {
    const safePath = normalize(join(UI_STATIC_ROOT, relativePath));
    if (!safePath.startsWith(UI_STATIC_ROOT)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }
    const fileStat = await stat(safePath);
    if (!fileStat.isFile()) {
      return null;
    }
    const file = await readFile(safePath);
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": getContentType(extname(safePath)),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      logger.error({ err: error, relativePath }, "failed to serve Bull Board static asset");
    }
    return null;
  }
}

function getContentType(ext: string) {
  switch (ext) {
    case ".js":
      return "text/javascript";
    case ".css":
      return "text/css";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".json":
      return "application/json";
    case ".map":
      return "application/json";
    case ".woff2":
      return "font/woff2";
    default:
      return "application/octet-stream";
  }
}
