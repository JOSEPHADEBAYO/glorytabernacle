-- Extend InauguralRegistration to capture whether the registrant is bringing
-- children, how many, the age groups (stored as a JSON array of short
-- labels — "Under 2", "2-5", "6-11", "12-17"), and any special needs to be
-- aware of. Only `bringingChildren` is required at the DB level (defaults
-- to false). The other three are nullable and only populated when the
-- registrant ticks "yes"; Zod enforces that pairing on the public POST
-- endpoint so we never get incoherent rows.

ALTER TABLE "InauguralRegistration"
  ADD COLUMN "bringingChildren"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "numberOfChildren"     INTEGER,
  ADD COLUMN "childrenAgeGroups"    JSONB,
  ADD COLUMN "childrenSpecialNeeds" TEXT;
