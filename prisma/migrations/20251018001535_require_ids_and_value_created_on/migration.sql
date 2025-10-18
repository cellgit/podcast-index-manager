/*
  Warnings:

  - Made the column `feed_id` on table `episodes` required. This step will fail if there are existing NULL values in that column.
  - Made the column `podcast_index_id` on table `podcasts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `url` on table `podcasts` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "episodes" ADD COLUMN     "value_created_on" TIMESTAMP(3),
ALTER COLUMN "feed_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "podcasts" ADD COLUMN     "oldest_item_pubdate" TIMESTAMP(3),
ALTER COLUMN "podcast_index_id" SET NOT NULL,
ALTER COLUMN "url" SET NOT NULL;
