import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PieceFormat, PieceStatus } from "@/lib/creator-meta";
import { PieceEditor } from "./piece-editor";

export const dynamic = "force-dynamic";

export default async function PiecePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const piece = await prisma.contentPiece.findUnique({ where: { id } });
  if (!piece) notFound();

  return (
    <PieceEditor
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
        notes: piece.notes ?? "",
        updatedAt: piece.updatedAt.toISOString(),
      }}
      aiEnabled={!!process.env.ANTHROPIC_API_KEY}
    />
  );
}
