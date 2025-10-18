import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { serveStatic } from "@hono/node-server/serve-static";
import type { Hono } from "hono";

import { logger } from "@/lib/logger";

import { QUEUE_NAME } from "@/jobs/config";
import { getQueueBundle } from "@/jobs/queue";

const BASE_PATH = "/dashboard/queue";

type BullBoardState = {
  app: Hono;
  initialized: boolean;
  setQueues: ReturnType<typeof createBullBoard>["setQueues"];
};

const globalRef = globalThis as unknown as {
  __bullBoard?: BullBoardState;
};

function bootstrapBullBoard(): BullBoardState {
  if (globalRef.__bullBoard) {
    return globalRef.__bullBoard;
  }

  const serverAdapter = new HonoAdapter(serveStatic).setBasePath(BASE_PATH);
  const { setQueues } = createBullBoard({
    queues: [],
    serverAdapter,
    options: {
      uiConfig: {
        boardTitle: "Podcast Queue Dashboard",
      },
    },
  });

  const app = serverAdapter.registerPlugin();

  globalRef.__bullBoard = {
    app,
    setQueues,
    initialized: false,
  };

  return globalRef.__bullBoard;
}

export function getBullBoardApp() {
  const state = bootstrapBullBoard();

  if (!state.initialized) {
    const bundle = getQueueBundle();
    if (!bundle) {
      logger.error(
        "Bull Board requested but queue bundle could not be initialized",
      );
      throw new Error("任务队列未启用");
    }

    state.setQueues([new BullMQAdapter(bundle.queue, { readOnlyMode: false })]);
    state.initialized = true;
    logger.info(
      { queueName: QUEUE_NAME },
      "Bull Board queues registered",
    );
  }

  return state.app;
}
