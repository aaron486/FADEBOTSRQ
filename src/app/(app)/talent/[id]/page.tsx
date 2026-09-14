import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DeckEditor } from "./deck-editor";

export const dynamic = "force-dynamic";

export default async function TalentDeckEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deck = await prisma.talentDeck.findUnique({
    where: { id },
    include: {
      creators: {
        orderBy: [{ position: "asc" }, { addedAt: "asc" }],
        include: { creator: true },
      },
    },
  });
  if (!deck) notFound();

  const candidates = await prisma.creator.findMany({
    where: { id: { notIn: deck.creators.map((r) => r.creatorId) } },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Absolute share link, built from the request host so it's copy-pasteable.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const shareUrl = host ? `${proto}://${host}/d/${deck.token}` : `/d/${deck.token}`;

  return (
    <DeckEditor
      shareUrl={shareUrl}
      deck={{
        id: deck.id,
        name: deck.name,
        token: deck.token,
        headline: deck.headline,
        clientName: deck.clientName,
        intro: deck.intro,
        closing: deck.closing,
        contactName: deck.contactName,
        contactEmail: deck.contactEmail,
        ctaUrl: deck.ctaUrl,
        published: deck.published,
        updatedAt: deck.updatedAt.toISOString(),
      }}
      roster={deck.creators.map((r) => ({
        pitch: r.pitch,
        creator: {
          id: r.creator.id,
          name: r.creator.name,
          niche: r.creator.niche,
          instagramHandle: r.creator.instagramHandle,
          xHandle: r.creator.xHandle,
          tiktokHandle: r.creator.tiktokHandle,
          youtubeHandle: r.creator.youtubeHandle,
          email: r.creator.email,
          phone: r.creator.phone,
          primaryPlatform: r.creator.primaryPlatform,
          instagramFollowers: r.creator.instagramFollowers,
          xFollowers: r.creator.xFollowers,
          tiktokFollowers: r.creator.tiktokFollowers,
          youtubeFollowers: r.creator.youtubeFollowers,
          tagline: r.creator.tagline,
          bio: r.creator.bio,
          location: r.creator.location,
          photoUrls: r.creator.photoUrls,
          pastPartnerships: r.creator.pastPartnerships,
          brandAlignment: r.creator.brandAlignment,
          audienceAgeRange: r.creator.audienceAgeRange,
          audienceGenderSplit: r.creator.audienceGenderSplit,
          audienceTopLocations: r.creator.audienceTopLocations,
          audienceInterests: r.creator.audienceInterests,
          engagementRatePct: r.creator.engagementRatePct,
          avgViews: r.creator.avgViews,
          backgroundCheck: r.creator.backgroundCheck,
          backgroundCheckNotes: r.creator.backgroundCheckNotes,
          backgroundCheckedAt: r.creator.backgroundCheckedAt?.toISOString() ?? null,
        },
      }))}
      candidates={candidates}
    />
  );
}
