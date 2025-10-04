-- AlterTable
ALTER TABLE "WishlistItem" ADD COLUMN "lastStreamingUpdate" DATETIME;
ALTER TABLE "WishlistItem" ADD COLUMN "streamingData" JSONB;
