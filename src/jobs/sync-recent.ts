import { Worker, Queue } from "bullmq";

import { createPodcastIndexClient } from "@/lib/podcast-index";
import { prisma } from "@/lib/prisma";
import { PodcastService } from "@/services/podcast-service";
import { QualityService } from "@/services/quality-service";

import { QUEUE_NAME, createRedisConnection } from "./config";

const JOB_NAME = "sync-recent-data" as const;

type SyncRecentJobPayload = {
  max?: number;
  triggeredBy?: string;
};

export function registerSyncRecentWorker() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL 未配置，无法启动 Worker");
  }
  const connection = createRedisConnection();
  const worker = new Worker<SyncRecentJobPayload>(
    QUEUE_NAME,
    async (job) => {
      if (!prisma) {
        throw new Error("数据库未配置，无法执行同步");
      }
      const client = createPodcastIndexClient();
      const service = new PodcastService(client, prisma);

      const summary = await service.syncRecentData({ max: job.data.max });
      const quality = new QualityService(prisma);
      await quality.evaluateAndPersist();

      await prisma.syncWorker.upsert({
        where: { name: "sync-recent" },
        create: {
          name: "sync-recent",
          status: "online",
          details: {
            lastJobId: job.id,
            summary,
            triggeredBy: job.data.triggeredBy ?? "schedule",
          },
        },
        update: {
          status: "online",
          details: {
            lastJobId: job.id,
            summary,
            triggeredBy: job.data.triggeredBy ?? "schedule",
          },
        },
      });

      return summary;
    },
    { connection }
  );

  worker.on("failed", async (job, err) => {
    if (prisma) {
      await prisma.syncWorker.upsert({
        where: { name: "sync-recent" },
        create: {
          name: "sync-recent",
          status: "error",
          details: {
            jobId: job?.id,
            error: err.message,
          },
        },
        update: {
          status: "error",
          details: {
            jobId: job?.id,
            error: err.message,
          },
        },
      });
    }
  });

  return worker;
}

export async function enqueueSyncRecentJob(payload: SyncRecentJobPayload = {}) {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL 未配置，无法创建任务");
  }
  const connection = createRedisConnection();
  const queue = new Queue<SyncRecentJobPayload>(QUEUE_NAME, { connection });
  return queue.add(JOB_NAME, payload, {
    removeOnComplete: true,
    removeOnFail: false,
  });
}
