import { NextResponse } from "next/server";
import { z } from "zod";

import { createPodcastIndexClient } from "@/lib/podcast-index";
import { PodcastService } from "@/services/podcast-service";
import { prisma } from "@/lib/prisma";

const TAG_VALUES = ["podcast-value", "podcast-valueTimeSplit"] as const;

const querySchema = z.object({
  tag: z.enum(TAG_VALUES),
  max: z.coerce.number().int().min(1).max(500).optional(),
  start_at: z.coerce.number().int().min(0).optional(),
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
    tag: url.searchParams.get("tag") ?? "",
    max: url.searchParams.get("max") ?? undefined,
    start_at: url.searchParams.get("start_at") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const client = createPodcastIndexClient();
  const service = new PodcastService(client, prisma);

  const feeds = await service.discoverByTag({
    tag: parsed.data.tag,
    max: parsed.data.max,
    startAt: parsed.data.start_at,
  });

  return NextResponse.json(
    { feeds },
    {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
