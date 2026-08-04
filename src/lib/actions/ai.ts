"use server";

import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import { PLATFORMS, Platform, channels, stageMeta, Stage } from "@/lib/creator-meta";
import { scenarioByKey, TONES, ToneKey } from "@/lib/scenarios";

const MODEL = "claude-opus-5";

export type CraftInput = {
  channel: Platform;
  scenario: string;
  tone: ToneKey;
  instructions?: string;
  /** When set, rewrite this draft instead of generating from scratch. */
  currentDraft?: { subject?: string; body: string };
};

export type CraftResult =
  | { ok: true; subject: string; body: string }
  | { ok: false; error: string };

function followerSummary(c: {
  instagramFollowers: number | null;
  xFollowers: number | null;
  tiktokFollowers: number | null;
}): string | null {
  const parts = [
    c.instagramFollowers != null ? `IG ~${c.instagramFollowers.toLocaleString("en-US")}` : null,
    c.xFollowers != null ? `X ~${c.xFollowers.toLocaleString("en-US")}` : null,
    c.tiktokFollowers != null ? `TikTok ~${c.tiktokFollowers.toLocaleString("en-US")}` : null,
  ].filter(Boolean);
  return parts.length ? `Followers: ${parts.join(", ")}` : null;
}

const OUTPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    subject: {
      type: "string" as const,
      description: "Email subject line. Empty string for DMs.",
    },
    body: { type: "string" as const, description: "The message body, ready to send." },
  },
  required: ["subject", "body"],
  additionalProperties: false,
};

export async function craftOutreach(creatorId: string, input: CraftInput): Promise<CraftResult> {
  await requireUser();
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "AI is not configured — set ANTHROPIC_API_KEY on the server." };
  }

  const creator = await prisma.creator.findUniqueOrThrow({
    where: { id: creatorId },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 3, where: { status: "SENT" } },
    },
  });

  const scenario = scenarioByKey(input.scenario);
  const tone = TONES.find((t) => t.key === input.tone);
  const isEmail = input.channel === "EMAIL";

  const allChannels = channels({
    instagramHandle: creator.instagramHandle,
    xHandle: creator.xHandle,
    tiktokHandle: creator.tiktokHandle,
    email: creator.email,
    phone: creator.phone,
    primaryPlatform: creator.primaryPlatform as Platform,
  });

  const creatorContext = [
    `Name: ${creator.name}`,
    `Channels: ${allChannels.map((c) => `${PLATFORMS[c.platform].label} ${c.handle}`).join(", ") || "none on file"}`,
    `This message goes out via: ${PLATFORMS[input.channel].label}`,
    creator.agencyName ? `Represented by agency: ${creator.agencyName}` : null,
    followerSummary(creator),
    creator.niche ? `Niche: ${creator.niche}` : null,
    `Pipeline stage: ${stageMeta(creator.stage as Stage).label}`,
    creator.notes ? `Internal notes: ${creator.notes}` : null,
    creator.messages.length
      ? `Previous outreach already sent (${creator.messages.length}, newest first):\n${creator.messages
          .map((m) => `---\n${m.subject ? `Subject: ${m.subject}\n` : ""}${m.body}`)
          .join("\n")}`
      : "No outreach sent yet.",
  ]
    .filter(Boolean)
    .join("\n");

  const task = input.currentDraft?.body?.trim()
    ? `Rewrite/reimagine the CURRENT DRAFT below. Keep what works, but rework it to fit the scenario and tone. Do not simply reword sentence by sentence — restructure freely if it makes the message stronger.\n\nCURRENT DRAFT:\n${
        input.currentDraft.subject ? `Subject: ${input.currentDraft.subject}\n` : ""
      }${input.currentDraft.body}`
    : `Write a new ${isEmail ? "outreach email" : "DM"} from scratch for this scenario.`;

  const client = new Anthropic();
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      // Short copywriting task — low effort keeps latency down.
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      // Server-side fallback: if safety classifiers decline, retry on the
      // recommended fallback model instead of failing the request.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: `You write creator-outreach messages for FADE (fade.bet), a sports-betting entertainment brand. You are the brand's partnerships manager writing person-to-person.

Voice: confident, warm, direct. Sound like a real human DMing another human — never corporate, never like a mass template. No buzzwords ("synergy", "leverage", "reach out to touch base"). At most one emoji, and only when the tone calls for it.

Hard rules:
- ${isEmail ? "This is an email: write a compelling subject line and a body of 60–160 words." : "This is a social DM: no subject (return empty string), body under 420 characters, 1–3 short sentences or a tight paragraph."}
- Personalize with the creator's actual details (niche, platform); never invent facts, stats, or past interactions that aren't in the context.
- Keep any bracketed placeholders like [rate] or [deliverables] as-is so the sender can fill them in.
- FADE partnerships are: paid, flat rate agreed up front, creator keeps full creative control, simple one-page agreement. Don't promise anything else.
- Never mention that you are an AI.`,
      messages: [
        {
          role: "user",
          content: `CREATOR CONTEXT:\n${creatorContext}\n\nSCENARIO: ${scenario ? `${scenario.label} — ${scenario.description}` : input.scenario}\n\nTONE: ${tone?.label ?? input.tone}\n${
            input.instructions?.trim() ? `\nEXTRA INSTRUCTIONS FROM THE SENDER: ${input.instructions.trim()}\n` : ""
          }\nTASK: ${task}`,
        },
      ],
    } as Anthropic.Beta.Messages.MessageCreateParamsNonStreaming);
  } catch (e) {
    console.error("[ai] craftOutreach failed", e);
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
    return { ok: false, error: "The AI declined to write this message — try rephrasing your instructions." };
  }

  const text = response.content.find(
    (b): b is Anthropic.Beta.BetaTextBlock => b.type === "text"
  )?.text;
  if (!text) return { ok: false, error: "AI returned no text — try again." };

  try {
    const parsed = JSON.parse(text) as { subject?: string; body?: string };
    if (!parsed.body?.trim()) return { ok: false, error: "AI returned an empty draft — try again." };
    return { ok: true, subject: isEmail ? (parsed.subject ?? "") : "", body: parsed.body };
  } catch {
    // Structured output should guarantee JSON; fall back to raw text as body.
    return { ok: true, subject: "", body: text };
  }
}
