import { NextResponse } from "next/server";
import { z } from "zod";
import { createPodcastIndexClient } from "@/lib/podcast-index";
import { PodcastService } from "@/services/podcast-service";
import { prisma } from "@/lib/prisma";
import { SyncStatus } from "@prisma/client";

const bodySchema = z
  .object({
    feedId: z.number().int().positive().optional(),
    feedUrl: z.string().url().optional(),
    guid: z.string().min(6).optional(),
    itunesId: z.number().int().positive().optional(),
    syncEpisodes: z.boolean().optional(),
  })
  .refine(
    (value) => value.feedId || value.feedUrl || value.guid || value.itunesId,
    { message: "请至少提供 feedId、feedUrl、guid 或 itunesId 之一" },
  );

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
  const { feedId, feedUrl, guid, itunesId, syncEpisodes } = parsed.data;
  const syncLabel =
    feedId !== undefined
      ? `feedId ${feedId}`
      : feedUrl
        ? `feedUrl ${feedUrl}`
        : guid
          ? `guid ${guid}`
          : `itunesId ${itunesId}`;

  const log = await prisma.syncLog.create({
    data: {
      job_type: "REGISTER_FEED",
      status: SyncStatus.RUNNING,
      message: `Registering feed ${syncLabel}`,
    },
  });

  try {
    const result = await service.syncPodcastUsingIdentifiers(
      { feedId, feedUrl, guid, itunesId },
      {
        synchronizeEpisodes: syncEpisodes,
        fullEpisodeRefresh: syncEpisodes !== false,
        episodeBatchSize: syncEpisodes === false ? undefined : 1000,
      },
    );
    if (!result) {
      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          status: SyncStatus.FAILED,
          finished_at: new Date(),
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
        finished_at: new Date(),
        podcast_id: result.podcast.id,
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
