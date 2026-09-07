"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import { Platform } from "@/lib/creator-meta";
import { brandVoiceContext } from "@/lib/brand-voice";

const MODEL = "claude-opus-5";

export type ScoutHit = { handle: string; followers: number | null };

export type ScoutCandidate = {
  name: string;
  niche: string | null;
  why: string;
  instagram: ScoutHit | null;
  x: ScoutHit | null;
  tiktok: ScoutHit | null;
  youtube: ScoutHit | null;
  email: string | null;
  alreadyInCrm: boolean;
};

export type ScoutResult =
  | { ok: true; candidates: ScoutCandidate[]; note: string | null }
  | { ok: false; error: string };

const norm = (h: string | null | undefined) => (h ?? "").trim().replace(/^@/, "").toLowerCase();

/**
 * Turn a casting call ("college football meme pages 20-200K…") into a list of
 * real candidate creators via web search, deduped against the CRM.
 */
export async function scoutTalent(callText: string): Promise<ScoutResult> {
  await requireUser();
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "The scout needs ANTHROPIC_API_KEY set on the server." };
  }
  const call = callText.trim();
  if (call.length < 8) return { ok: false, error: "Describe who you're looking for first." };

  const system = `You are a talent scout for FADE (fade.bet), a sports-betting entertainment brand, sourcing creators and niche pages for UGC partnerships and collabs. Use web search to find REAL, currently-active accounts matching the casting call.

Rules:
- Only real accounts you found evidence for — never invent handles or follower counts; use null when unsure of a count.
- Prefer accounts plausibly reachable for paid UGC (creators and meme/niche pages), not leagues, teams, or news outlets.
- Aim for 8-12 candidates. Spread across the follower range asked for.
- "why" is one punchy sentence on why they fit FADE specifically.

After searching, respond with ONLY a JSON object (no prose, no markdown fences):
{
  "candidates": [
    {
      "name": "display name or page name",
      "niche": "short niche description",
      "why": "why they fit FADE",
      "instagram": {"handle": "@handle", "followers": 85000} | null,
      "x": {"handle": "@handle", "followers": 12000} | null,
      "tiktok": {"handle": "@handle", "followers": 400000} | null,
      "youtube": {"handle": "@handle", "followers": 50000} | null,
      "email": "public booking email" | null
    }
  ],
  "note": "one short caveat about the search overall, else null"
}`;

  const client = new Anthropic();
  let messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `${await brandVoiceContext()}\n\nCASTING CALL:\n${call}\n\nFind candidates now.`,
    },
  ];

  const request = (msgs: Anthropic.MessageParam[]) =>
    client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      output_config: { effort: "low" },
      system,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 12 }],
      messages: msgs,
    });

  let response: Anthropic.Message;
  try {
    response = await request(messages);
    // Server-side tool loops can pause; append the assistant turn and resume.
    let continuations = 0;
    while (response.stop_reason === "pause_turn" && continuations++ < 6) {
      messages = [...messages, { role: "assistant", content: response.content }];
      response = await request(messages);
    }
  } catch (e) {
    console.error("[scout] web search failed", e);
    if (e instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "Scout rejected — check ANTHROPIC_API_KEY." };
    }
    if (e instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Scout is rate-limited — try again in a moment." };
    }
    if (e instanceof Anthropic.APIError) {
      return { ok: false, error: `Scout failed (${e.status ?? "network"}).` };
    }
    return { ok: false, error: "Scout failed unexpectedly." };
  }

  if (response.stop_reason === "refusal") {
    return { ok: false, error: "The scout declined this search — try rephrasing the casting call." };
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return { ok: false, error: "The scout returned nothing usable — try again." };

  let parsed: { candidates?: unknown[]; note?: string | null };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    return { ok: false, error: "The scout's answer didn't parse — try again." };
  }

  const hit = (v: unknown): ScoutHit | null => {
    if (!v || typeof v !== "object") return null;
    const o = v as { handle?: unknown; followers?: unknown };
    if (typeof o.handle !== "string" || !o.handle.trim()) return null;
    return {
      handle: `@${o.handle.trim().replace(/^@/, "")}`,
      followers: typeof o.followers === "number" ? Math.round(o.followers) : null,
    };
  };

  // Dedupe against the CRM by any matching handle.
  const existing = await prisma.creator.findMany({
    select: { instagramHandle: true, xHandle: true, tiktokHandle: true, youtubeHandle: true },
  });
  const known = new Set<string>();
  for (const c of existing) {
    for (const h of [c.instagramHandle, c.xHandle, c.tiktokHandle, c.youtubeHandle]) {
      if (h?.trim()) known.add(norm(h));
    }
  }

  const candidates: ScoutCandidate[] = (parsed.candidates ?? [])
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .map((c) => {
      const cand: ScoutCandidate = {
        name: typeof c.name === "string" ? c.name : "Unknown",
        niche: typeof c.niche === "string" ? c.niche : null,
        why: typeof c.why === "string" ? c.why : "",
        instagram: hit(c.instagram),
        x: hit(c.x),
        tiktok: hit(c.tiktok),
        youtube: hit(c.youtube),
        email: typeof c.email === "string" ? c.email : null,
        alreadyInCrm: false,
      };
      cand.alreadyInCrm = [cand.instagram, cand.x, cand.tiktok, cand.youtube].some(
        (h) => h && known.has(norm(h.handle))
      );
      return cand;
    })
    .filter((c) => c.instagram || c.x || c.tiktok || c.youtube);

  if (candidates.length === 0) {
    return { ok: false, error: "No usable candidates came back — try a broader casting call." };
  }
  return { ok: true, candidates, note: typeof parsed.note === "string" ? parsed.note : null };
}

