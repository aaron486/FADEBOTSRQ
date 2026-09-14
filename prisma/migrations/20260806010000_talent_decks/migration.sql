-- CreateEnum
CREATE TYPE "BackgroundCheck" AS ENUM ('NOT_STARTED', 'IN_REVIEW', 'CLEARED', 'FLAGGED');

-- AlterTable
ALTER TABLE "Creator"
    ADD COLUMN "tagline" TEXT,
    ADD COLUMN "bio" TEXT,
    ADD COLUMN "location" TEXT,
    ADD COLUMN "photoUrls" TEXT,
    ADD COLUMN "pastPartnerships" TEXT,
    ADD COLUMN "brandAlignment" TEXT,
    ADD COLUMN "audienceAgeRange" TEXT,
    ADD COLUMN "audienceGenderSplit" TEXT,
    ADD COLUMN "audienceTopLocations" TEXT,
    ADD COLUMN "audienceInterests" TEXT,
    ADD COLUMN "engagementRatePct" DOUBLE PRECISION,
    ADD COLUMN "avgViews" INTEGER,
    ADD COLUMN "backgroundCheck" "BackgroundCheck" NOT NULL DEFAULT 'NOT_STARTED',
    ADD COLUMN "backgroundCheckNotes" TEXT,
    ADD COLUMN "backgroundCheckedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "TalentDeck" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "headline" TEXT,
    "clientName" TEXT,
    "intro" TEXT,
    "closing" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "ctaUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TalentDeck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TalentDeckCreator" (
    "deckId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "pitch" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TalentDeckCreator_pkey" PRIMARY KEY ("deckId","creatorId")
);

-- CreateIndex
CREATE UNIQUE INDEX "TalentDeck_token_key" ON "TalentDeck"("token");

-- CreateIndex
CREATE INDEX "TalentDeckCreator_creatorId_idx" ON "TalentDeckCreator"("creatorId");

-- AddForeignKey
ALTER TABLE "TalentDeckCreator" ADD CONSTRAINT "TalentDeckCreator_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "TalentDeck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TalentDeckCreator" ADD CONSTRAINT "TalentDeckCreator_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
