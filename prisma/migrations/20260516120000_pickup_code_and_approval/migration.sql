-- Safeguarding follow-up migration:
--   1. ChildCheckIn.pickupCode — 6-digit code generated at sign-in and
--      emailed to the primary guardian. Required at sign-out to release the
--      child. Plaintext column; lives only for the duration of an open
--      check-in.
--   2. Child.approved — gate-keeping flag for parent-submitted records.
--      Defaults to true so every existing child stays visible. Public
--      /parent/register submissions store false and must be approved by a
--      Children Leader from /dashboard/children → Pending tab.

ALTER TABLE "ChildCheckIn"
  ADD COLUMN "pickupCode" TEXT;

ALTER TABLE "Child"
  ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX "Child_approved_idx" ON "Child"("approved");
