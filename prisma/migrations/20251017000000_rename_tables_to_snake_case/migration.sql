-- Rename tables to snake_case for consistency with Prisma mappings
ALTER TABLE "Podcast" RENAME TO "podcasts";
ALTER TABLE "Episode" RENAME TO "episodes";
ALTER TABLE "SyncLog" RENAME TO "sync_logs";
ALTER TABLE "SyncCursor" RENAME TO "sync_cursors";

-- Rename primary key indexes to match new table names
ALTER INDEX "Podcast_pkey" RENAME TO "podcasts_pkey";
ALTER INDEX "Episode_pkey" RENAME TO "episodes_pkey";
ALTER INDEX "SyncLog_pkey" RENAME TO "sync_logs_pkey";
ALTER INDEX "SyncCursor_pkey" RENAME TO "sync_cursors_pkey";

-- Rename auto-generated sequences created by SERIAL columns
ALTER SEQUENCE "Podcast_id_seq" RENAME TO "podcasts_id_seq";
ALTER SEQUENCE "Episode_id_seq" RENAME TO "episodes_id_seq";
ALTER SEQUENCE "SyncLog_id_seq" RENAME TO "sync_logs_id_seq";
