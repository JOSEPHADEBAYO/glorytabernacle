-- Add new departmental-board fields to Group, including a unique slug.

-- AlterTable: add columns nullable so existing rows are preserved.
ALTER TABLE "Group" ADD COLUMN "slug" TEXT;
ALTER TABLE "Group" ADD COLUMN "scripture" TEXT;
ALTER TABLE "Group" ADD COLUMN "headTitle" TEXT;
ALTER TABLE "Group" ADD COLUMN "responsibilities" JSONB;
ALTER TABLE "Group" ADD COLUMN "programmes" JSONB;
ALTER TABLE "Group" ADD COLUMN "specialRole" JSONB;
ALTER TABLE "Group" ADD COLUMN "furnishStatement" TEXT;
ALTER TABLE "Group" ADD COLUMN "transformStatement" TEXT;
ALTER TABLE "Group" ADD COLUMN "influenceStatement" TEXT;

-- Backfill slug from title for any existing rows.
-- Strategy: lowercase + strip non-alphanumeric (keep spaces) + collapse spaces to hyphens.
-- If two existing rows produce the same slug the unique-index step below will fail;
-- in that case, edit the offending row's slug manually before re-running this migration.
UPDATE "Group"
SET "slug" = trim(both '-' from regexp_replace(
  lower(regexp_replace("title", '[^a-zA-Z0-9 ]', '', 'g')),
  '\s+',
  '-',
  'g'
))
WHERE "slug" IS NULL;

-- Now enforce NOT NULL and uniqueness.
ALTER TABLE "Group" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Group_slug_key" ON "Group"("slug");
