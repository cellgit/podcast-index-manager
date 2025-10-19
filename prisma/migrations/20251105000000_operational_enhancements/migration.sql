-- Create enums for editorial workflow
CREATE TYPE "PodcastEditorialStatus" AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED');
CREATE TYPE "PodcastEditorialPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- Extend sync logs to track queue job linkage
ALTER TABLE "sync_logs"
ADD COLUMN "queue_job_id" VARCHAR(64);

CREATE INDEX "sync_logs_queue_job_idx" ON "sync_logs" ("queue_job_id");

-- Editorial metadata for podcasts
CREATE TABLE "podcast_editorials" (
    "podcast_id" INTEGER NOT NULL,
    "status" "PodcastEditorialStatus" NOT NULL DEFAULT 'ACTIVE',
    "priority" "PodcastEditorialPriority" NOT NULL DEFAULT 'NORMAL',
    "display_title" TEXT,
    "display_author" TEXT,
    "display_image" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "podcast_editorials_pkey" PRIMARY KEY ("podcast_id"),
    CONSTRAINT "podcast_editorials_podcast_id_fkey"
      FOREIGN KEY ("podcast_id")
      REFERENCES "podcasts"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE
);
