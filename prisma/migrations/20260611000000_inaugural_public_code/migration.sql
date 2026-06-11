-- Add a 4-digit random `publicCode` column to InauguralRegistration so the
-- public-facing badge ID no longer leaks the sequential serialNumber.
--
-- The column is nullable: existing rows keep their serial-style ID
-- (formatRegistrationId falls back to padded serialNumber when publicCode
-- is null). Only registrations created after this migration deploys carry
-- a random publicCode.
--
-- A unique constraint protects against accidental duplicates; the
-- generator (lib/inaugural/generate-public-code.ts) also rejects codes
-- that collide with any existing serialNumber so a 4-digit ID is never
-- ambiguous between a legacy row and a new random one.

ALTER TABLE "InauguralRegistration"
  ADD COLUMN "publicCode" TEXT;

CREATE UNIQUE INDEX "InauguralRegistration_publicCode_key"
  ON "InauguralRegistration"("publicCode");
