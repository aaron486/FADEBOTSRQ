-- AlterTable
ALTER TABLE "ContentPiece" ADD COLUMN "driveFileId" TEXT,
ADD COLUMN "views" INTEGER,
ADD COLUMN "likes" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ContentPiece_driveFileId_key" ON "ContentPiece"("driveFileId");
