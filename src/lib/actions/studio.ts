"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import { PieceFormat, PieceStatus, PIECE_FORMATS, detectPostPlatform, parseDriveFolderId, driveThumb } from "@/lib/creator-meta";
import { listDriveFolder } from "@/lib/drive";
import { brandVoiceContext } from "@/lib/brand-voice";

const clean = (v: string | null | undefined) => v?.trim() || null;

export type PieceInput = {
  title: string;
  format: PieceFormat;
  status: PieceStatus;
  theme: string | null;
  tags: string | null;
  sourceUrl: string | null;
  angle: string | null;
  concept: string | null;
  assetUrl: string | null;
  scheduledFor: string | null; // yyyy-mm-dd
  publishedUrl: string | null;
  thumbnailUrl: string | null;
  views: number | null;
  likes: number | null;
  notes: string | null;
};

function pieceData(input: PieceInput) {
  return {
    format: input.format,
    status: input.status,
    theme: clean(input.theme),
    tags: clean(input.tags),
    sourceUrl: clean(input.sourceUrl),
    angle: clean(input.angle),
    concept: clean(input.concept),
    assetUrl: clean(input.assetUrl),
    scheduledFor: input.scheduledFor ? new Date(`${input.scheduledFor}T00:00:00Z`) : null,
    publishedUrl: clean(input.publishedUrl),
    thumbnailUrl: clean(input.thumbnailUrl),
    views: input.views,
    likes: input.likes,
    notes: clean(input.notes),
  };
}

/* ---------- Vault import by folder link ---------- */

/**
 * Import any Drive folder (pasted by link — there can be many vault folders)
 * as In-vault pieces.
 */
