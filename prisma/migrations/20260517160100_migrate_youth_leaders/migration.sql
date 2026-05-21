-- Backfill: any user currently labelled YOUTH but who actually has a
-- password (youth *members* sign in via Google OAuth and have no
-- passwordHash) is a mis-labelled leader created before the YOUTH_LEADER
-- role existed. Move them to YOUTH_LEADER.

UPDATE "User"
SET    "role" = 'YOUTH_LEADER'
WHERE  "role" = 'YOUTH'
  AND  "passwordHash" IS NOT NULL;
