import { NextResponse } from "next/server";
import { z } from "zod";

import { createPodcastIndexClient } from "@/lib/podcast-index";
import { PodcastService } from "@/services/podcast-service";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  max: z.coerce.number().int().min(1).max(200).optional(),
  lang: z.string().optional(),
  cat: z.string().optional(),
});

export async function GET(request: Request) {
  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    max: url.searchParams.get("max") ?? undefined,
    lang: url.searchParams.get("lang") ?? undefined,
    cat: url.searchParams.get("cat") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const client = createPodcastIndexClient();
  const service = new PodcastService(client, prisma);

  const feeds = await service.discoverTrending({
    max: parsed.data.max,
    lang: parsed.data.lang,
    cat: parsed.data.cat,
  });

  return NextResponse.json(
    { feeds },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
