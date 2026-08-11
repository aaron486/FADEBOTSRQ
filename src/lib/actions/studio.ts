"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import { PieceFormat, PieceStatus, PIECE_FORMATS, detectPostPlatform } from "@/lib/creator-meta";

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
    notes: clean(input.notes),
  };
}

/** Quick-add from the board: link + angle + format (+ optional generated concept). */
export async function createPiece(input: {
  title: string;
  format: PieceFormat;
  theme: string | null;
  sourceUrl: string | null;
  angle: string | null;
  concept: string | null;
  status?: PieceStatus;
}) {
  await requireUser();
  const title = input.title.trim();
  if (!title) return { ok: false as const, error: "Give the piece a title." };
  const piece = await prisma.contentPiece.create({
    data: {
      title,
      format: input.format,
      status: input.status ?? "NEEDED",
      theme: clean(input.theme),
      sourceUrl: clean(input.sourceUrl),
      angle: clean(input.angle),
      concept: clean(input.concept),
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
          content: `SOURCE POST: ${input.sourceUrl.trim() || "none — concept from the angle alone"}${
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
