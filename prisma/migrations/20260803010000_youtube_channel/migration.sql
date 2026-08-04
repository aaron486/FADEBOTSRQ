-- Add YouTube as a contact channel with its own subscriber count.

ALTER TYPE "Platform" ADD VALUE 'YOUTUBE';

ALTER TABLE "Creator" ADD COLUMN "youtubeHandle" TEXT;
ALTER TABLE "Creator" ADD COLUMN "youtubeFollowers" INTEGER;
ALTER TABLE "FollowerSnapshot" ADD COLUMN "youtubeFollowers" INTEGER;
