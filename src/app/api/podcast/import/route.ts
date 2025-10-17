import { NextResponse } from "next/server";
import { z } from "zod";
import { createPodcastIndexClient } from "@/lib/podcast-index";
import { PodcastService } from "@/services/podcast-service";
import { prisma } from "@/lib/prisma";
import { SyncStatus } from "@prisma/client";

const bodySchema = z.object({
  feedUrl: z.string().url("请提供有效的 RSS Feed URL"),
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
  const { feedUrl } = parsed.data;

  const log = await prisma.syncLog.create({
    data: {
      job_type: "IMPORT_FEED",
      status: SyncStatus.RUNNING,
      message: `Importing feed from ${feedUrl}`,
    },
  });

  try {
    // Try to add the feed to PodcastIndex first
    const result = await service.addPodcastByFeedUrl(feedUrl);

    if (!result) {
      // If not found in PodcastIndex, try to get it directly
      const fallbackResult = await service.syncPodcastByFeedUrl(feedUrl);

      if (!fallbackResult) {
        await prisma.syncLog.update({
          where: { id: log.id },
          data: {
            status: SyncStatus.FAILED,
            finished_at: new Date(),
            message: "Feed not found in PodcastIndex",
          },
        });
        return NextResponse.json(
          {
            error:
              "Feed not found in PodcastIndex. Please make sure the URL is correct.",
          },
          { status: 404, headers: { "Cache-Control": "no-store" } },
        );
      }

      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          status: SyncStatus.SUCCESS,
          finished_at: new Date(),
          podcast_id: fallbackResult.podcast.id,
          message: `Imported feed with ${fallbackResult.episodeDelta} episodes`,
        },
      });

      return NextResponse.json(
        {
          podcast: {
            id: fallbackResult.podcast.id,
            title: fallbackResult.podcast.title,
            episodeDelta: fallbackResult.episodeDelta,
            podcastIndexId: fallbackResult.podcast.podcast_index_id,
          },
        },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: SyncStatus.SUCCESS,
        finished_at: new Date(),
        podcast_id: result.podcast.id,
        message: `Imported and registered feed with ${result.episodeDelta} episodes`,
      },
    });

    return NextResponse.json(
      {
        podcast: {
          id: result.podcast.id,
          title: result.podcast.title,
          episodeDelta: result.episodeDelta,
          podcastIndexId: result.podcast.podcast_index_id,
        },
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
