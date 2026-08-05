import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CampaignStatus, ContentStatus, Platform, Stage } from "@/lib/creator-meta";
import { CampaignDetail, MemberRow, CandidateRow, ActivityRow, ContentRow } from "./campaign-detail";

export const dynamic = "force-dynamic";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [campaign, allCreators] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id },
      include: {
        creators: {
          include: {
            creator: {
              include: { posts: { select: { views: true, likes: true, postedAt: true } } },
            },
          },
          orderBy: { addedAt: "asc" },
        },
        contentItems: {
          include: { creator: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.creator.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!campaign) notFound();

  const memberIds = campaign.creators.map((m) => m.creatorId);
  const activities: ActivityRow[] =
    memberIds.length === 0
      ? []
      : (
          await prisma.activity.findMany({
            where: { creatorId: { in: memberIds } },
            orderBy: { createdAt: "desc" },
            take: 12,
            include: { creator: { select: { name: true } } },
          })
        ).map((a) => ({
          id: a.id,
          creatorId: a.creatorId,
          creatorName: a.creator.name,
          text: a.text,
          createdAt: a.createdAt.toISOString(),
        }));

  const memberIdSet = new Set(memberIds);
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
    postCount: c.posts.length,
    totalViews: c.posts.reduce((s, p) => s + (p.views ?? 0), 0),
    totalLikes: c.posts.reduce((s, p) => s + (p.likes ?? 0), 0),
  }));
  const candidates: CandidateRow[] = allCreators.filter((c) => !memberIdSet.has(c.id));

  const contentItems: ContentRow[] = campaign.contentItems.map((i) => ({
    id: i.id,
    name: i.name,
    url: i.url,
    thumbnailUrl: i.thumbnailUrl,
    mimeType: i.mimeType,
    status: i.status as ContentStatus,
    creatorId: i.creatorId,
    creatorName: i.creator?.name ?? null,
    createdAt: i.createdAt.toISOString(),
  }));

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
        driveFolderUrl: campaign.driveFolderUrl,
        formUrl: campaign.formUrl,
        updatedAt: campaign.updatedAt.toISOString(),
      }}
      members={members}
      candidates={candidates}
      activities={activities}
      contentItems={contentItems}
      driveConfigured={!!process.env.GOOGLE_API_KEY}
    />
  );
}
