-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "podcasts" (
    "id" SERIAL NOT NULL,
    "podcast_index_id" INTEGER,
    "podcast_guid" TEXT,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "original_url" TEXT,
    "link" TEXT,
    "description" TEXT,
    "author" TEXT,
    "owner_name" TEXT,
    "owner_email" TEXT,
    "image" TEXT,
    "artwork" TEXT,
    "last_update_time" TIMESTAMP(3),
    "last_crawl_time" TIMESTAMP(3),
    "last_parse_time" TIMESTAMP(3),
    "last_good_http_status_time" TIMESTAMP(3),
    "last_http_status" INTEGER,
    "content_type" TEXT,
    "itunes_id" INTEGER,
    "itunes_type" TEXT,
    "generator" TEXT,
    "language" VARCHAR(64),
    "explicit" BOOLEAN DEFAULT false,
    "type" INTEGER,
    "medium" VARCHAR(32),
    "dead" INTEGER DEFAULT 0,
    "priority" INTEGER,
    "in_polling_queue" BOOLEAN,
    "chash" TEXT,
    "created_on" TIMESTAMP(3),
    "episode_count" INTEGER DEFAULT 0,
    "crawl_errors" INTEGER DEFAULT 0,
    "parse_errors" INTEGER DEFAULT 0,
    "locked" BOOLEAN DEFAULT false,
    "image_url_hash" BIGINT,
    "newest_item_pubdate" TIMESTAMP(3),
    "popularity" INTEGER,
    "trend_score" INTEGER,
    "duplicate_of_feed_id" INTEGER,
    "value_created_on" TIMESTAMP(3),
    "value_block" TEXT,
    "funding_url" TEXT,
    "funding_message" TEXT,
    "value_model_type" TEXT,
    "value_model_method" TEXT,
    "value_model_suggested" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "podcasts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episodes" (
    "id" SERIAL NOT NULL,
    "podcast_id" INTEGER NOT NULL,
    "feed_id" INTEGER,
    "podcast_index_id" BIGINT,
    "guid" VARCHAR(512),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT,
    "date_published" TIMESTAMP(3),
    "date_crawled" TIMESTAMP(3),
    "enclosure_url" TEXT,
    "enclosure_type" VARCHAR(128),
    "enclosure_length" INTEGER DEFAULT 0,
    "duration" INTEGER,
    "explicit" BOOLEAN DEFAULT false,
    "episode" INTEGER,
    "episode_type" VARCHAR(32),
    "season" INTEGER,
    "image" TEXT,
    "image_url_hash" BIGINT,
    "feed_itunes_id" INTEGER,
    "feed_image" TEXT,
    "feed_image_url_hash" BIGINT,
    "feed_url" TEXT,
    "feed_title" TEXT,
    "feed_author" TEXT,
    "feed_language" TEXT,
    "feed_dead" INTEGER,
    "feed_duplicate_of" INTEGER,
    "transcript_url" TEXT,
    "chapters_url" TEXT,
    "content_link" TEXT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "status" VARCHAR(32),
    "value_model_type" TEXT,
    "value_model_method" TEXT,
    "value_model_suggested" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" SERIAL NOT NULL,
    "podcast_id" INTEGER,
    "job_type" VARCHAR(64) NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "payload" JSONB,
    "error" JSONB,
    "message" TEXT,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_cursors" (
    "id" TEXT NOT NULL,
    "cursor" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_cursors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcast_categories" (
    "podcast_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "podcast_categories_pkey" PRIMARY KEY ("podcast_id","category_id")
);

-- CreateTable
CREATE TABLE "podcast_value_destinations" (
    "id" SERIAL NOT NULL,
    "podcast_id" INTEGER NOT NULL,
    "name" TEXT,
    "address" TEXT NOT NULL,
    "type" TEXT,
    "split" INTEGER,
    "fee" BOOLEAN,
    "custom_key" TEXT,
    "custom_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "podcast_value_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_transcripts" (
    "id" SERIAL NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT,
    "language" TEXT,
    "rel" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_persons" (
    "id" SERIAL NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "person_index_id" INTEGER,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "group" TEXT,
    "href" TEXT,
    "img" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_soundbites" (
    "id" SERIAL NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "start_time" INTEGER NOT NULL,
    "duration" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_soundbites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_social_interactions" (
    "id" SERIAL NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "protocol" TEXT NOT NULL,
    "account_id" TEXT,
    "account_url" TEXT,
    "priority" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_social_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "episode_value_destinations" (
    "id" SERIAL NOT NULL,
    "episode_id" INTEGER NOT NULL,
    "name" TEXT,
    "address" TEXT NOT NULL,
    "type" TEXT,
    "split" INTEGER,
    "fee" BOOLEAN,
    "custom_key" TEXT,
    "custom_value" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "episode_value_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_podcast_index_id_unique" ON "podcasts"("podcast_index_id");

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_podcast_guid_unique" ON "podcasts"("podcast_guid");

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_url_unique" ON "podcasts"("url");

-- CreateIndex
CREATE INDEX "podcasts_title_idx" ON "podcasts" USING HASH ("title");

-- CreateIndex
CREATE INDEX "podcasts_language_idx" ON "podcasts"("language");

-- CreateIndex
CREATE INDEX "podcasts_updated_idx" ON "podcasts"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "podcasts_index_id_idx" ON "podcasts"("podcast_index_id");

-- CreateIndex
CREATE INDEX "podcasts_itunes_idx" ON "podcasts"("itunes_id");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_podcast_index_id_unique" ON "episodes"("podcast_index_id");

-- CreateIndex
CREATE INDEX "episodes_podcast_published_idx" ON "episodes"("podcast_id", "date_published" DESC);

-- CreateIndex
CREATE INDEX "episodes_published_idx" ON "episodes"("date_published" DESC);

-- CreateIndex
CREATE INDEX "episodes_title_idx" ON "episodes" USING HASH ("title");

-- CreateIndex
CREATE INDEX "episodes_feed_idx" ON "episodes"("feed_id");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_podcast_guid_unique" ON "episodes"("podcast_id", "guid");

-- CreateIndex
CREATE INDEX "sync_logs_status_started_idx" ON "sync_logs"("status", "started_at" DESC);

-- CreateIndex
CREATE INDEX "sync_logs_podcast_started_idx" ON "sync_logs"("podcast_id", "started_at" DESC);

-- CreateIndex
CREATE INDEX "podcast_categories_category_idx" ON "podcast_categories"("category_id");

-- CreateIndex
CREATE INDEX "podcast_value_destinations_podcast_idx" ON "podcast_value_destinations"("podcast_id");

-- CreateIndex
CREATE INDEX "episode_transcripts_episode_idx" ON "episode_transcripts"("episode_id");

-- CreateIndex
CREATE UNIQUE INDEX "episode_transcripts_episode_url_unique" ON "episode_transcripts"("episode_id", "url");

-- CreateIndex
CREATE INDEX "episode_persons_episode_idx" ON "episode_persons"("episode_id");

-- CreateIndex
CREATE INDEX "episode_soundbites_episode_idx" ON "episode_soundbites"("episode_id");

-- CreateIndex
CREATE INDEX "episode_social_interactions_episode_idx" ON "episode_social_interactions"("episode_id");

-- CreateIndex
CREATE INDEX "episode_value_destinations_episode_idx" ON "episode_value_destinations"("episode_id");

-- AddForeignKey
ALTER TABLE "episodes" ADD CONSTRAINT "episodes_podcast_id_fkey" FOREIGN KEY ("podcast_id") REFERENCES "podcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_podcast_id_fkey" FOREIGN KEY ("podcast_id") REFERENCES "podcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_categories" ADD CONSTRAINT "podcast_categories_podcast_id_fkey" FOREIGN KEY ("podcast_id") REFERENCES "podcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_categories" ADD CONSTRAINT "podcast_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_value_destinations" ADD CONSTRAINT "podcast_value_destinations_podcast_id_fkey" FOREIGN KEY ("podcast_id") REFERENCES "podcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_transcripts" ADD CONSTRAINT "episode_transcripts_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_persons" ADD CONSTRAINT "episode_persons_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_soundbites" ADD CONSTRAINT "episode_soundbites_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_social_interactions" ADD CONSTRAINT "episode_social_interactions_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "episode_value_destinations" ADD CONSTRAINT "episode_value_destinations_episode_id_fkey" FOREIGN KEY ("episode_id") REFERENCES "episodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
