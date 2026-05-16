-- Children's-ministry hand-over: parent-self-service OAuth flow → staff-managed
-- model run by a new CHILDREN_LEADER role. This migration:
--   1. Adds CHILDREN_LEADER to the UserRole enum
--   2. Adds primary-guardian columns to Child
--   3. Backfills the new columns from existing _ParentToChild rows, falling
--      back to the emergency contact for any orphaned children
--   4. Enforces NOT NULL on the new required columns
--   5. Drops the _ParentToChild many-to-many join table
--
-- Existing PARENT users are left in place — the ChildCheckIn FK constraint
-- (onDelete: Restrict) prevents deletion of users who have signed children
-- in/out, and we want to preserve that audit trail. The PARENT enum value
-- therefore also stays for now; it is marked deprecated in schema.prisma
-- and is no longer assigned by application code.

-- 1. Add CHILDREN_LEADER to UserRole
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CHILDREN_LEADER';

-- 2. Add the primary-guardian columns as NULLABLE so we can backfill.
ALTER TABLE "Child"
  ADD COLUMN "primaryGuardianName"  TEXT,
  ADD COLUMN "primaryGuardianPhone" TEXT,
  ADD COLUMN "primaryGuardianEmail" TEXT;

-- 3. Backfill from any existing parent linked via the M:M join table.
--    Picks the lowest-id parent per child for determinism.
UPDATE "Child" c
SET    "primaryGuardianName"  = u."name",
       "primaryGuardianPhone" = COALESCE(u."phoneNumber", c."emergencyContactPhone"),
       "primaryGuardianEmail" = u."email"
FROM   "_ParentToChild" p
JOIN   "User" u ON u."id" = p."B"
WHERE  p."A" = c."id"
  AND  c."primaryGuardianName" IS NULL
  AND  u."id" = (
    SELECT u2."id"
    FROM   "_ParentToChild" p2
    JOIN   "User" u2 ON u2."id" = p2."B"
    WHERE  p2."A" = c."id"
    ORDER  BY u2."id"
    LIMIT  1
  );

-- 4. For any child still missing a primary guardian (no parent linked),
--    fall back to the emergency contact details so the NOT NULL constraint
--    can be enforced. The Children Leader can revise these via the UI.
UPDATE "Child"
SET    "primaryGuardianName"  = "emergencyContactName",
       "primaryGuardianPhone" = "emergencyContactPhone"
WHERE  "primaryGuardianName" IS NULL;

-- 5. Enforce NOT NULL on the now-populated required columns.
ALTER TABLE "Child"
  ALTER COLUMN "primaryGuardianName"  SET NOT NULL,
  ALTER COLUMN "primaryGuardianPhone" SET NOT NULL;

-- 6. Drop the parent <-> child join table. The Child rows and PARENT User
--    rows remain; only the link between them is severed.
DROP TABLE IF EXISTS "_ParentToChild";
