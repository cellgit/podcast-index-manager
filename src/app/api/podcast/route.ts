import { NextResponse } from "next/server";
import { z } from "zod";
import { createPodcastIndexClient } from "@/lib/podcast-index";
import { PodcastService } from "@/services/podcast-service";
import { prisma } from "@/lib/prisma";
import { SyncStatus } from "@prisma/client";

const bodySchema = z.object({
  feedId: z.number().int().positive(),
});

export async function POST(request: Request) {
  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const client = createPodcastIndexClient();
  const service = new PodcastService(client, prisma);
  const { feedId } = parsed.data;

  const log = await prisma.syncLog.create({
    data: {
      jobType: "REGISTER_FEED",
      status: SyncStatus.RUNNING,
      message: `Registering feed ${feedId}`,
    },
  });

  try {
    const result = await service.syncPodcastByFeedId(feedId);
    if (!result) {
      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          status: SyncStatus.FAILED,
          finishedAt: new Date(),
          message: "Feed not found in PodcastIndex",
        },
      });
      return NextResponse.json(
        { error: "Feed not found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: SyncStatus.SUCCESS,
        finishedAt: new Date(),
        podcastId: result.podcast.id,
        message: `Registered feed with ${result.episodeDelta} episodes`,
      },
    });

    return NextResponse.json(
      {
        podcast: {
          id: result.podcast.id,
          title: result.podcast.title,
          episodeDelta: result.episodeDelta,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: SyncStatus.FAILED,
        finishedAt: new Date(),
        error: { message: error instanceof Error ? error.message : "Unknown" },
      },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
