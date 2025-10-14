-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "Podcast" (
    "id" SERIAL NOT NULL,
    "podcastIndexId" INTEGER,
    "podcastGuid" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "ownerName" TEXT,
    "language" VARCHAR(32),
    "image" TEXT,
    "artwork" TEXT,
    "description" TEXT,
    "categories" JSONB,
    "lastUpdateTime" TIMESTAMP(3),
    "lastCrawlTime" TIMESTAMP(3),
    "lastParseTime" TIMESTAMP(3),
    "newestItemPublished" TIMESTAMP(3),
    "episodeCount" INTEGER DEFAULT 0,
    "explicit" BOOLEAN DEFAULT false,
    "medium" VARCHAR(32),
    "locked" BOOLEAN DEFAULT false,
    "feedUrl" TEXT,
    "website_url" TEXT,
    "funding" JSONB,
    "value" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Podcast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" SERIAL NOT NULL,
    "podcastId" INTEGER NOT NULL,
    "podcastIndexId" INTEGER,
    "guid" VARCHAR(255),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "link" TEXT,
    "enclosureUrl" TEXT,
    "enclosureType" VARCHAR(128),
    "enclosureLength" INTEGER DEFAULT 0,
    "duration" INTEGER,
    "explicit" BOOLEAN DEFAULT false,
    "image" TEXT,
    "season" INTEGER,
    "episode" INTEGER,
    "transcriptUrl" TEXT,
    "chaptersUrl" TEXT,
    "persons" JSONB,
    "socialInteract" JSONB,
    "value" JSONB,
    "published_at" TIMESTAMP(3),
    "dateCrawled" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncLog" (
    "id" SERIAL NOT NULL,
    "podcastId" INTEGER,
    "jobType" VARCHAR(64) NOT NULL,
    "status" "SyncStatus" NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "payload" JSONB,
    "error" JSONB,
    "message" TEXT,

    CONSTRAINT "SyncLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncCursor" (
    "id" TEXT NOT NULL,
    "cursor" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SyncCursor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_podcast_index_id_unique" ON "Podcast"("podcastIndexId");

-- CreateIndex
CREATE UNIQUE INDEX "podcasts_podcast_guid_unique" ON "Podcast"("podcastGuid");

-- CreateIndex
CREATE UNIQUE INDEX "episodes_podcast_index_id_unique" ON "Episode"("podcastIndexId");

-- CreateIndex
CREATE INDEX "episodes_podcast_published_idx" ON "Episode"("podcastId", "published_at");

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncLog" ADD CONSTRAINT "SyncLog_podcastId_fkey" FOREIGN KEY ("podcastId") REFERENCES "Podcast"("id") ON DELETE CASCADE ON UPDATE CASCADE;
