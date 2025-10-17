-- RenameForeignKey
ALTER TABLE "episodes" RENAME CONSTRAINT "Episode_podcast_id_fkey" TO "episodes_podcast_id_fkey";

-- RenameForeignKey
ALTER TABLE "sync_logs" RENAME CONSTRAINT "SyncLog_podcast_id_fkey" TO "sync_logs_podcast_id_fkey";
