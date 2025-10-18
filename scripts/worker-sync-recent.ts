#!/usr/bin/env node
import "dotenv/config";

import { registerSyncRecentWorker } from "../src/jobs/sync-recent";

function main() {
  const worker = registerSyncRecentWorker();
  console.info("[worker] sync-recent worker started", worker.id);
}

main();
