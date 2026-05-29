-- Add gender to VolunteerInterest, reusing the existing Postgres `Gender`
-- enum (MALE | FEMALE) already used by GroupMember.
--
-- The column is nullable so any existing volunteer-interest rows survive the
-- migration without a backfill. The Zod validation in
-- lib/validation/volunteer-interest.ts requires gender on every new
-- submission, so going forward all rows will have a value.

ALTER TABLE "VolunteerInterest" ADD COLUMN "gender" "Gender";
