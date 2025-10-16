import { NextResponse } from "next/server";
import { z } from "zod";
import { createPodcastIndexClient } from "@/lib/podcast-index";
import { PodcastService } from "@/services/podcast-service";
import { prisma } from "@/lib/prisma";
import { SyncStatus } from "@prisma/client";

const paramsSchema = z.object({
  feedId: z.string().regex(/^\d+$/),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ feedId: string }> },
) {
  const { feedId: feedIdParam } = await params;
  if (!prisma) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const validation = paramsSchema.safeParse({ feedId: feedIdParam });
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid feed id" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const feedId = Number(validation.data.feedId);
  const client = createPodcastIndexClient();
  const service = new PodcastService(client, prisma);

  const log = await prisma.syncLog.create({
    data: {
      job_type: "SYNC_EPISODES",
      status: SyncStatus.RUNNING,
      message: `Sync episodes for feed ${feedId}`,
    },
  });

  try {
    const result = await service.syncPodcastByFeedId(feedId);
    if (!result) {
      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          status: SyncStatus.FAILED,
          finished_at: new Date(),
          message: "Feed not found",
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
        finished_at: new Date(),
        podcast_id: result.podcast.id,
        message: `Fetched ${result.episodeDelta} episodes`,
      },
    });

    return NextResponse.json(
      {
        episodesAdded: result.episodeDelta,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: SyncStatus.FAILED,
        finished_at: new Date(),
        error: { message: error instanceof Error ? error.message : "Unknown" },
      },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