/** Add one scouted candidate to the pipeline at "To contact". */
export async function addScoutedCreator(c: {
  name: string;
  niche: string | null;
  why: string;
  instagram: ScoutHit | null;
  x: ScoutHit | null;
  tiktok: ScoutHit | null;
  youtube: ScoutHit | null;
  email: string | null;
}) {
  const user = await requireUser();
  const hits = [
    { key: "INSTAGRAM" as Platform, h: c.instagram },
    { key: "X" as Platform, h: c.x },
    { key: "TIKTOK" as Platform, h: c.tiktok },
    { key: "YOUTUBE" as Platform, h: c.youtube },
  ].filter((e) => e.h);
  if (hits.length === 0 && !c.email) {
    return { ok: false as const, error: "Candidate has no contact channel." };
  }
  hits.sort((a, b) => (b.h?.followers ?? 0) - (a.h?.followers ?? 0));
  const primary: Platform = hits[0]?.key ?? "EMAIL";

  const hasCounts = hits.some((e) => e.h?.followers != null);
  const creator = await prisma.creator.create({
    data: {
      name: c.name,
      instagramHandle: c.instagram?.handle ?? null,
      xHandle: c.x?.handle ?? null,
      tiktokHandle: c.tiktok?.handle ?? null,
      youtubeHandle: c.youtube?.handle ?? null,
      email: c.email,
      primaryPlatform: primary,
      instagramFollowers: c.instagram?.followers ?? null,
      xFollowers: c.x?.followers ?? null,
      tiktokFollowers: c.tiktok?.followers ?? null,
      youtubeFollowers: c.youtube?.followers ?? null,
      followersUpdatedAt: hasCounts ? new Date() : null,
      niche: c.niche,
      notes: c.why ? `Scouted: ${c.why}` : null,
      ownerId: user.id,
      activities: { create: { text: "Added via talent scout", userId: user.id } },
      ...(hasCounts
        ? {
            followerSnapshots: {
              create: {
                instagramFollowers: c.instagram?.followers ?? null,
                xFollowers: c.x?.followers ?? null,
                tiktokFollowers: c.tiktok?.followers ?? null,
                youtubeFollowers: c.youtube?.followers ?? null,
              },
            },
          }
        : {}),
    },
  });
  revalidatePath("/creators");
  return { ok: true as const, id: creator.id };
}
