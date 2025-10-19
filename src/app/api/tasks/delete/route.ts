import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getQueueBundle } from "@/jobs/queue";

const bodySchema = z.object({
  logIds: z.array(z.number().int().positive()).min(1),
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

  const ids = Array.from(new Set(parsed.data.logIds));
  if (ids.length === 0) {
    return NextResponse.json(
      { error: "logIds is empty" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const logs = await prisma.syncLog.findMany({
    where: { id: { in: ids } },
    select: { id: true, queue_job_id: true },
  });

  if (logs.length === 0) {
    return NextResponse.json(
      { error: "No matching logs" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const queueJobIds = logs
    .map((log) => log.queue_job_id)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  let queueRemoved = 0;
  if (queueJobIds.length > 0) {
    const bundle = getQueueBundle();
    if (!bundle?.queue) {
      return NextResponse.json(
        { error: "队列未启用，无法移除待处理任务" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    for (const jobId of queueJobIds) {
      try {
        const job = await bundle.queue.getJob(jobId);
        if (job) {
          await job.remove();
          queueRemoved += 1;
        }
      } catch (error) {
        return NextResponse.json(
          { error: `无法移除队列任务 ${jobId}: ${error instanceof Error ? error.message : "未知错误"}` },
          { status: 500, headers: { "Cache-Control": "no-store" } },
        );
      }
    }
  }

  await prisma.syncLog.deleteMany({
    where: { id: { in: logs.map((log) => log.id) } },
  });

  return NextResponse.json(
    {
      success: true,
      removedLogs: logs.length,
      removedQueueJobs: queueRemoved,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
