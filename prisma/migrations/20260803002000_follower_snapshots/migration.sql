-- Follower history: timestamp of the last refresh on Creator, plus a
-- snapshot table so the dashboard can show growth between checks.

ALTER TABLE "Creator" ADD COLUMN "followersUpdatedAt" TIMESTAMP(3);

CREATE TABLE "FollowerSnapshot" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "instagramFollowers" INTEGER,
    "xFollowers" INTEGER,
    "tiktokFollowers" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FollowerSnapshot_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "FollowerSnapshot" ADD CONSTRAINT "FollowerSnapshot_creatorId_fkey"
    FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "FollowerSnapshot_creatorId_createdAt_idx" ON "FollowerSnapshot"("creatorId", "createdAt");

-- Seed one snapshot per creator that already has counts, so the first
-- refresh has a baseline to diff against.
INSERT INTO "FollowerSnapshot" ("id", "creatorId", "instagramFollowers", "xFollowers", "tiktokFollowers")
SELECT 'fsnap_' || md5(random()::text || id), id, "instagramFollowers", "xFollowers", "tiktokFollowers"
FROM "Creator"
WHERE "instagramFollowers" IS NOT NULL OR "xFollowers" IS NOT NULL OR "tiktokFollowers" IS NOT NULL;
