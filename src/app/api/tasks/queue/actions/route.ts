import { NextResponse } from "next/server";
import { z } from "zod";

import { getQueueBundle } from "@/jobs/queue";

const bodySchema = z.object({
  action: z.enum([
    "retryJob",
    "removeJob",
    "promoteJob",
    "retryStatus",
    "cleanStatus",
    "drainQueue",
  ]),
  jobId: z.union([z.string(), z.number()]).optional(),
  status: z
    .enum(["failed", "completed", "waiting", "delayed", "active", "all"])
    .optional(),
});

const CLEAN_STATUS_MAP: Record<
  "failed" | "completed" | "waiting" | "delayed" | "active",
  "failed" | "completed" | "wait" | "delayed" | "active"
> = {
  failed: "failed",
  completed: "completed",
  waiting: "wait",
  delayed: "delayed",
  active: "active",
};

function ensureQueue() {
  const bundle = getQueueBundle();
  if (!bundle?.queue) {
    throw new Error("队列不可用或未配置");
  }
  return bundle.queue;
}

export async function POST(request: Request) {
  if (!process.env.REDIS_URL) {
    return NextResponse.json(
      { error: "REDIS_URL is not configured" },
      { status: 503 },
    );
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const queue = ensureQueue();
    const { action, jobId, status } = parsed.data;

    switch (action) {
      case "retryJob": {
        if (jobId === undefined || jobId === null) {
          return NextResponse.json(
            { error: "jobId is required for retryJob" },
            { status: 400 },
          );
        }
        const job = await queue.getJob(String(jobId));
        if (!job) {
          return NextResponse.json(
            { error: "Job not found" },
            { status: 404 },
          );
        }
        await job.retry();
        break;
      }
      case "removeJob": {
        if (jobId === undefined || jobId === null) {
          return NextResponse.json(
            { error: "jobId is required for removeJob" },
            { status: 400 },
          );
        }
        const job = await queue.getJob(String(jobId));
        if (!job) {
          return NextResponse.json(
            { error: "Job not found" },
            { status: 404 },
          );
        }
        await job.remove();
        break;
      }
      case "promoteJob": {
        if (jobId === undefined || jobId === null) {
          return NextResponse.json(
            { error: "jobId is required for promoteJob" },
            { status: 400 },
          );
        }
        const job = await queue.getJob(String(jobId));
        if (!job) {
          return NextResponse.json(
            { error: "Job not found" },
            { status: 404 },
          );
        }
        await job.promote();
        break;
      }
      case "retryStatus": {
        if (!status || (status !== "failed" && status !== "waiting" && status !== "delayed")) {
          return NextResponse.json(
            { error: "status must be one of failed, waiting, delayed" },
            { status: 400 },
          );
        }
        const jobs = await queue.getJobs([status], 0, -1, false);
        await Promise.all(jobs.map(async (job) => job.retry()));
        break;
      }
      case "cleanStatus": {
        if (!status || !(status in CLEAN_STATUS_MAP)) {
          return NextResponse.json(
            { error: "Unsupported status for cleanStatus" },
            { status: 400 },
          );
        }
        await queue.clean(0, CLEAN_STATUS_MAP[status]);
        break;
      }
      case "drainQueue": {
        await queue.drain(true);
        await queue.clean(0, "completed");
        await queue.clean(0, "failed");
        break;
      }
      default:
        return NextResponse.json(
          { error: "Unsupported action" },
          { status: 400 },
        );
    }

    const counts = await queue.getJobCounts(
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed",
      "paused",
    );

    return NextResponse.json({ success: true, counts });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Queue action failed" },
      { status: 500 },
    );
  }
}
