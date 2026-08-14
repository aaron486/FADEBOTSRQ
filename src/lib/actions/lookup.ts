"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";

const MODEL = "claude-opus-5";

export type ProfileHit = {
  handle: string;
  followers: number | null;
  url: string | null;
};

export type LookupResult =
  | {
      ok: true;
      found: boolean;
      name: string;
      instagram: ProfileHit | null;
      x: ProfileHit | null;
      tiktok: ProfileHit | null;
      youtube: ProfileHit | null;
      email: string | null;
      niche: string | null;
      note: string | null;
    }
  | { ok: false; error: string };

/**
 * Web-search for a creator's public social profiles and follower counts,
 * using Claude's server-side web search tool. Follower counts are what public
 * pages report — treat as approximate.
 */
export async function lookupCreator(
  rawName: string,
  seed?: { platform: "INSTAGRAM" | "X" | "TIKTOK" | "YOUTUBE"; handle: string }
): Promise<LookupResult> {
  await requireUser();
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "Profile lookup needs ANTHROPIC_API_KEY set on the server." };
  }
  const name = rawName.trim();
  if (name.length < 2) return { ok: false, error: "Type a creator name first." };

  const seedUrls = {
    INSTAGRAM: (h: string) => `https://instagram.com/${h.replace(/^@/, "")}`,
    X: (h: string) => `https://x.com/${h.replace(/^@/, "")}`,
    TIKTOK: (h: string) => `https://www.tiktok.com/@${h.replace(/^@/, "")}`,
    YOUTUBE: (h: string) => `https://www.youtube.com/@${h.replace(/^@/, "")}`,
  } as const;
  const seedLabel = { INSTAGRAM: "Instagram", X: "X", TIKTOK: "TikTok", YOUTUBE: "YouTube" } as const;

  const client = new Anthropic();

  const system = `You research creators for a partnerships CRM. Use web search to find the OFFICIAL public social profiles of the person the user names. Be careful about impersonator/fan accounts — prefer verified or widely-cited official handles. If several people share the name, pick the most prominent creator and say so in "note". Never invent handles or counts; use null when unsure.

After searching, respond with ONLY a JSON object (no prose, no markdown fences) in exactly this shape:
{
  "found": boolean,
  "name": "properly capitalized display name",
  "instagram": {"handle": "@handle", "followers": 21000000, "url": "https://instagram.com/..."} | null,
  "x": {"handle": "@handle", "followers": 3400000, "url": "https://x.com/..."} | null,
  "tiktok": {"handle": "@handle", "followers": 9000000, "url": "https://www.tiktok.com/@..."} | null,
  "youtube": {"handle": "@channelhandle", "followers": 5000000, "url": "https://www.youtube.com/@..."} | null,
  "email": "publicly listed booking/business email" | null,
  "niche": "short description of their content niche" | null,
  "note": "one short caveat if anything is uncertain, else null"
}
For YouTube, "followers" means subscribers. Follower counts are integers (approximate is fine — round from '21.4M' style figures).`;

  let messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: seed
        ? `This ${seedLabel[seed.platform]} profile is the identity anchor — it definitely belongs to the creator we want: ${seedUrls[
            seed.platform
          ](seed.handle)}\nFind out who this creator is (their proper display name) and locate the SAME person's official profiles on the other platforms, plus follower counts for all profiles including the anchor.`
        : `Find the official social profiles for the creator: "${name}"`,
    },
  ];

  const request = (msgs: Anthropic.MessageParam[]) =>
    client.messages.create({
      model: MODEL,
      max_tokens: 4096,
      output_config: { effort: "low" },
      system,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
      messages: msgs,
    });

  let response: Anthropic.Message;
  try {
    response = await request(messages);
    // Server-side tool loops can pause; append the assistant turn and resume.
    let continuations = 0;
    while (response.stop_reason === "pause_turn" && continuations++ < 4) {
      messages = [...messages, { role: "assistant", content: response.content }];
      response = await request(messages);
    }
  } catch (e) {
    console.error("[lookup] web search failed", e);
    if (e instanceof Anthropic.AuthenticationError) {
      return { ok: false, error: "Lookup rejected — check ANTHROPIC_API_KEY." };
    }
    if (e instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Lookup is rate-limited — try again in a moment." };
    }
    if (e instanceof Anthropic.APIError) {
      return { ok: false, error: `Lookup failed (${e.status ?? "network"}).` };
    }
    return { ok: false, error: "Lookup failed unexpectedly." };
  }

  if (response.stop_reason === "refusal") {
    return { ok: false, error: "The lookup was declined — try a different name." };
  }

  // Web-search responses interleave text and tool-result blocks, and the final
  // text may carry citations — extract the JSON object rather than parsing raw.
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    return { ok: false, error: "Couldn't parse the lookup result — try again." };
  }

  try {
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      found?: boolean;
      name?: string;
      instagram?: { handle?: string; followers?: number | null; url?: string | null } | null;
      x?: { handle?: string; followers?: number | null; url?: string | null } | null;
      tiktok?: { handle?: string; followers?: number | null; url?: string | null } | null;
      youtube?: { handle?: string; followers?: number | null; url?: string | null } | null;
      email?: string | null;
      niche?: string | null;
      note?: string | null;
    };
    const clean = (p?: { handle?: string; followers?: number | null; url?: string | null } | null): ProfileHit | null =>
      p?.handle
        ? {
            handle: p.handle.startsWith("@") ? p.handle : `@${p.handle}`,
            followers: typeof p.followers === "number" && p.followers > 0 ? Math.round(p.followers) : null,
            url: p.url ?? null,
          }
        : null;
    return {
      ok: true,
      found:
        parsed.found !== false &&
        !!(parsed.instagram?.handle || parsed.x?.handle || parsed.tiktok?.handle || parsed.youtube?.handle),
      name: parsed.name?.trim() || name,
      instagram: clean(parsed.instagram),
      x: clean(parsed.x),
      tiktok: clean(parsed.tiktok),
      youtube: clean(parsed.youtube),
      email: parsed.email?.trim() || null,
      niche: parsed.niche?.trim() || null,
      note: parsed.note?.trim() || null,
    };
  } catch {
    return { ok: false, error: "Couldn't parse the lookup result — try again." };
  }
}

