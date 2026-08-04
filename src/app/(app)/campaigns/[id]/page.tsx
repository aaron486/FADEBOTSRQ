import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CampaignStatus, Platform, Stage } from "@/lib/creator-meta";
import { CampaignDetail, MemberRow, CandidateRow } from "./campaign-detail";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [campaign, allCreators] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id },
      include: {
        creators: { include: { creator: true }, orderBy: { addedAt: "asc" } },
      },
    }),
    prisma.creator.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!campaign) notFound();

  const memberIds = new Set(campaign.creators.map((m) => m.creatorId));
  const members: MemberRow[] = campaign.creators.map(({ creator: c }) => ({
    id: c.id,
    name: c.name,
    instagramHandle: c.instagramHandle,
    xHandle: c.xHandle,
    tiktokHandle: c.tiktokHandle,
    youtubeHandle: c.youtubeHandle,
    email: c.email,
    phone: c.phone,
    primaryPlatform: c.primaryPlatform as Platform,
    instagramFollowers: c.instagramFollowers,
    xFollowers: c.xFollowers,
    tiktokFollowers: c.tiktokFollowers,
    youtubeFollowers: c.youtubeFollowers,
    stage: c.stage as Stage,
    agreedCostCents: c.agreedCostCents,
    paidCents: c.paidCents,
  }));
  const candidates: CandidateRow[] = allCreators
    .filter((c) => !memberIds.has(c.id))
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <CampaignDetail
      campaign={{
        id: campaign.id,
        name: campaign.name,
        status: campaign.status as CampaignStatus,
        budgetCents: campaign.budgetCents,
        startDate: campaign.startDate ? campaign.startDate.toISOString().slice(0, 10) : null,
        endDate: campaign.endDate ? campaign.endDate.toISOString().slice(0, 10) : null,
        notes: campaign.notes,
        updatedAt: campaign.updatedAt.toISOString(),
      }}
      members={members}
      candidates={candidates}
    />
  );
}
