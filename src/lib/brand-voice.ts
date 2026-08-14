// Brand voice + content plan, stored once and injected into every AI task
// (outreach drafts, content concepts, creative briefs).

import { prisma } from "@/lib/prisma";

export type BrandVoice = {
  voice: string;
  contentPlan: string;
};

export const FALLBACK_BRAND_VOICE: BrandVoice = {
  voice:
    "WHAT FADE SOUNDS LIKE\n" +
    "Fade is the friend who bet against you and won't let you forget it. Abrasive, funny, zero corporate polish. " +
    "We are not a news outlet and we don't pretend to be — we're a personality that happens to have an app.\n" +
    "The voice in one line: We're fading you. We're betting against you. You suck.\n\n" +
    "RULES OF THE VOICE\n" +
    "- Troll first, inform second. If a post could've come from ESPN's account, kill it.\n" +
    "- Punch at everyone — public figures, fanbases, our own followers, ourselves when we're wrong.\n" +
    "- Short and sendable. Every post should be something a guy screenshots and texts his group chat with \"this is you.\"\n" +
    "- We keep receipts. When someone's picks are trash, we bring the record.",
  contentPlan:
    "PLATFORMS: Instagram is home base (acquired page, 5-10K start). We need a viral stream of content that brings Fade " +
    "to the conversation around sporting events, betting, prediction markets and social.\n\n" +
    "CONTENT FORMATS\n" +
    "1. Then vs. Now (nostalgia meme): betting edition of the proven format; built to be sent to one specific friend; Fade fonts/colors.\n" +
    "2. Fade Him (receipts series): running records on public pickers (GameDay crew, talking heads, celebrity cappers); slap the record on their face with one word: FADE.\n" +
    "3. LOSER (shock-value graphic): clean photo, one brutal word stamped on it; low effort, high shareability, maximum voice.\n" +
    "4. Bettor Mixtapes (editorial reel): 30-45s hype-video edits of legendary and degenerate bettors; no carousels.\n" +
    "5. Lock of the Week (man on the street): college kid on the strip asking for locks; planned questions for insane answers; branded mic flag.\n" +
    "6. Your Boy's Parlay (community roast): followers submit worst beats and dumbest parlays; we post the slips and roast them; trains people to tag us.\n" +
    "7. BAD Beats (reactive): worst beats of the football weekend; win on the caption and the edit ('You had this won for 58 minutes.'); Monday morning drop.\n" +
    "8. The Group Chat Leak: fake/submitted group-chat screenshots of the delusional friend; built for tagging him.\n" +
    "9. Fade of the Week (creator UGC): rotating creators give the one pick they're betting AGAINST and talk trash; collab-posted; scales into paid partnerships.\n" +
    "10. Public Money Alert: when 80%+ of the public is on one side, post it with pure menace; positions Fade as the smart-money troll and quietly demos the app.\n" +
    "11. Career Earnings: Degenerate Edition: parody career-earnings graphic of a regular guy's lifetime betting P&L; evergreen, remixable per fanbase.\n" +
    "12. P&L Review (man on the street x Fade Wrapped): 'up or down all-time?' then pull up their real Fade Wrapped on camera; organic product demo nobody can recreate.\n" +
    "13. Creator Troll (reaction series): reactions to celebrity bettors losing; green-screen/split-screen with pure Fade energy; likely to get quote-tweeted by the target.\n\n" +
    "COLLAB STRATEGY: every subject-specific post gets collabbed with a page that owns that niche (Brady post with a Patriots page, Bama post with Bama pages); " +
    "target one collab per day (~500 followers per collab compounds); ask for reshares/reposts; paid collabs with top betting personalities (SteveWillDoIt etc).",
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
