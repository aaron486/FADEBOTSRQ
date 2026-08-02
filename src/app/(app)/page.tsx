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
    },
    orderBy: { updatedAt: "desc" },
  });

  const rows: CreatorRow[] = creators.map((c) => ({
    id: c.id,
    name: c.name,
    platform: c.platform,
    handle: c.handle,
    email: c.email,
    followers: c.followers,
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
  }));

  return <DashboardView rows={rows} />;
}
