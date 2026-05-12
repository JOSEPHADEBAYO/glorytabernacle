-- AlterTable: add featured + featuredOrder to existing Book rows.
-- Defaults are applied by the column definition, so existing rows pick them up.
ALTER TABLE "Book" ADD COLUMN "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Book" ADD COLUMN "featuredOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Book_featured_idx" ON "Book"("featured");

-- CreateIndex
CREATE INDEX "Book_featuredOrder_idx" ON "Book"("featuredOrder");
