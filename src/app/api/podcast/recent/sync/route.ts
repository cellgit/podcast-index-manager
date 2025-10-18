import { NextResponse } from "next/server";
import { z } from "zod";

import { createPodcastIndexClient } from "@/lib/podcast-index";
import { PodcastService } from "@/services/podcast-service";
import { prisma } from "@/lib/prisma";
import { SyncStatus } from "@prisma/client";
import { enqueueSyncRecentJob } from "@/jobs/sync-recent";
import { QualityService } from "@/services/quality-service";

const bodySchema = z
  .object({
    max: z.coerce.number().int().min(50).max(1000).optional(),
  })
  .optional();

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

  const max = parsed.data?.max;

  const shouldEnqueue = Boolean(process.env.REDIS_URL);
  const log = await prisma.syncLog.create({
    data: {
      job_type: "SYNC_RECENT_DATA",
      status: shouldEnqueue ? SyncStatus.PENDING : SyncStatus.RUNNING,
      message: shouldEnqueue
        ? `Queued recent data sync${max ? ` (max=${max})` : ""}`
        : `Sync recent data${max ? ` (max=${max})` : ""}`,
    },
  });

  if (shouldEnqueue) {
    try {
      const job = await enqueueSyncRecentJob({ max, triggeredBy: "api" });
      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          message: `Queued job ${job.id} for recent data sync${max ? ` (max=${max})` : ""}`,
        },
      });
      return NextResponse.json(
        {
          queued: true,
          jobId: job.id,
        },
        { status: 202, headers: { "Cache-Control": "no-store" } },
      );
    } catch (error) {
      await prisma.syncLog.update({
        where: { id: log.id },
        data: {
          status: SyncStatus.FAILED,
          finished_at: new Date(),
          error: { message: error instanceof Error ? error.message : "Unknown error" },
        },
      });
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "队列不可用" },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }
  }

  const client = createPodcastIndexClient();
  const service = new PodcastService(client, prisma);

  try {
    const summary = await service.syncRecentData({ max });
    const quality = new QualityService(prisma);
    await quality.evaluateAndPersist();

    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: SyncStatus.SUCCESS,
        finished_at: new Date(),
        message: `Recent sync processed ${summary.episodesProcessed} episodes across ${summary.feedsProcessed} feeds`,
      },
    });

    return NextResponse.json(
      { summary },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    await prisma.syncLog.update({
      where: { id: log.id },
      data: {
        status: SyncStatus.FAILED,
        finished_at: new Date(),
        error: { message: error instanceof Error ? error.message : "Unknown error" },
      },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
