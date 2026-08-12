// Brand-level brief boilerplate shared by every creator brief. Stored once in
// AppSetting ("briefDefaults"); a brief's own field overrides only when set.

import { prisma } from "@/lib/prisma";

export type BriefDefaults = {
  brandSocials: string;
  productDetails: string;
  differentiators: string;
  dos: string;
  donts: string;
  legalDisclosure: string;
  usageRights: string;
  tone: string;
  visualGuidelines: string;
};

export const BRIEF_DEFAULT_FIELDS: { key: keyof BriefDefaults; label: string; rows: number }[] = [
  { key: "brandSocials", label: "Brand social handles — one per line", rows: 3 },
  { key: "productDetails", label: "Product details", rows: 3 },
  { key: "differentiators", label: "Key differentiators — one per line", rows: 3 },
  { key: "dos", label: "Do — one per line", rows: 4 },
  { key: "donts", label: "Don't — one per line", rows: 4 },
  { key: "legalDisclosure", label: "Legal disclosure rules — one per line", rows: 2 },
  { key: "usageRights", label: "Usage rights", rows: 2 },
  { key: "tone", label: "Tone of voice", rows: 2 },
  { key: "visualGuidelines", label: "Visual guidelines — one per line", rows: 3 },
];

export const FALLBACK_BRIEF_DEFAULTS: BriefDefaults = {
  brandSocials: "Instagram: @Fade.bet\nX: @fade__bet\nTikTok: @fadebet",
  productDetails:
    "FADE (fade.bet) is a sports-betting entertainment platform built around one idea: fade the public — bet against what the crowd loves.",
  differentiators:
    "We own the fade-the-public angle — nobody else does\nEntertainment-first, not another odds screen",
  dos: "Post during the campaign window\nTag @fade and use your tracking link\nSend content for approval before posting",
  donts:
    "No guarantees of winning — keep it fun, not financial advice\nDon't read the talking points like a script\nNo posts targeting under-21 audiences",
  legalDisclosure:
    '#ad visible in the caption (not buried)\n21+ only — include "21+. Gambling problem? Call 1-800-GAMBLER" where required',
  usageRights: "FADE may repost and whitelist this content for 30 days from posting",
  tone: "Funny, confident, authentic — sports-bar energy, never corporate",
  visualGuidelines:
    "Natural lighting, shot on phone is fine\nShow the app screen when relevant\nCaptions on for sound-off viewers",
};

/** Saved brand defaults, falling back to the FADE boilerplate per field. */
export async function getBriefDefaults(): Promise<BriefDefaults> {
  const setting = await prisma.appSetting.findUnique({ where: { key: "briefDefaults" } });
  let saved: Partial<BriefDefaults> = {};
  if (setting) {
    try {
      saved = JSON.parse(setting.value) as Partial<BriefDefaults>;
    } catch {
      // Corrupt JSON — ignore and use fallbacks.
    }
  }
  const out = { ...FALLBACK_BRIEF_DEFAULTS };
  for (const { key } of BRIEF_DEFAULT_FIELDS) {
    if (typeof saved[key] === "string") out[key] = saved[key] as string;
  }
  return out;
}
