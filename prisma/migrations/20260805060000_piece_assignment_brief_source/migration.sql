-- AlterTable
ALTER TABLE "ContentPiece" ADD COLUMN "campaignId" TEXT,
ADD COLUMN "creatorId" TEXT;

-- AlterTable
ALTER TABLE "CreatorBrief" ADD COLUMN "sourceUrl" TEXT,
ADD COLUMN "concept" TEXT;

-- AddForeignKey
ALTER TABLE "ContentPiece" ADD CONSTRAINT "ContentPiece_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentPiece" ADD CONSTRAINT "ContentPiece_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE SET NULL ON UPDATE CASCADE;
