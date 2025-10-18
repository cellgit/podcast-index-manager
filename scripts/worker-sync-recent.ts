#!/usr/bin/env node
import "dotenv/config";

import { registerSyncRecentWorker } from "../src/jobs/sync-recent";
import { logger } from "../src/lib/logger";

function main() {
  try {
    const worker = registerSyncRecentWorker();
    logger.info({ workerId: worker.id }, "sync-recent worker started");

    const shutdown = async (signal: NodeJS.Signals) => {
      logger.info({ signal }, "sync-recent worker shutting down");
      await worker.close();
      logger.info("sync-recent worker stopped");
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
    process.on("uncaughtException", (error) => {
      logger.fatal({ err: error }, "uncaught exception in worker");
      process.exit(1);
    });
    process.on("unhandledRejection", (reason) => {
      logger.fatal({ err: reason }, "unhandled rejection in worker");
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ err: error }, "failed to start sync-recent worker");
    process.exit(1);
  }
}

main();