export type RefreshResult =
  | { ok: true; changes: string[] }
  | { ok: false; error: string };

const SOCIALS = ["INSTAGRAM", "X", "TIKTOK", "YOUTUBE"] as const;
export type SocialPlatform = (typeof SOCIALS)[number];

const SOCIAL_META = {
  INSTAGRAM: {
    label: "Instagram",
    handleField: "instagramHandle",
    countField: "instagramFollowers",
    jsonKey: "instagram",
    url: (h: string) => `https://instagram.com/${h.replace(/^@/, "")}`,
  },
  X: {
    label: "X",
    handleField: "xHandle",
    countField: "xFollowers",
    jsonKey: "x",
    url: (h: string) => `https://x.com/${h.replace(/^@/, "")}`,
  },
  TIKTOK: {
    label: "TikTok",
    handleField: "tiktokHandle",
    countField: "tiktokFollowers",
    jsonKey: "tiktok",
    url: (h: string) => `https://www.tiktok.com/@${h.replace(/^@/, "")}`,
  },
  YOUTUBE: {
    label: "YouTube",
    handleField: "youtubeHandle",
    countField: "youtubeFollowers",
    jsonKey: "youtube",
    url: (h: string) => `https://www.youtube.com/@${h.replace(/^@/, "")}`,
  },
} as const;

/**
 * Refresh a creator's social profiles via web search. For platforms with a
 * known handle it verifies and updates the follower count; for platforms
 * WITHOUT a handle it finds the official profile and adds it. Pass
 * opts.platform to target one platform (opts.handleOverride uses an unsaved
 * handle from the form); omit for all four.
 */
