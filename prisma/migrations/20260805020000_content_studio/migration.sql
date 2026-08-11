-- CreateEnum
CREATE TYPE "PieceFormat" AS ENUM ('REACTION_VIDEO', 'PHOTO_SLIDESHOW', 'FADE_STORY', 'OTHER');

-- CreateEnum
CREATE TYPE "PieceStatus" AS ENUM ('NEEDED', 'IN_PROGRESS', 'IN_VAULT', 'QUEUED', 'PUBLISHED');

-- CreateTable
CREATE TABLE "ContentPiece" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "format" "PieceFormat" NOT NULL DEFAULT 'REACTION_VIDEO',
    "status" "PieceStatus" NOT NULL DEFAULT 'NEEDED',
    "theme" TEXT,
    "tags" TEXT,
    "sourceUrl" TEXT,
    "angle" TEXT,
    "concept" TEXT,
    "assetUrl" TEXT,
    "scheduledFor" TIMESTAMP(3),
    "publishedUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentPiece_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentPiece_status_idx" ON "ContentPiece"("status");
