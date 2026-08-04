-- Split the single followers count into per-platform counts (IG / X / TikTok).
-- The old count is carried into the column matching the primary platform
-- (email-primary creators with an IG handle keep it on Instagram).

ALTER TABLE "Creator" ADD COLUMN "instagramFollowers" INTEGER;
ALTER TABLE "Creator" ADD COLUMN "xFollowers" INTEGER;
ALTER TABLE "Creator" ADD COLUMN "tiktokFollowers" INTEGER;

UPDATE "Creator" SET "instagramFollowers" = "followers" WHERE "primaryPlatform" = 'INSTAGRAM';
UPDATE "Creator" SET "xFollowers" = "followers" WHERE "primaryPlatform" = 'X';
UPDATE "Creator" SET "tiktokFollowers" = "followers" WHERE "primaryPlatform" = 'TIKTOK';
UPDATE "Creator" SET "instagramFollowers" = "followers"
  WHERE "primaryPlatform" = 'EMAIL' AND "instagramHandle" IS NOT NULL AND "instagramFollowers" IS NULL;

ALTER TABLE "Creator" DROP COLUMN "followers";
