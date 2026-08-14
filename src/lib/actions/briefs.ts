"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import { PLATFORMS, Platform, channels, fmtDate, fmtMoneyCents } from "@/lib/creator-meta";
import { BriefDefaults } from "@/lib/brief-defaults";
import { BrandVoice, brandVoiceContext } from "@/lib/brand-voice";

/** Save the brand voice + content plan used by every AI feature. */
export async function saveBrandVoice(input: BrandVoice) {
  await requireUser();
  await prisma.appSetting.upsert({
    where: { key: "brandVoice" },
    create: { key: "brandVoice", value: JSON.stringify(input) },
    update: { value: JSON.stringify(input) },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

/** Save the brand-level brief boilerplate shared by every brief. */
export async function saveBriefDefaults(input: BriefDefaults) {
  await requireUser();
  await prisma.appSetting.upsert({
    where: { key: "briefDefaults" },
    create: { key: "briefDefaults", value: JSON.stringify(input) },
    update: { value: JSON.stringify(input) },
  });
  revalidatePath("/settings");
  return { ok: true as const };
}

export type BriefInput = {
  headline: string;
  sourceUrl: string;
  concept: string;
  intro: string;
  referenceLinks: string;
  brandSocials: string;
  productDetails: string;
  differentiators: string;
  mainGoal: string;
  targetAudience: string;
  desiredAction: string;
  visualGuidelines: string;
  tone: string;
  legalDisclosure: string;
  timeline: string;
  usageRights: string;
  deliverables: string;
  talkingPoints: string;
  dos: string;
  donts: string;
  dueDate: string | null; // yyyy-mm-dd
  compensationCents: number | null;
};

const clean = (v: string) => v.trim() || null;

export async function saveBrief(campaignId: string, creatorId: string, input: BriefInput) {
  const user = await requireUser();
  const data = {
    headline: clean(input.headline),
    sourceUrl: clean(input.sourceUrl),
    concept: clean(input.concept),
    intro: clean(input.intro),
    referenceLinks: clean(input.referenceLinks),
    brandSocials: clean(input.brandSocials),
    productDetails: clean(input.productDetails),
    differentiators: clean(input.differentiators),
    mainGoal: clean(input.mainGoal),
    targetAudience: clean(input.targetAudience),
    desiredAction: clean(input.desiredAction),
    visualGuidelines: clean(input.visualGuidelines),
    tone: clean(input.tone),
    legalDisclosure: clean(input.legalDisclosure),
    timeline: clean(input.timeline),
    usageRights: clean(input.usageRights),
    deliverables: clean(input.deliverables),
    talkingPoints: clean(input.talkingPoints),
    dos: clean(input.dos),
    donts: clean(input.donts),
    dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00Z`) : null,
    compensationCents: input.compensationCents,
  };
  const existing = await prisma.creatorBrief.findUnique({
    where: { campaignId_creatorId: { campaignId, creatorId } },
  });
  if (existing) {
    await prisma.creatorBrief.update({ where: { id: existing.id }, data });
  } else {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
    await prisma.creatorBrief.create({ data: { campaignId, creatorId, ...data } });
    await prisma.activity.create({
      data: { creatorId, text: `Creative brief created for campaign: ${campaign.name}`, userId: user.id },
    });
  }
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/briefs/${creatorId}`);
  return { ok: true as const };
}

export async function deleteBrief(campaignId: string, creatorId: string) {
  await requireUser();
  await prisma.creatorBrief.deleteMany({ where: { campaignId, creatorId } });
  revalidatePath(`/campaigns/${campaignId}`);
  redirect(`/campaigns/${campaignId}`);
}

/* ---------- AI brief generation ---------- */

const BRIEF_SCHEMA = {
  type: "object" as const,
  properties: {
    headline: { type: "string" as const, description: "Short page title, e.g. 'FADE × Druski — NFL Kickoff'" },
    intro: { type: "string" as const, description: "Warm 2–4 sentence welcome note addressed to the creator" },
    deliverables: { type: "string" as const, description: "Deliverables, one per line, no bullet characters" },
    talkingPoints: { type: "string" as const, description: "Talking points, one per line, no bullet characters" },
    dos: { type: "string" as const, description: "Do rules, one per line, no bullet characters" },
    donts: { type: "string" as const, description: "Don't rules, one per line, no bullet characters" },
  },
  required: ["headline", "intro", "deliverables", "talkingPoints", "dos", "donts"],
  additionalProperties: false,
};

export type GeneratedBrief = {
  headline: string;
  intro: string;
  deliverables: string;
  talkingPoints: string;
  dos: string;
  donts: string;
};

export type GenerateBriefResult = { ok: true; brief: GeneratedBrief } | { ok: false; error: string };

/** Turn a few sentences from the team into a complete creative brief. */
export async function generateBrief(
  campaignId: string,
  creatorId: string,
  prompt: string
): Promise<GenerateBriefResult> {
  await requireUser();
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, error: "AI is not configured — set ANTHROPIC_API_KEY on the server." };
  }
  if (!prompt.trim()) {
    return { ok: false, error: "Describe the ask in a sentence or two first." };
  }

  const [campaign, creator] = await Promise.all([
    prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } }),
    prisma.creator.findUniqueOrThrow({ where: { id: creatorId } }),
  ]);

  const creatorChannels = channels({
    instagramHandle: creator.instagramHandle,
    xHandle: creator.xHandle,
    tiktokHandle: creator.tiktokHandle,
    youtubeHandle: creator.youtubeHandle,
    email: creator.email,
    phone: creator.phone,
    primaryPlatform: creator.primaryPlatform as Platform,
  });

  const context = [
    `Campaign: ${campaign.name}`,
    campaign.startDate || campaign.endDate
      ? `Campaign window: ${campaign.startDate ? fmtDate(campaign.startDate) : "…"} → ${campaign.endDate ? fmtDate(campaign.endDate) : "…"}`
      : null,
    campaign.notes ? `Campaign notes: ${campaign.notes}` : null,
    `Creator: ${creator.name}`,
    `Creator channels: ${creatorChannels.map((c) => `${PLATFORMS[c.platform].label} ${c.handle}`).join(", ") || "none on file"}`,
    creator.niche ? `Creator niche: ${creator.niche}` : null,
    creator.agreedCostCents != null ? `Agreed rate: ${fmtMoneyCents(creator.agreedCostCents)}` : null,
    creator.notes ? `Internal notes on creator: ${creator.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const client = new Anthropic();
  let response: Anthropic.Beta.BetaMessage;
  try {
    response = await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      // Short structured-writing task — low effort keeps latency down.
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: BRIEF_SCHEMA },
      },
      // Server-side fallback: if safety classifiers decline, retry on the
      // recommended fallback model instead of failing the request.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: `You write creator campaign briefs for FADE (fade.bet), a sports-betting entertainment brand. The brief becomes a page the creator reads, so write TO the creator, warm and direct, in FADE's confident voice — never corporate.

Rules:
- The team's description is the source of truth for what to make; expand it into concrete deliverables (with format and rough length), 3–5 talking points in the creator's voice, and 3–5 do/don't rules each.
- Personalize with the creator's actual niche and platforms; never invent facts, follower counts, or past interactions.
- Lists: one item per line, plain text, no bullet characters or numbering.
- Always include compliance basics in the don'ts: no guaranteed winnings / not financial advice, and nothing aimed at under-21 audiences.
- Keep bracketed placeholders like [tracking link] as-is for the team to fill in.
- Never mention that you are an AI.`,
      messages: [
        {
          role: "user",
          content: `${await brandVoiceContext()}\n\nCONTEXT:\n${context}\n\nTHE TEAM'S DESCRIPTION OF THE ASK:\n${prompt.trim()}\n\nTASK: Write the complete creative brief for this creator.`,
        },
      ],
    } as Anthropic.Beta.Messages.MessageCreateParamsNonStreaming);
  } catch (e) {
    console.error("[ai] generateBrief failed", e);
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
    return { ok: false, error: "The AI declined to write this brief — try rephrasing your description." };
  }

  const text = response.content.find(
    (b): b is Anthropic.Beta.BetaTextBlock => b.type === "text"
  )?.text;
  if (!text) return { ok: false, error: "AI returned no text — try again." };

  try {
    const parsed = JSON.parse(text) as Partial<GeneratedBrief>;
    if (!parsed.deliverables?.trim()) {
      return { ok: false, error: "AI returned an empty brief — try again." };
    }
    return {
      ok: true,
      brief: {
        headline: parsed.headline ?? "",
        intro: parsed.intro ?? "",
        deliverables: parsed.deliverables ?? "",
        talkingPoints: parsed.talkingPoints ?? "",
        dos: parsed.dos ?? "",
        donts: parsed.donts ?? "",
      },
    };
  } catch {
    return { ok: false, error: "AI returned an unexpected format — try again." };
  }
}
