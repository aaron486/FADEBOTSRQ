"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import {
  Stage,
  Platform,
  ContractStatus,
  stageIndex,
  stageMeta,
  fmtMoneyCents,
} from "@/lib/creator-meta";

function revalidateCreator(id: string) {
  revalidatePath("/");
  revalidatePath(`/creators/${id}`);
}

export type CreatorInput = {
  name: string;
  instagramHandle?: string | null;
  xHandle?: string | null;
  tiktokHandle?: string | null;
  email?: string | null;
  phone?: string | null;
  primaryPlatform: Platform;
  agencyName?: string | null;
  agencyContact?: string | null;
  followers?: number | null;
  niche?: string | null;
  notes?: string | null;
};

function contactData(input: CreatorInput) {
  const clean = (v?: string | null) => v?.trim() || null;
  return {
    instagramHandle: clean(input.instagramHandle),
    xHandle: clean(input.xHandle),
    tiktokHandle: clean(input.tiktokHandle),
    email: clean(input.email),
    phone: clean(input.phone),
    agencyName: clean(input.agencyName),
    agencyContact: clean(input.agencyContact),
    followers: input.followers ?? null,
    niche: clean(input.niche),
    notes: input.notes?.trim() || null,
  };
}

/** Ensure primaryPlatform points at a channel that actually exists. */
function resolvePrimary(input: CreatorInput): Platform | null {
  const has: Record<Platform, boolean> = {
    INSTAGRAM: !!input.instagramHandle?.trim(),
    X: !!input.xHandle?.trim(),
    TIKTOK: !!input.tiktokHandle?.trim(),
    EMAIL: !!input.email?.trim(),
  };
  if (has[input.primaryPlatform]) return input.primaryPlatform;
  const first = (Object.keys(has) as Platform[]).find((p) => has[p]);
  return first ?? null;
}

export async function createCreator(input: CreatorInput) {
  const user = await requireUser();
  const primary = resolvePrimary(input);
  if (!primary) {
    return { ok: false as const, error: "Add at least one contact channel (IG, X, TikTok, or email)." };
  }
  const data = contactData(input);
  const name =
    input.name.trim() ||
    (data.instagramHandle ?? data.xHandle ?? data.tiktokHandle ?? data.email ?? "").replace(/^@/, "");

  const creator = await prisma.creator.create({
    data: {
      name,
      ...data,
      primaryPlatform: primary,
      ownerId: user.id,
      activities: { create: { text: "Creator added", userId: user.id } },
    },
  });
  revalidatePath("/");
  redirect(`/creators/${creator.id}`);
}

export async function updateCreatorProfile(id: string, input: CreatorInput) {
  await requireUser();
  const primary = resolvePrimary(input);
  if (!primary) {
    return { ok: false as const, error: "Keep at least one contact channel (IG, X, TikTok, or email)." };
  }
  await prisma.creator.update({
    where: { id },
    data: {
      name: input.name.trim(),
      ...contactData(input),
      primaryPlatform: primary,
    },
  });
  revalidateCreator(id);
  return { ok: true as const };
}

export async function setStage(id: string, stage: Stage) {
  const user = await requireUser();
  const creator = await prisma.creator.findUniqueOrThrow({ where: { id } });
  if (creator.stage === stage) return { ok: true as const };
  await prisma.creator.update({
    where: { id },
    data: {
      stage,
      activities: {
        create: {
          text: `Stage: ${stageMeta(creator.stage as Stage).label} → ${stageMeta(stage).label}`,
          userId: user.id,
        },
      },
    },
  });
  revalidateCreator(id);
  return { ok: true as const };
}

export type DealInput = {
  agreedCostCents: number | null;
  paidCents: number | null;
  contractStatus: ContractStatus;
  contractNotes: string | null;
};

