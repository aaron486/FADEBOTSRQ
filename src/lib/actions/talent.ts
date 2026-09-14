"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import { BackgroundCheck } from "@/lib/creator-meta";

function revalidateDeck(id: string) {
  revalidatePath("/talent");
  revalidatePath(`/talent/${id}`);
}

const clean = (v: string | null | undefined) => v?.trim() || null;

export async function createDeck(name: string) {
  await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false as const, error: "Give the deck a name." };
  const deck = await prisma.talentDeck.create({ data: { name: trimmed } });
  revalidatePath("/talent");
  redirect(`/talent/${deck.id}`);
}

export type DeckInput = {
  name: string;
  headline: string;
  clientName: string;
  intro: string;
  closing: string;
  contactName: string;
  contactEmail: string;
  ctaUrl: string;
  published: boolean;
};

export async function updateDeck(id: string, input: DeckInput) {
  await requireUser();
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Give the deck a name." };
  const deck = await prisma.talentDeck.update({
    where: { id },
    data: {
      name,
      headline: clean(input.headline),
      clientName: clean(input.clientName),
      intro: clean(input.intro),
      closing: clean(input.closing),
      contactName: clean(input.contactName),
      contactEmail: clean(input.contactEmail),
      ctaUrl: clean(input.ctaUrl),
      published: input.published,
    },
  });
  revalidateDeck(id);
  revalidatePath(`/d/${deck.token}`);
  return { ok: true as const };
}

export async function deleteDeck(id: string) {
  await requireUser();
  await prisma.talentDeck.delete({ where: { id } });
  revalidatePath("/talent");
  redirect("/talent");
}

export async function addCreatorToDeck(deckId: string, creatorId: string) {
  await requireUser();
  // New talent goes to the bottom of the running order.
  const last = await prisma.talentDeckCreator.findFirst({
    where: { deckId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  await prisma.talentDeckCreator.upsert({
    where: { deckId_creatorId: { deckId, creatorId } },
    create: { deckId, creatorId, position: (last?.position ?? -1) + 1 },
    update: {},
  });
  revalidateDeck(deckId);
  return { ok: true as const };
}

export async function removeCreatorFromDeck(deckId: string, creatorId: string) {
  await requireUser();
  await prisma.talentDeckCreator.deleteMany({ where: { deckId, creatorId } });
  revalidateDeck(deckId);
  return { ok: true as const };
}

/** Swap a creator with its neighbour, moving them up or down the deck. */
export async function moveDeckCreator(deckId: string, creatorId: string, direction: "up" | "down") {
  await requireUser();
  const rows = await prisma.talentDeckCreator.findMany({
    where: { deckId },
    orderBy: [{ position: "asc" }, { addedAt: "asc" }],
    select: { creatorId: true },
  });
  const from = rows.findIndex((r) => r.creatorId === creatorId);
  const to = direction === "up" ? from - 1 : from + 1;
  if (from < 0 || to < 0 || to >= rows.length) return { ok: true as const };
  const [moved] = rows.splice(from, 1);
  rows.splice(to, 0, moved);
  // Rewrite every position so ties from older rows can't reorder the deck.
  await prisma.$transaction(
    rows.map((r, i) =>
      prisma.talentDeckCreator.update({
        where: { deckId_creatorId: { deckId, creatorId: r.creatorId } },
        data: { position: i },
      })
    )
  );
  revalidateDeck(deckId);
  return { ok: true as const };
}

/** The deck-specific "why this talent, for this partner" line. */
export async function setDeckPitch(deckId: string, creatorId: string, pitch: string) {
  await requireUser();
  await prisma.talentDeckCreator.update({
    where: { deckId_creatorId: { deckId, creatorId } },
    data: { pitch: clean(pitch) },
  });
  revalidateDeck(deckId);
  return { ok: true as const };
}

export type TalentProfileInput = {
  tagline: string;
  bio: string;
  location: string;
  photoUrls: string;
  pastPartnerships: string;
  brandAlignment: string;
  audienceAgeRange: string;
  audienceGenderSplit: string;
  audienceTopLocations: string;
  audienceInterests: string;
  engagementRatePct: number | null;
  avgViews: number | null;
  backgroundCheck: BackgroundCheck;
  backgroundCheckNotes: string;
};

/**
 * Save a creator's roster profile — the showcase copy every deck they appear
 * on renders. Logged to the creator's activity so the team can see who vetted
 * whom, and when the background check last changed.
 */
export async function saveTalentProfile(creatorId: string, input: TalentProfileInput) {
  const user = await requireUser();
  const before = await prisma.creator.findUniqueOrThrow({
    where: { id: creatorId },
    select: { backgroundCheck: true },
  });
  const checkChanged = before.backgroundCheck !== input.backgroundCheck;

  await prisma.creator.update({
    where: { id: creatorId },
    data: {
      tagline: clean(input.tagline),
      bio: clean(input.bio),
      location: clean(input.location),
      photoUrls: clean(input.photoUrls),
      pastPartnerships: clean(input.pastPartnerships),
      brandAlignment: clean(input.brandAlignment),
      audienceAgeRange: clean(input.audienceAgeRange),
      audienceGenderSplit: clean(input.audienceGenderSplit),
      audienceTopLocations: clean(input.audienceTopLocations),
      audienceInterests: clean(input.audienceInterests),
      engagementRatePct: input.engagementRatePct,
      avgViews: input.avgViews,
      backgroundCheck: input.backgroundCheck,
      backgroundCheckNotes: clean(input.backgroundCheckNotes),
      ...(checkChanged ? { backgroundCheckedAt: new Date() } : {}),
    },
  });

  if (checkChanged) {
    await prisma.activity.create({
      data: {
        creatorId,
        text: `Background check set to ${input.backgroundCheck.toLowerCase().replace("_", " ")}`,
        userId: user.id,
      },
    });
  }

  // Every deck this creator appears on now renders different copy.
  const decks = await prisma.talentDeckCreator.findMany({
    where: { creatorId },
    select: { deckId: true, deck: { select: { token: true } } },
  });
  for (const d of decks) {
    revalidateDeck(d.deckId);
    revalidatePath(`/d/${d.deck.token}`);
  }
  revalidatePath(`/creators/${creatorId}`);
  return { ok: true as const };
}
