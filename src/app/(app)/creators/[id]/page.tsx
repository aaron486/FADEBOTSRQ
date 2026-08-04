import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreatorDetail } from "./creator-detail";

export const dynamic = "force-dynamic";

export default async function CreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await prisma.creator.findUnique({
    where: { id },
    include: {
      posts: { orderBy: { createdAt: "desc" } },
      messages: { orderBy: { createdAt: "desc" }, include: { sentBy: { select: { email: true } } } },
      activities: { orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { email: true } } } },
    },
  });
  if (!creator) notFound();

  const templates = await prisma.template.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <CreatorDetail
      aiEnabled={!!process.env.ANTHROPIC_API_KEY}
      creator={{
        id: creator.id,
        name: creator.name,
        instagramHandle: creator.instagramHandle,
        xHandle: creator.xHandle,
        tiktokHandle: creator.tiktokHandle,
        youtubeHandle: creator.youtubeHandle,
        email: creator.email,
        phone: creator.phone,
        primaryPlatform: creator.primaryPlatform,
        agencyName: creator.agencyName,
        agencyContact: creator.agencyContact,
        instagramFollowers: creator.instagramFollowers,
        xFollowers: creator.xFollowers,
        tiktokFollowers: creator.tiktokFollowers,
        youtubeFollowers: creator.youtubeFollowers,
        niche: creator.niche,
        notes: creator.notes,
        stage: creator.stage,
        agreedCostCents: creator.agreedCostCents,
        paidCents: creator.paidCents,
        paidAt: creator.paidAt?.toISOString() ?? null,
        contractStatus: creator.contractStatus,
        contractSentAt: creator.contractSentAt?.toISOString() ?? null,
        contractSignedAt: creator.contractSignedAt?.toISOString() ?? null,
        contractNotes: creator.contractNotes,
        followersUpdatedAt: creator.followersUpdatedAt?.toISOString() ?? null,
        updatedAt: creator.updatedAt.toISOString(),
      }}
      posts={creator.posts.map((p) => ({
        id: p.id,
        url: p.url,
        postedAt: p.postedAt.toISOString(),
        views: p.views,
        likes: p.likes,
      }))}
      messages={creator.messages.map((m) => ({
        id: m.id,
        channel: m.channel,
        subject: m.subject,
        body: m.body,
        status: m.status,
        isFollowUp: m.isFollowUp,
        sentAt: m.sentAt?.toISOString() ?? null,
        sentByEmail: m.sentBy?.email ?? null,
        error: m.error,
      }))}
      activities={creator.activities.map((a) => ({
        id: a.id,
        text: a.text,
        createdAt: a.createdAt.toISOString(),
        userEmail: a.user?.email ?? null,
      }))}
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        platform: t.platform,
        subject: t.subject,
        body: t.body,
      }))}
    />
  );
}
