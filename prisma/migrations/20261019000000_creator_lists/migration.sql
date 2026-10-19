CREATE TABLE "CreatorList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreatorList_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "CreatorList_name_key" ON "CreatorList"("name");
CREATE TABLE "CreatorListMember" (
    "listId" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CreatorListMember_pkey" PRIMARY KEY ("listId","creatorId")
);
CREATE INDEX "CreatorListMember_creatorId_idx" ON "CreatorListMember"("creatorId");
ALTER TABLE "CreatorListMember" ADD CONSTRAINT "CreatorListMember_listId_fkey" FOREIGN KEY ("listId") REFERENCES "CreatorList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CreatorListMember" ADD CONSTRAINT "CreatorListMember_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "Creator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
