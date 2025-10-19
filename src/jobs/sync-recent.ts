import { Worker } from "bullmq";
import type { Prisma } from "@prisma/client";
import { SyncStatus } from "@prisma/client";

import { createPodcastIndexClient } from "@/lib/podcast-index";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { PodcastService } from "@/services/podcast-service";
import { QualityService } from "@/services/quality-service";

import { QUEUE_NAME, createRedisConnection } from "./config";
import { getQueueBundle } from "./queue";

const JOB_NAME = "sync-recent-data" as const;
const WORKER_NAME = "sync-recent";

type SyncRecentJobPayload = {
  max?: number;
  triggeredBy?: string;
  logId?: number;
};

export function registerSyncRecentWorker() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL 未配置，无法启动 Worker");
  }
  const connection = createRedisConnection();
  const worker = new Worker<SyncRecentJobPayload>(
    QUEUE_NAME,
    async (job) => {
      logger.info(
        {
          jobId: job.id,
          payload: job.data,
        },
        "sync-recent job started",
      );
      if (!prisma) {
        throw new Error("数据库未配置，无法执行同步");
      }

      const logId = job.data.logId;
      if (logId) {
        await prisma.syncLog.updateMany({
          where: { id: logId },
          data: {
            status: SyncStatus.RUNNING,
            queue_job_id: job.id ? String(job.id) : null,
            message: `Worker ${job.id ?? "unknown"} 开始处理增量同步`,
            started_at: new Date(),
          },
        });
      }

      try {
        const client = createPodcastIndexClient();
        const service = new PodcastService(client, prisma);

        const summary = await service.syncRecentData({ max: job.data.max });
        const quality = new QualityService(prisma);
        await quality.evaluateAndPersist();

        const workerDetails = {
          lastJobId: job.id,
          summary,
          triggeredBy: job.data.triggeredBy ?? "schedule",
        } satisfies Prisma.JsonObject;
        await upsertSyncWorkerStatus("online", workerDetails);

        if (logId) {
          await prisma.syncLog.updateMany({
            where: { id: logId },
            data: {
              status: SyncStatus.SUCCESS,
              finished_at: new Date(),
              message: `增量同步完成：处理 ${summary.feedsProcessed} 个播客 / ${summary.episodesProcessed} 条节目`,
            },
          });
        }

        logger.info(
          {
            jobId: job.id,
            summary,
          },
          "sync-recent job completed",
        );

        return summary;
      } catch (error) {
        if (logId) {
          await prisma.syncLog.updateMany({
            where: { id: logId },
            data: {
              status: SyncStatus.FAILED,
              finished_at: new Date(),
              error: {
                message:
                  error instanceof Error ? error.message : "未知错误",
              },
              message: "增量同步任务失败，请检查 Worker 日志。",
            },
          });
        }
        throw error;
      }
    },
    { connection }
  );

  worker.on("active", (job) => {
    logger.debug({ jobId: job.id }, "sync-recent job active");
  });

  worker.on("failed", async (job, err) => {
    logger.error(
      { err, jobId: job?.id },
      "sync-recent job failed",
    );
    if (prisma) {
      const errorDetails = {
        jobId: job?.id ?? null,
        error: err.message,
      } satisfies Prisma.JsonObject;
      await upsertSyncWorkerStatus("error", errorDetails);
      const logId = job?.data?.logId;
      if (logId) {
        await prisma.syncLog.updateMany({
          where: { id: logId, status: { not: SyncStatus.FAILED } },
          data: {
            status: SyncStatus.FAILED,
            finished_at: new Date(),
            error: { message: err.message },
            message: err.message,
          },
        });
      }
    }
  });

  return worker;
}

export async function enqueueSyncRecentJob(payload: SyncRecentJobPayload = {}) {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL 未配置，无法创建任务");
  }
  const bundle = getQueueBundle();
  if (!bundle) {
    throw new Error("任务队列未启用，无法创建任务");
  }
  const job = await bundle.queue.add(JOB_NAME, payload, {
    removeOnComplete: true,
    removeOnFail: false,
  });
  logger.info(
    { jobId: job.id, payload, queueName: QUEUE_NAME },
    "sync-recent job enqueued",
  );
  return job;
}

async function upsertSyncWorkerStatus(
  status: string,
  details: Prisma.JsonObject,
) {
  if (!prisma) {
    return;
  }

  const updateResult = await prisma.syncWorker.updateMany({
    where: { name: WORKER_NAME },
    data: {
      status,
      details,
    },
  });

  if (updateResult.count === 0) {
    await prisma.syncWorker.create({
      data: {
        name: WORKER_NAME,
        status,
        details,
      },
    });
  }
}
