import { prisma } from "@/lib/prisma";
import { DashboardView, CreatorRow } from "@/components/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const creators = await prisma.creator.findMany({
    include: {
      posts: { select: { views: true, likes: true } },
      messages: {
        select: { sentAt: true },
        where: { status: "SENT" },
        orderBy: { sentAt: "desc" },
        take: 1,
      },
      followerSnapshots: { orderBy: { createdAt: "desc" }, take: 2 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows: CreatorRow[] = creators.map((c) => {
    // Growth = current count vs the previous snapshot (the latest snapshot
    // mirrors the current values, written on each refresh/edit).
    const prev = c.followerSnapshots[1] ?? null;
    const delta = (cur: number | null, old: number | null | undefined) =>
      cur != null && old != null ? cur - old : null;
    return {
      id: c.id,
      name: c.name,
      instagramHandle: c.instagramHandle,
      xHandle: c.xHandle,
      tiktokHandle: c.tiktokHandle,
      email: c.email,
      phone: c.phone,
      primaryPlatform: c.primaryPlatform,
      agencyName: c.agencyName,
      instagramFollowers: c.instagramFollowers,
      xFollowers: c.xFollowers,
      tiktokFollowers: c.tiktokFollowers,
      igDelta: delta(c.instagramFollowers, prev?.instagramFollowers),
      xDelta: delta(c.xFollowers, prev?.xFollowers),
      ttDelta: delta(c.tiktokFollowers, prev?.tiktokFollowers),
      followersUpdatedAt: c.followersUpdatedAt?.toISOString() ?? null,
      niche: c.niche,
      notes: c.notes,
      stage: c.stage,
      agreedCostCents: c.agreedCostCents,
      paidCents: c.paidCents,
      contractStatus: c.contractStatus,
      postCount: c.posts.length,
      totalViews: c.posts.reduce((s, p) => s + (p.views ?? 0), 0),
      lastOutreachAt: c.messages[0]?.sentAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  });

  return <DashboardView rows={rows} aiEnabled={!!process.env.ANTHROPIC_API_KEY} />;
}
