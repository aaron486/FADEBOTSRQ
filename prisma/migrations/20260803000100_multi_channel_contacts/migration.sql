-- Creators can now hold every contact channel at once (IG, X, TikTok, email,
-- phone) plus agency info, with one channel marked primary. Existing data is
-- migrated: the old platform/handle pair becomes the matching channel field
-- and the primary platform.

-- AlterEnum
ALTER TYPE "Platform" ADD VALUE 'TIKTOK';

-- AlterTable: add the new contact columns
ALTER TABLE "Creator" ADD COLUMN "instagramHandle" TEXT;
ALTER TABLE "Creator" ADD COLUMN "xHandle" TEXT;
ALTER TABLE "Creator" ADD COLUMN "tiktokHandle" TEXT;
ALTER TABLE "Creator" ADD COLUMN "phone" TEXT;
ALTER TABLE "Creator" ADD COLUMN "primaryPlatform" "Platform" NOT NULL DEFAULT 'INSTAGRAM';
ALTER TABLE "Creator" ADD COLUMN "agencyName" TEXT;
ALTER TABLE "Creator" ADD COLUMN "agencyContact" TEXT;

-- Data migration: carry the old single platform/handle into the new fields
UPDATE "Creator" SET "primaryPlatform" = "platform";
UPDATE "Creator" SET "instagramHandle" = "handle" WHERE "platform" = 'INSTAGRAM';
UPDATE "Creator" SET "xHandle" = "handle" WHERE "platform" = 'X';
UPDATE "Creator" SET "email" = COALESCE("email", "handle") WHERE "platform" = 'EMAIL';

-- Drop the old single-channel columns
DROP INDEX "Creator_platform_idx";
ALTER TABLE "Creator" DROP COLUMN "platform";
ALTER TABLE "Creator" DROP COLUMN "handle";

-- CreateIndex
CREATE INDEX "Creator_primaryPlatform_idx" ON "Creator"("primaryPlatform");
