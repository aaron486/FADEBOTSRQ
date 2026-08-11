import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PieceFormat, PieceStatus } from "@/lib/creator-meta";
import { PieceEditor } from "./piece-editor";

export const dynamic = "force-dynamic";

export default async function PiecePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [piece, campaigns, creators] = await Promise.all([
    prisma.contentPiece.findUnique({
      where: { id },
      include: { campaign: { select: { name: true } }, creator: { select: { name: true } } },
    }),
    prisma.campaign.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, name: true } }),
    prisma.creator.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!piece) notFound();

  return (
    <PieceEditor
      campaigns={campaigns}
      creators={creators}
      assignment={
        piece.campaignId && piece.creatorId
          ? {
              campaignId: piece.campaignId,
              creatorId: piece.creatorId,
              label: `${piece.creator?.name ?? "creator"} · ${piece.campaign?.name ?? "campaign"}`,
            }
          : null
      }
      piece={{
        id: piece.id,
        title: piece.title,
        format: piece.format as PieceFormat,
        status: piece.status as PieceStatus,
        theme: piece.theme ?? "",
        tags: piece.tags ?? "",
        sourceUrl: piece.sourceUrl ?? "",
        angle: piece.angle ?? "",
        concept: piece.concept ?? "",
        assetUrl: piece.assetUrl ?? "",
        scheduledFor: piece.scheduledFor ? piece.scheduledFor.toISOString().slice(0, 10) : "",
        publishedUrl: piece.publishedUrl ?? "",
        views: piece.views,
        likes: piece.likes,
        thumbnailUrl: piece.thumbnailUrl,
        notes: piece.notes ?? "",
        updatedAt: piece.updatedAt.toISOString(),
      }}
      aiEnabled={!!process.env.ANTHROPIC_API_KEY}
    />
  );
}