export async function updateDeal(id: string, input: DealInput) {
  const user = await requireUser();
  const creator = await prisma.creator.findUniqueOrThrow({ where: { id } });
  const log: string[] = [];

  if (input.agreedCostCents !== creator.agreedCostCents) {
    log.push(`Agreed cost set to ${fmtMoneyCents(input.agreedCostCents)}`);
  }
  const paidChanged = input.paidCents !== creator.paidCents;
  if (paidChanged) log.push(`Paid updated to ${fmtMoneyCents(input.paidCents)}`);

  let stage = creator.stage;
  let contractSentAt = creator.contractSentAt;
  let contractSignedAt = creator.contractSignedAt;
  if (input.contractStatus !== creator.contractStatus) {
    log.push(`Contract: ${creator.contractStatus.toLowerCase()} → ${input.contractStatus.toLowerCase()}`);
    if (input.contractStatus === "SENT" && !contractSentAt) contractSentAt = new Date();
    if (input.contractStatus === "SIGNED") {
      if (!contractSignedAt) contractSignedAt = new Date();
      if (stageIndex(stage as Stage) < stageIndex("CONTRACTED") && stage !== "DECLINED") {
        stage = "CONTRACTED";
        log.push("Stage auto-advanced to Contracted (contract signed)");
      }
    }
  }

  await prisma.creator.update({
    where: { id },
    data: {
      agreedCostCents: input.agreedCostCents,
      paidCents: input.paidCents,
      paidAt: paidChanged && input.paidCents != null ? new Date() : creator.paidAt,
      contractStatus: input.contractStatus,
      contractSentAt,
      contractSignedAt,
      contractNotes: input.contractNotes?.trim() || null,
      stage,
      activities: { create: log.map((text) => ({ text, userId: user.id })) },
    },
  });
  revalidateCreator(id);
  return { ok: true as const };
}

export async function deleteCreator(id: string) {
  await requireUser();
  await prisma.creator.delete({ where: { id } });
  revalidatePath("/");
  redirect("/");
}

export async function addPost(
  creatorId: string,
  input: { url: string; views?: number | null; likes?: number | null; notes?: string | null }
) {
  const user = await requireUser();
  const url = input.url.trim();
  if (!url) return { ok: false as const, error: "Post URL is required" };

  const creator = await prisma.creator.findUniqueOrThrow({ where: { id: creatorId } });
  const advance =
    stageIndex(creator.stage as Stage) < stageIndex("POSTED") && creator.stage !== "DECLINED";

  await prisma.creator.update({
    where: { id: creatorId },
    data: {
      stage: advance ? "POSTED" : creator.stage,
      posts: {
        create: {
          url,
          views: input.views ?? null,
          likes: input.likes ?? null,
          notes: input.notes?.trim() || null,
        },
      },
      activities: {
        create: [
          { text: `Post added: ${url}`, userId: user.id },
          ...(advance ? [{ text: "Stage auto-advanced to Posted", userId: user.id }] : []),
        ],
      },
    },
  });
  revalidateCreator(creatorId);
  return { ok: true as const };
}

export async function updatePostMetrics(
  postId: string,
  input: { views: number | null; likes: number | null }
) {
  await requireUser();
  const post = await prisma.post.update({
    where: { id: postId },
    data: { views: input.views, likes: input.likes },
  });
  revalidateCreator(post.creatorId);
  return { ok: true as const };
}

export async function deletePost(postId: string) {
  const user = await requireUser();
  const post = await prisma.post.delete({ where: { id: postId } });
  await prisma.activity.create({
    data: { creatorId: post.creatorId, text: `Post removed: ${post.url}`, userId: user.id },
  });
  revalidateCreator(post.creatorId);
  return { ok: true as const };
}

export async function addNote(creatorId: string, text: string) {
  const user = await requireUser();
  const trimmed = text.trim();
  if (!trimmed) return { ok: false as const, error: "Note is empty" };
  await prisma.activity.create({
    data: { creatorId, text: trimmed, userId: user.id },
  });
  revalidateCreator(creatorId);
  return { ok: true as const };
}
