#!/usr/bin/env node
import "dotenv/config";
import process from "node:process";

import { createPodcastIndexClient } from "../src/lib/podcast-index";
import { PodcastService } from "../src/services/podcast-service";
import { prisma } from "../src/lib/prisma";

async function main() {
  if (!prisma) {
    console.error("DATABASE_URL is not configured. Cannot run sync.");
    process.exit(1);
  }

  const client = createPodcastIndexClient();
  const service = new PodcastService(client, prisma);

  const summary = await service.syncRecentData();

  console.log(
    [
      "[sync-recent-data]",
      `feeds=${summary.feedsProcessed}`,
      `episodes=${summary.episodesProcessed}`,
      `nextSince=${summary.nextSince ?? "n/a"}`,
    ].join(" "),
  );
}

main()
  .catch((error) => {
    console.error("Failed to sync recent data", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });
