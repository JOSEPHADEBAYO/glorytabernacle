-- Authorised collectors per child + pickup audit snapshot on ChildCheckIn.
--
-- AuthorisedCollector lists adults (additional to the primary guardian)
-- who are permitted to collect a child. At sign-out the leader picks who
-- is collecting; the chosen name + relationship are SNAPSHOTTED onto the
-- ChildCheckIn so the audit trail survives later edits/deletions to the
-- collectors list.

-- 1. AuthorisedCollector table
CREATE TABLE "AuthorisedCollector" (
  "id"           TEXT NOT NULL,
  "childId"      TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "relationship" TEXT NOT NULL,
  "phone"        TEXT,
  "photoUrl"     TEXT,
  "notes"        TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AuthorisedCollector_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuthorisedCollector_childId_idx" ON "AuthorisedCollector"("childId");

ALTER TABLE "AuthorisedCollector"
  ADD CONSTRAINT "AuthorisedCollector_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "Child"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Pickup audit snapshot on ChildCheckIn
ALTER TABLE "ChildCheckIn"
  ADD COLUMN "collectedByName"         TEXT,
  ADD COLUMN "collectedByRelationship" TEXT,
  ADD COLUMN "collectedFromList"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "collectionNotes"         TEXT;

CREATE INDEX "ChildCheckIn_collectedFromList_idx"
  ON "ChildCheckIn"("collectedFromList");
