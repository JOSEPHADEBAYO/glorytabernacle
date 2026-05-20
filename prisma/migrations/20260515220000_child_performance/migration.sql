-- Children's-ministry performance notes. Each ChildCheckIn can carry an
-- optional free-text "performance" note that the teacher writes about the
-- child's session. It may be entered at sign-out, or filled in later — the
-- separate `performanceUpdatedAt` timestamp lets us show "last edited" in
-- the UI without conflating it with the row's natural update history.

ALTER TABLE "ChildCheckIn"
  ADD COLUMN "performance"          TEXT,
  ADD COLUMN "performanceUpdatedAt" TIMESTAMP(3);
