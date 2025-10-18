import { Queue, QueueEvents } from "bullmq";

import { QUEUE_NAME, createRedisConnection, type QueueBundle } from "./config";

const globalRef = globalThis as unknown as {
  __podcastQueue?: QueueBundle;
};

export function getQueueBundle(): QueueBundle | null {
  if (globalRef.__podcastQueue) {
    return globalRef.__podcastQueue;
  }

  try {
    const connection = createRedisConnection();
    const queue = new Queue(QUEUE_NAME, { connection });
    const events = new QueueEvents(QUEUE_NAME, { connection });
    const bundle: QueueBundle = { queue, events };
    globalRef.__podcastQueue = bundle;
    return bundle;
  } catch (error) {
    console.error("无法连接 Redis，任务队列功能将禁用", error);
    return null;
  }
}

export async function addQueueJob<T>(name: string, payload: T) {
  const bundle = getQueueBundle();
  if (!bundle) {
    throw new Error("任务队列未启用，无法创建任务");
  }
  return bundle.queue.add(name, payload, {
    removeOnComplete: true,
    removeOnFail: false,
  });
}
