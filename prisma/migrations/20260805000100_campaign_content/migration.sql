-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN "driveFolderUrl" TEXT,
ADD COLUMN "driveFolderId" TEXT,
ADD COLUMN "formUrl" TEXT;

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'POSTED');

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT,
    "driveFileId" TEXT,
    "name" TEXT NOT NULL,
    "mimeType" TEXT,
    "url" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "notes" TEXT,
    "driveModifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentItem_campaignId_driveFileId_key" ON "ContentItem"("campaignId", "driveFileId");

-- CreateIndex
CREATE INDEX "ContentItem_campaignId_idx" ON "ContentItem"("campaignId");

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentItem" ADD CONSTRAINT "ContentItem_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