export async function refreshProfiles(
  creatorId: string,
  opts?: { platform?: SocialPlatform; handleOverride?: string }
): Promise<RefreshResult> {
  const user = await requireUser();
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "Profile refresh needs ANTHROPIC_API_KEY set on the server." };
  }

  const creator = await prisma.creator.findUniqueOrThrow({ where: { id: creatorId } });
  const targets: SocialPlatform[] = opts?.platform ? [opts.platform] : [...SOCIALS];

  const handleFor = (p: SocialPlatform): string | null => {
    if (opts?.platform === p && opts.handleOverride?.trim()) return opts.handleOverride.trim();
    return (creator[SOCIAL_META[p].handleField] as string | null)?.trim() || null;
  };

  const verifyLines: string[] = [];
  const findLabels: string[] = [];
  for (const p of targets) {
    const h = handleFor(p);
    if (h) verifyLines.push(`${SOCIAL_META[p].label}: ${SOCIAL_META[p].url(h)}`);
    else findLabels.push(SOCIAL_META[p].label);
  }

  // Known profiles outside the targeted set still help disambiguation.
  const contextLines = SOCIALS.filter((p) => !targets.includes(p))
    .map((p) => {
      const h = (creator[SOCIAL_META[p].handleField] as string | null)?.trim();
      return h ? `${SOCIAL_META[p].label}: ${SOCIAL_META[p].url(h)}` : null;
    })
    .filter(Boolean) as string[];

  const client = new Anthropic();
  const system = `You research creators' social profiles. Use web search.
- For profiles listed under VERIFY: get the CURRENT follower/subscriber count for that EXACT profile. Never substitute a different account.
- For platforms listed under FIND: locate the creator's OFFICIAL profile on that platform (use the known profiles as identity anchors; beware impersonator/fan accounts). Only report a handle you are confident belongs to this exact creator — otherwise null.
Respond with ONLY a JSON object (no prose, no markdown fences) containing exactly these keys: ${targets
    .map((p) => `"${SOCIAL_META[p].jsonKey}"`)
    .join(", ")} — each either {"handle": "@handle", "followers": 123456} or null. "followers" means subscribers for YouTube; integers, null when unverifiable.`;

  const userMsg = [
    `Creator: ${creator.name}${creator.niche ? ` (${creator.niche})` : ""}`,
    contextLines.length ? `Known profiles (context): ${contextLines.join("; ")}` : null,
    verifyLines.length ? `VERIFY current counts for:\n${verifyLines.join("\n")}` : null,
    findLabels.length ? `FIND their official profiles on: ${findLabels.join(", ")}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const request = (msgs: Anthropic.MessageParam[]) =>
    client.messages.create({
      model: MODEL,
      max_tokens: 3072,
      output_config: { effort: "low" },
      system,
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 6 }],
      messages: msgs,
    });

  let messages: Anthropic.MessageParam[] = [{ role: "user", content: userMsg }];
  let response: Anthropic.Message;
  try {
    response = await request(messages);
    let continuations = 0;
    while (response.stop_reason === "pause_turn" && continuations++ < 4) {
      messages = [...messages, { role: "assistant", content: response.content }];
      response = await request(messages);
    }
  } catch (e) {
    console.error("[lookup] refreshProfiles failed", e);
    if (e instanceof Anthropic.RateLimitError) {
      return { ok: false, error: "Rate-limited — try again in a moment." };
    }
    if (e instanceof Anthropic.APIError) {
      return { ok: false, error: `Refresh failed (${e.status ?? "network"}).` };
    }
    return { ok: false, error: "Refresh failed unexpectedly." };
  }
  if (response.stop_reason === "refusal") {
    return { ok: false, error: "The refresh was declined — try again." };
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) {
    return { ok: false, error: "Couldn't parse the refresh result — try again." };
  }

  let parsed: Record<string, { handle?: string | null; followers?: number | null } | null>;
  try {
    parsed = JSON.parse(text.slice(start, end + 1));
  } catch {
    return { ok: false, error: "Couldn't parse the refresh result — try again." };
  }

  const normHandle = (h?: string | null) =>
    h?.trim() ? (h.trim().startsWith("@") ? h.trim() : `@${h.trim()}`) : null;
  const sameHandle = (a: string, b: string) =>
    a.replace(/^@/, "").toLowerCase() === b.replace(/^@/, "").toLowerCase();
  const normCount = (v: unknown): number | null =>
    typeof v === "number" && v > 0 ? Math.round(v) : null;
  const fmt = (n: number) => n.toLocaleString("en-US");

  const data: Record<string, unknown> = {};
  const changes: string[] = [];
  let touchedCounts = false;

  for (const p of targets) {
    const meta = SOCIAL_META[p];
    const entry = parsed[meta.jsonKey];
    const foundHandle = normHandle(entry?.handle);
    const foundCount = normCount(entry?.followers);
    const dbHandle = (creator[meta.handleField] as string | null)?.trim() || null;
    const dbCount = creator[meta.countField] as number | null;
    const overridden = opts?.platform === p && !!opts.handleOverride?.trim();

    // Add / correct the handle only when we had none, or the user typed one.
    if (foundHandle && (!dbHandle || overridden)) {
      data[meta.handleField] = foundHandle;
      if (!dbHandle) changes.push(`${meta.label} profile added: ${foundHandle}`);
      else if (!sameHandle(dbHandle, foundHandle)) changes.push(`${meta.label} handle set to ${foundHandle}`);
    }

    // Accept the count when it clearly belongs to this creator's profile.
    const handleAgrees =
      !dbHandle || overridden || !foundHandle || sameHandle(dbHandle, foundHandle);
    if (foundCount != null && handleAgrees) {
      data[meta.countField] = foundCount;
      touchedCounts = true;
      if (dbCount !== foundCount) {
        changes.push(`${meta.label} ${dbCount != null ? fmt(dbCount) : "—"} → ${fmt(foundCount)}`);
      }
    }
  }

  if (Object.keys(data).length === 0) {
    return {
      ok: false,
      error: targets.length === 1 ? "Couldn't verify that profile this time — try again later." : "Couldn't verify any profiles this time — try again later.",
    };
  }

  const finalCounts = {
    instagramFollowers: (data.instagramFollowers as number | undefined) ?? creator.instagramFollowers,
    xFollowers: (data.xFollowers as number | undefined) ?? creator.xFollowers,
    tiktokFollowers: (data.tiktokFollowers as number | undefined) ?? creator.tiktokFollowers,
    youtubeFollowers: (data.youtubeFollowers as number | undefined) ?? creator.youtubeFollowers,
  };

  await prisma.creator.update({
    where: { id: creatorId },
    data: {
      ...data,
      ...(touchedCounts
        ? { followersUpdatedAt: new Date(), followerSnapshots: { create: { ...finalCounts } } }
        : {}),
      activities: {
        create: {
          text: changes.length ? `Profile refresh: ${changes.join(", ")}` : "Profile refresh — no change",
          userId: user.id,
        },
      },
    },
  });
  revalidatePath("/creators");
  revalidatePath(`/creators/${creatorId}`);
  return { ok: true, changes };
}
