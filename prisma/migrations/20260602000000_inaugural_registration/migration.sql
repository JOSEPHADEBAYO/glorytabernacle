-- Inaugural Service registration table. Each registrant gets a cuid `id`
-- (used in URLs / the QR-code payload internally) plus an auto-incrementing
-- `serialNumber` that drives the human-readable badge ID format
-- "GT-2026-0001" rendered on the badge and shared in the confirmation email.

CREATE TABLE "InauguralRegistration" (
    "id"                     TEXT NOT NULL,
    "serialNumber"           SERIAL NOT NULL,
    "firstName"              TEXT NOT NULL,
    "lastName"               TEXT NOT NULL,
    "email"                  TEXT NOT NULL,
    "gender"                 "Gender" NOT NULL,
    "address"                TEXT NOT NULL,
    "isRccgMember"           BOOLEAN NOT NULL,
    "fromOutsideBarnstaple"  BOOLEAN NOT NULL,
    "homeChurch"             TEXT,
    "createdAt"              TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InauguralRegistration_pkey" PRIMARY KEY ("id")
);

-- One registration per email (the public endpoint surfaces a clean error if
-- somebody tries to register twice from the same address).
CREATE UNIQUE INDEX "InauguralRegistration_email_key"
  ON "InauguralRegistration"("email");

-- Serial number is auto-generated; keep it unique so the human-readable ID
-- is always 1:1 with a single registration row.
CREATE UNIQUE INDEX "InauguralRegistration_serialNumber_key"
  ON "InauguralRegistration"("serialNumber");

-- Supports admin sorting + filtering by recency.
CREATE INDEX "InauguralRegistration_createdAt_idx"
  ON "InauguralRegistration"("createdAt");

-- Supports admin lookup by serial number.
CREATE INDEX "InauguralRegistration_serialNumber_idx"
  ON "InauguralRegistration"("serialNumber");
