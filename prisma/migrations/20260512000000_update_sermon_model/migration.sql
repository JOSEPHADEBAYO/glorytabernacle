ALTER TABLE "Sermon" RENAME COLUMN "preacher" TO "speaker";

ALTER TABLE "Sermon" ADD COLUMN "series" TEXT;
ALTER TABLE "Sermon" ADD COLUMN "duration" TEXT NOT NULL DEFAULT '0 min';

UPDATE "Sermon"
SET
  "description" = COALESCE("description", ''),
  "thumbnail" = COALESCE("thumbnail", 'https://placehold.co/1200x675/png?text=Sermon'),
  "videoUrl" = COALESCE("videoUrl", 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

ALTER TABLE "Sermon" ALTER COLUMN "description" SET NOT NULL;
ALTER TABLE "Sermon" ALTER COLUMN "thumbnail" SET NOT NULL;
ALTER TABLE "Sermon" ALTER COLUMN "videoUrl" SET NOT NULL;

ALTER TABLE "Sermon" DROP COLUMN IF EXISTS "audioUrl";

CREATE INDEX IF NOT EXISTS "Sermon_series_idx" ON "Sermon"("series");
