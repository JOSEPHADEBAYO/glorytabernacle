-- Generalise PushSubscription so anonymous public-site visitors can subscribe
-- to topical pushes (Mount Up daily prayer reminder), not just logged-in
-- youth. Two changes:
--
--   1. Make userId nullable (anonymous subscriptions have no User row).
--   2. Add a topic enum (YOUTH_CHECKOUT | MOUNT_UP) so a single send target
--      can be filtered by topic. Existing rows are classified as
--      YOUTH_CHECKOUT (the original purpose of this table).
--
-- The FK on userId stays ON DELETE CASCADE so when a youth account is
-- deleted, their subscriptions are still cleaned up automatically. Anonymous
-- rows (userId NULL) carry no FK constraint and persist until pruned via the
-- 404/410 cleanup in lib/push.ts or explicit unsubscribe.

-- 1. Drop the NOT NULL on userId.
ALTER TABLE "PushSubscription" ALTER COLUMN "userId" DROP NOT NULL;

-- 2. Create the topic enum and add the column with the safe default for
--    existing rows.
CREATE TYPE "PushTopic" AS ENUM ('YOUTH_CHECKOUT', 'MOUNT_UP');

ALTER TABLE "PushSubscription"
  ADD COLUMN "topic" "PushTopic" NOT NULL DEFAULT 'YOUTH_CHECKOUT';

-- 3. Index topic so the admin notify endpoints can filter cheaply.
CREATE INDEX "PushSubscription_topic_idx" ON "PushSubscription"("topic");