export async function syncVaultByLink(url: string) {
  await requireUser();
  const folderId = parseDriveFolderId(url);
  if (!folderId) {
    return { ok: false as const, error: "That doesn't look like a Drive folder link — it should contain /folders/…" };
  }

  const listed = await listDriveFolder(folderId);
  if (!listed.ok) return { ok: false as const, error: listed.error };

  // One post = one piece: a loose file is a single-asset post, and a SUBFOLDER
  // (which can hold many files — slides, cuts, covers) is still just ONE piece
  // whose asset link is the folder itself. A subfolder's cover image is its
  // first file that has a Drive thumbnail.
  const folderEntries = await Promise.all(
    listed.folders.map(async (f) => {
      const children = await listDriveFolder(f.id);
      // Prefer an image/video child as the cover; the public thumbnail
      // endpoint renders in browsers where thumbnailLink often won't.
      const cover = children.ok
        ? (children.files.find((c) => /^(image|video)\//.test(c.mimeType)) ?? children.files[0])
        : null;
      return {
        id: f.id,
        title: f.name,
        url: `https://drive.google.com/drive/folders/${f.id}`,
        thumbnailUrl: cover ? driveThumb(cover.id) : null,
      };
    })
  );
  const entries = [
    ...folderEntries,
    ...listed.files.map((f) => ({
      id: f.id,
      title: f.name.replace(/\.[a-z0-9]{2,5}$/i, ""),
      url: f.webViewLink ?? `https://drive.google.com/file/d/${f.id}/view`,
      thumbnailUrl: driveThumb(f.id),
    })),
  ];

  let added = 0;
  for (const e of entries) {
    const existing = await prisma.contentPiece.findUnique({ where: { driveFileId: e.id } });
    if (existing) {
      // Thumbnail links expire — refresh them on every sync.
      await prisma.contentPiece.update({
        where: { id: existing.id },
        data: { assetUrl: e.url, thumbnailUrl: e.thumbnailUrl },
      });
    } else {
      added += 1;
      await prisma.contentPiece.create({
        data: {
          title: e.title,
          format: "OTHER",
          status: "IN_VAULT",
          assetUrl: e.url,
          thumbnailUrl: e.thumbnailUrl,
          driveFileId: e.id,
        },
      });
    }
  }
  revalidatePath("/content");
  return { ok: true as const, added, total: entries.length };
}

/** Quick-add from the board: link + angle + format (+ optional generated concept). */
export async function createPiece(input: {
  title: string;
  format: PieceFormat;
  theme: string | null;
  sourceUrl: string | null;
  angle: string | null;
  concept: string | null;
  assetUrl?: string | null;
  status?: PieceStatus;
}) {
  await requireUser();
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Give the piece a title." };
  const assetUrl = clean(input.assetUrl);
  const piece = await prisma.contentPiece.create({
    data: {
      title,
      format: input.format,
      // Content that already exists lands straight in the vault.
      status: input.status ?? (assetUrl ? "IN_VAULT" : "NEEDS_APPROVAL"),
      theme: clean(input.theme),
      sourceUrl: clean(input.sourceUrl),
      angle: clean(input.angle),
      concept: clean(input.concept),
      assetUrl,
    },
  });
  revalidatePath("/content");
  return { ok: true as const, id: piece.id };
}

export async function updatePiece(id: string, input: PieceInput) {
  await requireUser();
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Give the piece a title." };
  await prisma.contentPiece.update({ where: { id }, data: { title, ...pieceData(input) } });
  revalidatePath("/content");
  revalidatePath(`/content/${id}`);
  return { ok: true as const };
}

export async function setPieceStatus(id: string, status: PieceStatus) {
  await requireUser();
  await prisma.contentPiece.update({ where: { id }, data: { status } });
  revalidatePath("/content");
  revalidatePath(`/content/${id}`);
  return { ok: true as const };
}

export async function deletePiece(id: string) {
  await requireUser();
  await prisma.contentPiece.delete({ where: { id } });
  revalidatePath("/content");
  redirect("/content");
}

/* ---------- Comments under a piece ---------- */

export async function addPieceComment(pieceId: string, text: string) {
  const user = await requireUser();
  const trimmed = text.trim();
  if (!trimmed) return { ok: false as const, error: "Write a note first." };
  await prisma.pieceComment.create({
    data: { pieceId, text: trimmed, author: user.email },
  });
  revalidatePath(`/content/${pieceId}`);
  return { ok: true as const };
}

export async function deletePieceComment(commentId: string) {
  await requireUser();
  const c = await prisma.pieceComment.delete({ where: { id: commentId } });
  revalidatePath(`/content/${c.pieceId}`);
  return { ok: true as const };
}

/* ---------- Assign to a creator in a campaign + create their brief ---------- */

/**
 * Puts a content idea into production: adds the creator to the campaign (if
 * needed), tags the piece, and creates/updates the creator's shareable brief
 * page seeded with the piece's title, description, concept, and source post.
 */
export async function assignPieceAndBrief(pieceId: string, campaignId: string, creatorId: string) {
  const user = await requireUser();
  const [piece, campaign, creator] = await Promise.all([
    prisma.contentPiece.findUniqueOrThrow({ where: { id: pieceId } }),
    prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } }),
    prisma.creator.findUniqueOrThrow({ where: { id: creatorId } }),
  ]);

  // Membership + piece tagging
  const wasMember = !!(await prisma.campaignCreator.findUnique({
    where: { campaignId_creatorId: { campaignId, creatorId } },
  }));
  if (!wasMember) {
    await prisma.campaignCreator.create({ data: { campaignId, creatorId } });
    await prisma.activity.create({
      data: { creatorId, text: `Added to campaign: ${campaign.name}`, userId: user.id },
    });
  }
  await prisma.contentPiece.update({
    where: { id: pieceId },
    data: {
      campaignId,
      creatorId,
      status: ["NEEDS_APPROVAL", "NEEDED"].includes(piece.status) ? "IN_PROGRESS" : piece.status,
    },
  });

  // Brief: seed from the piece; keep any hand-edited fields on an existing brief.
  const formatLabel = PIECE_FORMATS.find((f) => f.key === piece.format)?.label ?? "post";
  const seeded = {
    headline: `FADE × ${creator.name} — ${piece.title}`,
    sourceUrl: piece.sourceUrl,
    concept: piece.concept,
    intro:
      piece.angle ??
      `Hey ${creator.name.split(" ")[0]} — we've got a ${formatLabel.toLowerCase()} for you. The full concept is below; make it yours.`,
  };
  const existing = await prisma.creatorBrief.findUnique({
    where: { campaignId_creatorId: { campaignId, creatorId } },
  });
  const brief = existing
    ? await prisma.creatorBrief.update({ where: { id: existing.id }, data: seeded })
    : await prisma.creatorBrief.create({
        data: {
          campaignId,
          creatorId,
          ...seeded,
          deliverables: `1× ${formatLabel} — full concept below`,
          dueDate: campaign.endDate,
          compensationCents: creator.agreedCostCents,
        },
      });
  if (!existing) {
    await prisma.activity.create({
      data: { creatorId, text: `Creative brief created for campaign: ${campaign.name}`, userId: user.id },
    });
  }

  revalidatePath("/content");
  revalidatePath(`/content/${pieceId}`);
  revalidatePath(`/campaigns/${campaignId}`);
  return { ok: true as const, briefPath: `/b/${brief.token}`, editorPath: `/campaigns/${campaignId}/briefs/${creatorId}` };
}

/* ---------- AI concept generation ---------- */

const CONCEPT_SCHEMA = {
  type: "object" as const,
  properties: {
    title: { type: "string" as const, description: "Short, punchy internal title for the piece" },
    theme: { type: "string" as const, description: "1-3 word theme bucket, e.g. 'celebrity bets', 'storylines'" },
    concept: {
      type: "string" as const,
      description:
        "The full concept: HOOK, then the beats/slides/story sections, then CAPTION. Plain text with section headers in caps.",
    },
  },
  required: ["title", "theme", "concept"],
  additionalProperties: false,
};

