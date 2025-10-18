import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getBullBoardApp } from "@/lib/bull-board";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE_PATH = "/dashboard/queue";

async function handle(request: NextRequest) {
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
