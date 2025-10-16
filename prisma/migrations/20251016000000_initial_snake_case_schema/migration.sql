-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Podcast" (
    "id" SERIAL NOT NULL,
    "podcast_index_id" INTEGER,
    "podcast_guid" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "owner_name" TEXT,
    "language" VARCHAR(32),
    "image" TEXT,
    "artwork" TEXT,
    "description" TEXT,
    "categories" JSONB,
    "last_update_time" TIMESTAMP(3),
    "last_crawl_time" TIMESTAMP(3),
    "last_parse_time" TIMESTAMP(3),
    "newest_item_published" TIMESTAMP(3),
    "episode_count" INTEGER DEFAULT 0,
    "explicit" BOOLEAN DEFAULT false,
    "medium" VARCHAR(32),
    "locked" BOOLEAN DEFAULT false,
    "feed_url" TEXT,
    "website_url" TEXT,
    "funding" JSONB,
    "value" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Podcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" SERIAL NOT NULL,
    "podcast_id" INTEGER NOT NULL,
    "podcast_index_id" BIGINT,
    "guid" VARCHAR(255),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT,
    "enclosure_url" TEXT,
    "enclosure_type" VARCHAR(128),
    "enclosure_length" INTEGER DEFAULT 0,
    "duration" INTEGER,
    "explicit" BOOLEAN DEFAULT false,
    "image" TEXT,
    "season" INTEGER,
    "episode" INTEGER,
    "transcript_url" TEXT,
    "chapters_url" TEXT,
    "persons" JSONB,
    "social_interact" JSONB,
    "value" JSONB,
    "date_published" TIMESTAMP(3),
    "date_crawled" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" SERIAL NOT NULL,
    "podcast_id" INTEGER,
    "job_type" VARCHAR(64) NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "payload" JSONB,
    "error" JSONB,
    "message" TEXT,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncCursor" (
    "id" TEXT NOT NULL,
    "cursor" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncCursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_podcast_index_id_unique" ON "Podcast"("podcast_index_id");

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_podcast_guid_unique" ON "Podcast"("podcast_guid");

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_feed_url_unique" ON "Podcast"("feed_url");

-- CreateIndex
CREATE INDEX "podcasts_title_idx" ON "Podcast" USING HASH ("title");

-- CreateIndex
CREATE INDEX "podcasts_language_idx" ON "Podcast"("language");

-- CreateIndex
CREATE INDEX "podcasts_updated_idx" ON "Podcast"("updated_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "episodes_podcast_index_id_unique" ON "Episode"("podcast_index_id");

-- CreateIndex
CREATE INDEX "episodes_podcast_published_idx" ON "Episode"("podcast_id", "date_published" DESC);

-- CreateIndex
CREATE INDEX "episodes_published_idx" ON "Episode"("date_published" DESC);

-- CreateIndex
CREATE INDEX "episodes_title_idx" ON "Episode" USING HASH ("title");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_podcast_guid_unique" ON "Episode"("podcast_id", "guid");

-- CreateIndex
CREATE INDEX "sync_logs_status_started_idx" ON "SyncLog"("status", "started_at" DESC);

-- CreateIndex
CREATE INDEX "sync_logs_podcast_started_idx" ON "SyncLog"("podcast_id", "started_at" DESC);

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_podcast_id_fkey" FOREIGN KEY ("podcast_id") REFERENCES "Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_podcast_id_fkey" FOREIGN KEY ("podcast_id") REFERENCES "Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