const FORMAT_GUIDES: Record<PieceFormat, string> = {
  REACTION_VIDEO:
    "Response/reaction video: a HOOK line (first 2 seconds, on-screen text), 3-6 BEATS describing what we show and say reacting to the source post, and a CAPTION. Keep it under 45 seconds of content.",
  PHOTO_SLIDESHOW:
    "Photo slideshow: a HOOK slide, then SLIDES 2-7 each with one line of on-screen text and what image to use, then a CAPTION. Built for tapping through fast.",
  FADE_STORY:
    "Fade story: a narrative arc — THE SETUP (what the public believes/loves), THE TURN (why fading it is the smarter angle), THE PAYOFF (how it resolved or could resolve), then a CAPTION. Written like a mini sports documentary voiceover.",
  OTHER: "Free-format concept: a HOOK, the main BEATS, and a CAPTION.",
};

export type ConceptResult =
  | { ok: true; title: string; theme: string; concept: string }
  | { ok: false; error: string };

/** Turn a source post link + a short angle into a full campaign concept. */
export async function generateConcept(input: {
  sourceUrl: string;
  angle: string;
  format: PieceFormat;
  theme?: string | null;
}): Promise<ConceptResult> {
  await requireUser();
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "AI is not configured — set ANTHROPIC_API_KEY on the server." };
  }
  if (!input.angle.trim() && !input.sourceUrl.trim()) {
    return { ok: false, error: "Paste a post link or describe the angle first." };
  }

  const platform = input.sourceUrl ? detectPostPlatform(input.sourceUrl) : null;
  const formatLabel = PIECE_FORMATS.find((f) => f.key === input.format)?.label ?? input.format;

  const client = new Anthropic();
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      // Short creative-writing task — low effort keeps latency down.
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: CONCEPT_SCHEMA },
      },
      // Server-side fallback: if safety classifiers decline, retry on the
      // recommended fallback model instead of failing the request.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: `You are FADE's (fade.bet) content strategist. FADE is a sports-betting entertainment brand whose whole identity is "fade the public" — bet against what the crowd loves. You turn a source social post plus the team's angle into a production-ready content concept.

Rules:
- The team's angle is the source of truth for what the post is about; the link itself may not be readable, so never invent specifics about the post beyond what the angle says.
- Voice: sharp, funny, confident sports-bar energy. Never corporate.
- Compliance: no guaranteed-winnings claims, frame everything as entertainment not financial advice, nothing aimed at under-21 audiences.
- Keep bracketed placeholders like [clip of the post] or [odds screenshot] for anything the team must drop in.
- Structure the concept exactly per the requested format guide, with section headers in caps.
- Never mention that you are an AI.`,
      messages: [
        {
          role: "user",
          content: `${await brandVoiceContext()}\n\nSOURCE POST: ${input.sourceUrl.trim() || "none — concept from the angle alone"}${
            platform ? ` (${platform})` : ""
          }\nTEAM'S ANGLE: ${input.angle.trim() || "none given — infer a strong angle from the link context"}\n${
            input.theme?.trim() ? `THEME BUCKET: ${input.theme.trim()}\n` : ""
          }FORMAT: ${formatLabel}\nFORMAT GUIDE: ${FORMAT_GUIDES[input.format]}\n\nTASK: Write the full concept.`,
        },
      ],
    } as Anthropic.Beta.Messages.MessageCreateParamsNonStreaming);
  } catch (e) {
    console.error("[ai] generateConcept failed", e);
    if (e instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "AI request rejected — check ANTHROPIC_API_KEY." };
    }
    if (e instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "AI is rate-limited right now — try again in a moment." };
    }
    if (e instanceof Anthropic.APIError) {
      return { ok: false, error: `AI request failed (${e.status ?? "network"}).` };
    }
    return { ok: false, error: "AI request failed unexpectedly." };
  }

  if (response.stop_reason === "refusal") {
    return { ok: false, error: "The AI declined this one — try rephrasing the angle." };
  }

  const text = response.content.find(
    (b): b is Anthropic.Beta.BetaTextBlock => b.type === "text"
  )?.text;
  if (!text) return { ok: false, error: "AI returned no text — try again." };

  try {
    const parsed = JSON.parse(text) as { title?: string; theme?: string; concept?: string };
    if (!parsed.concept?.trim()) return { ok: false, error: "AI returned an empty concept — try again." };
    return {
      ok: true,
      title: parsed.title ?? "",
      theme: parsed.theme ?? "",
      concept: parsed.concept,
    };
  } catch {
    return { ok: false, error: "AI returned an unexpected format — try again." };
  }
}
