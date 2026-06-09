-- Add explicit photography opt-in to InauguralRegistration. Default `false`
-- so any rows registered before this migration land as "no photography" —
-- the safer default for GDPR / image-rights purposes (the photography team
-- will only photograph attendees who actively opted in).

ALTER TABLE "InauguralRegistration"
  ADD COLUMN "photographyConsent" BOOLEAN NOT NULL DEFAULT false;
