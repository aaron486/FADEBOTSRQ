-- CreateTable
CREATE TABLE "CreatorBrief" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "headline" TEXT,
    "intro" TEXT,
    "deliverables" TEXT,
    "talkingPoints" TEXT,
    "dos" TEXT,
    "donts" TEXT,
    "dueDate" TIMESTAMP(3),
    "compensationCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreatorBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorBrief_token_key" ON "CreatorBrief"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CreatorBrief_campaignId_creatorId_key" ON "CreatorBrief"("campaignId", "creatorId");

-- AddForeignKey
ALTER TABLE "CreatorBrief" ADD CONSTRAINT "CreatorBrief_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreatorBrief" ADD CONSTRAINT "CreatorBrief_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
