-- Authenticated child / collector photos.
--
-- New uploads are stored as Cloudinary `authenticated` assets; we keep the
-- public_id and sign the delivery URL on read so a child's photo can't be
-- viewed by anyone who simply has the URL. `photoUrl` remains for legacy
-- public uploads and external URLs.

ALTER TABLE "Child"
  ADD COLUMN "photoPublicId" TEXT;

ALTER TABLE "AuthorisedCollector"
  ADD COLUMN "photoPublicId" TEXT;
