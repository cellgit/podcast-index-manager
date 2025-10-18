import { Queue, QueueEvents, Worker } from "bullmq";
import IORedis from "ioredis";

export const QUEUE_NAME = "podcast-sync";

export function createRedisConnection() {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL 未配置，无法初始化任务队列");
  }
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export type QueueBundle = {
  queue: Queue;
  events: QueueEvents;
  worker?: Worker;
};

export async function pingRedisConnection() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL 未配置");
  }
  const connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
  });
  try {
    await connection.ping();
  } finally {
    connection.disconnect();
  }
}
