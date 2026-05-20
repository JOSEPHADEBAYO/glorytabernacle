-- Safeguarding concern log + Designated Safeguarding Lead (DSL) flag.
--
--   * User.isDesignatedSafeguardingLead — only DSLs and SUPER_ADMINs may
--     read / manage the concern log.
--   * SafeguardingConcern — the log itself. Any CHILDREN_LEADER / SUPER_ADMIN
--     may raise one; it may optionally link to a registered child (childName
--     snapshots the name so the record survives child deletion / supports
--     standalone concerns).

-- 1. DSL flag on User
ALTER TABLE "User"
  ADD COLUMN "isDesignatedSafeguardingLead" BOOLEAN NOT NULL DEFAULT false;

-- 2. Enums
CREATE TYPE "ConcernType" AS ENUM (
  'DISCLOSURE',
  'PHYSICAL',
  'EMOTIONAL',
  'SEXUAL',
  'NEGLECT',
  'BEHAVIOURAL',
  'ONLINE',
  'ALLEGATION_AGAINST_ADULT',
  'OTHER'
);

CREATE TYPE "ConcernStatus" AS ENUM ('OPEN', 'MONITORING', 'CLOSED');

-- 3. SafeguardingConcern table
CREATE TABLE "SafeguardingConcern" (
  "id"             TEXT NOT NULL,
  "childId"        TEXT,
  "childName"      TEXT,
  "concernType"    "ConcernType" NOT NULL,
  "description"    TEXT NOT NULL,
  "actionTaken"    TEXT,
  "whoNotified"    TEXT,
  "referredToMash" BOOLEAN NOT NULL DEFAULT false,
  "occurredAt"     TIMESTAMP(3) NOT NULL,
  "status"         "ConcernStatus" NOT NULL DEFAULT 'OPEN',
  "raisedById"     TEXT NOT NULL,
  "resolution"     TEXT,
  "closedById"     TEXT,
  "closedAt"       TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SafeguardingConcern_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SafeguardingConcern_status_idx" ON "SafeguardingConcern"("status");
CREATE INDEX "SafeguardingConcern_childId_idx" ON "SafeguardingConcern"("childId");
CREATE INDEX "SafeguardingConcern_occurredAt_idx" ON "SafeguardingConcern"("occurredAt");
CREATE INDEX "SafeguardingConcern_referredToMash_idx" ON "SafeguardingConcern"("referredToMash");

ALTER TABLE "SafeguardingConcern"
  ADD CONSTRAINT "SafeguardingConcern_raisedById_fkey"
  FOREIGN KEY ("raisedById") REFERENCES "User"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SafeguardingConcern"
  ADD CONSTRAINT "SafeguardingConcern_closedById_fkey"
  FOREIGN KEY ("closedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SafeguardingConcern"
  ADD CONSTRAINT "SafeguardingConcern_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "Child"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
