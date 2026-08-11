import { prisma } from "@/lib/prisma";
import { PieceFormat, PieceStatus } from "@/lib/creator-meta";
import { ContentBoard, PieceRow } from "./content-board";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const [pieces, vaultSetting] = await Promise.all([
    prisma.contentPiece.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.appSetting.findUnique({ where: { key: "vaultFolderUrl" } }),
  ]);

  const rows: PieceRow[] = pieces.map((p) => ({
    id: p.id,
    title: p.title,
    format: p.format as PieceFormat,
    status: p.status as PieceStatus,
    theme: p.theme,
    tags: p.tags,
    sourceUrl: p.sourceUrl,
    angle: p.angle,
    hasConcept: !!p.concept,
    assetUrl: p.assetUrl,
    scheduledFor: p.scheduledFor ? p.scheduledFor.toISOString().slice(0, 10) : null,
    publishedUrl: p.publishedUrl,
    views: p.views,
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <ContentBoard
      rows={rows}
      aiEnabled={!!process.env.ANTHROPIC_API_KEY}
      driveConfigured={!!process.env.GOOGLE_API_KEY}
      vaultFolderUrl={vaultSetting?.value ?? null}
    />
  );
}
