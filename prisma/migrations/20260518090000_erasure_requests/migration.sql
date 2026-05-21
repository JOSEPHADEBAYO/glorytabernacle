-- UK GDPR right-to-erasure requests.
--
-- A parent submits a request via the public form; staff review the queue and
-- run the "erase all data" action. `childId` is a best-effort match (set
-- null when the matched child is later deleted, so the request survives as a
-- record that erasure was carried out).

CREATE TYPE "ErasureStatus" AS ENUM ('PENDING', 'COMPLETED', 'DISMISSED');

CREATE TABLE "ErasureRequest" (
  "id"            TEXT NOT NULL,
  "childName"     TEXT NOT NULL,
  "guardianName"  TEXT NOT NULL,
  "guardianEmail" TEXT NOT NULL,
  "message"       TEXT,
  "status"        "ErasureStatus" NOT NULL DEFAULT 'PENDING',
  "childId"       TEXT,
  "handledById"   TEXT,
  "handledAt"     TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ErasureRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ErasureRequest_status_idx" ON "ErasureRequest"("status");
CREATE INDEX "ErasureRequest_createdAt_idx" ON "ErasureRequest"("createdAt");

ALTER TABLE "ErasureRequest"
  ADD CONSTRAINT "ErasureRequest_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "Child"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "ErasureRequest_handledById_idx" ON "ErasureRequest"("handledById");

-- The staff member who actioned the request. Kept (SET NULL) if that user is
-- later removed, so the request survives as an audit record.
ALTER TABLE "ErasureRequest"
  ADD CONSTRAINT "ErasureRequest_handledById_fkey"
  FOREIGN KEY ("handledById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
