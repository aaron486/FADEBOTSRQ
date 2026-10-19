import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import { Platform, Stage } from "@/lib/creator-meta";
import { ListOutreachView, ListMember } from "./list-outreach";

export const dynamic = "force-dynamic";

// Email finding and AI drafting call out to web search / Claude per creator.
export const maxDuration = 120;

export default async function ListPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const list = await prisma.creatorList.findUnique({
    where: { id },
    include: {
      members: {
        include: { creator: true },
        orderBy: { addedAt: "asc" },
      },
    },
  });
  if (!list) notFound();

  const members: ListMember[] = list.members.map(({ creator: c }) => ({
    id: c.id,
    name: c.name,
    niche: c.niche,
    stage: c.stage as Stage,
    email: c.email?.trim() || null,
    instagramHandle: c.instagramHandle,
    xHandle: c.xHandle,
    tiktokHandle: c.tiktokHandle,
    youtubeHandle: c.youtubeHandle,
    phone: c.phone,
    primaryPlatform: c.primaryPlatform as Platform,
    tiktokFollowers: c.tiktokFollowers,
    instagramFollowers: c.instagramFollowers,
    xFollowers: c.xFollowers,
    youtubeFollowers: c.youtubeFollowers,
  }));

  return (
    <ListOutreachView
      listId={list.id}
      listName={list.name}
      initialMembers={members}
      aiEnabled={!!process.env.ANTHROPIC_API_KEY}
    />
  );
}
