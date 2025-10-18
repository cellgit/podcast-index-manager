-- CreateTable
CREATE TABLE "sync_workers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL,
    "last_seen" TIMESTAMP(3) NOT NULL,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_workers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcast_collections" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "podcast_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "podcast_collection_items" (
    "collection_id" INTEGER NOT NULL,
    "podcast_id" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "podcast_collection_items_pkey" PRIMARY KEY ("collection_id","podcast_id")
);

-- CreateTable
CREATE TABLE "quality_alerts" (
    "id" SERIAL NOT NULL,
    "severity" VARCHAR(16) NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" VARCHAR(16) NOT NULL DEFAULT 'open',
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "quality_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_workers_name_idx" ON "sync_workers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "podcast_collections_name_unique" ON "podcast_collections"("name");

-- CreateIndex
CREATE INDEX "collection_items_podcast_idx" ON "podcast_collection_items"("podcast_id");

-- CreateIndex
CREATE INDEX "quality_alerts_status_idx" ON "quality_alerts"("status");

-- AddForeignKey
ALTER TABLE "podcast_collection_items" ADD CONSTRAINT "podcast_collection_items_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "podcast_collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "podcast_collection_items" ADD CONSTRAINT "podcast_collection_items_podcast_id_fkey" FOREIGN KEY ("podcast_id") REFERENCES "podcasts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
