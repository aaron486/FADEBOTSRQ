CREATE TABLE "PieceComment" (
    "id" TEXT NOT NULL,
    "pieceId" TEXT NOT NULL,
    "author" TEXT,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PieceComment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PieceComment_pieceId_idx" ON "PieceComment"("pieceId");
ALTER TABLE "PieceComment" ADD CONSTRAINT "PieceComment_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "ContentPiece"("id") ON DELETE CASCADE ON UPDATE CASCADE;
