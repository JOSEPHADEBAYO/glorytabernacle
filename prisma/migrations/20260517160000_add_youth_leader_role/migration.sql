-- Add the YOUTH_LEADER role. This is the staff member who manages the youth
-- ministry from the dashboard. It is distinct from YOUTH, which is reserved
-- for actual youth *members* (Google-OAuth youth-portal accounts).
--
-- NOTE: Postgres forbids using a newly-added enum value in the same
-- transaction, so the data backfill (migrating mis-labelled leaders) lives
-- in the next migration, 20260517160100_migrate_youth_leaders.

ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'YOUTH_LEADER';
