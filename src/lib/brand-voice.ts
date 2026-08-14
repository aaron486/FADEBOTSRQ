// Brand voice + content plan, stored once and injected into every AI task
// (outreach drafts, content concepts, creative briefs).

import { prisma } from "@/lib/prisma";

export type BrandVoice = {
  voice: string;
  contentPlan: string;
};

export const FALLBACK_BRAND_VOICE: BrandVoice = {
  voice:
    "FADE (fade.bet) sounds like the sharpest guy at the sports bar: confident, funny, direct. " +
    "Core identity: fade the public — bet against what the crowd loves. Never corporate, never " +
    "salesy, no buzzwords. Entertainment first; betting is the sweat, not financial advice.",
  contentPlan: "",
};

/** Saved brand voice/content plan, with FADE fallbacks per field. */
export async function getBrandVoice(): Promise<BrandVoice> {
  const setting = await prisma.appSetting.findUnique({ where: { key: "brandVoice" } });
  let saved: Partial<BrandVoice> = {};
  if (setting) {
    try {
      saved = JSON.parse(setting.value) as Partial<BrandVoice>;
    } catch {
      // Corrupt JSON — ignore and use fallbacks.
    }
  }
  return {
    voice: typeof saved.voice === "string" && saved.voice.trim() ? saved.voice : FALLBACK_BRAND_VOICE.voice,
    contentPlan: typeof saved.contentPlan === "string" ? saved.contentPlan : "",
  };
}

/** Prompt block appended to every AI task's context. */
export async function brandVoiceContext(): Promise<string> {
  const bv = await getBrandVoice();
  return [
    `BRAND VOICE GUIDE (follow this exactly):\n${bv.voice}`,
    bv.contentPlan.trim() ? `CONTENT PLAN / CURRENT PRIORITIES (align with this):\n${bv.contentPlan}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");
}
