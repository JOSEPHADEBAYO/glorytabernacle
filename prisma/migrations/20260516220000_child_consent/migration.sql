-- UK GDPR consent capture on Child rows.
--
-- Article 6 (lawful basis) + Article 9 (special-category data — health /
-- allergies / medical notes) require explicit consent. We capture four
-- flags plus a timestamp + a snapshot of who gave consent.
--
-- Defaults are FALSE so legacy rows are clearly distinguishable from
-- newly-registered children. The application enforces that registrations
-- carry the three mandatory consents (data processing, medical info
-- sharing, emergency treatment); photography is optional.

ALTER TABLE "Child"
  ADD COLUMN "consentDataProcessing"     BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "consentPhotography"        BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "consentMedicalInfoSharing" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "consentEmergencyTreatment" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "consentCapturedAt"         TIMESTAMP(3),
  ADD COLUMN "consentByName"             TEXT;
