"use server";

import Anthropic from "@anthropic-ai/sdk";
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
export async function lookupCreator(rawName: string): Promise<LookupResult> {
  await requireUser();
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "Profile lookup needs ANTHROPIC_API_KEY set on the server." };
  }
  const name = rawName.trim();
  if (name.length < 2) return { ok: false, error: "Type a creator name first." };

  const client = new Anthropic();

  const system = `You research creators for a partnerships CRM. Use web search to find the OFFICIAL public social profiles of the person the user names. Be careful about impersonator/fan accounts — prefer verified or widely-cited official handles. If several people share the name, pick the most prominent creator and say so in "note". Never invent handles or counts; use null when unsure.

After searching, respond with ONLY a JSON object (no prose, no markdown fences) in exactly this shape:
{
  "found": boolean,
  "name": "properly capitalized display name",
  "instagram": {"handle": "@handle", "followers": 21000000, "url": "https://instagram.com/..."} | null,
  "x": {"handle": "@handle", "followers": 3400000, "url": "https://x.com/..."} | null,
  "tiktok": {"handle": "@handle", "followers": 9000000, "url": "https://www.tiktok.com/@..."} | null,
  "email": "publicly listed booking/business email" | null,
  "niche": "short description of their content niche" | null,
  "note": "one short caveat if anything is uncertain, else null"
}
Follower counts are integers (approximate is fine — round from '21.4M' style figures).`;

  let messages: Anthropic.MessageParam[] = [
    { role: "user", content: `Find the official social profiles for the creator: "${name}"` },
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
        !!(parsed.instagram?.handle || parsed.x?.handle || parsed.tiktok?.handle),
      name: parsed.name?.trim() || name,
      instagram: clean(parsed.instagram),
      x: clean(parsed.x),
      tiktok: clean(parsed.tiktok),
      email: parsed.email?.trim() || null,
      niche: parsed.niche?.trim() || null,
      note: parsed.note?.trim() || null,
    };
  } catch {
    return { ok: false, error: "Couldn't parse the lookup result — try again." };
  }
}
