import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/ai/email
 * Body: { brain: string, context: string }
 * Returns: { draft: string }
 *
 * Drafts a polished, executive-grade email in the voice of a
 * "Strategic Sports Tech Executive" at Postgame (pstgm.com) given:
 *   - brain  : the user's messy notes / stream of consciousness
 *   - context: the latest email marketing news / deliverability intel
 */
export async function POST(req: NextRequest) {
  let body: { brain?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const brain = (body.brain ?? "").trim();
  const context = (body.context ?? "").trim();

  if (!brain) {
    return NextResponse.json(
      { error: "`brain` (brain dump) is required." },
      { status: 400 }
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Deterministic fallback so the dashboard still works in local dev
    return NextResponse.json({
      draft: fallbackDraft(brain, context),
      model: "fallback",
    });
  }

  const anthropic = new Anthropic({ apiKey });

  const systemPrompt = `You are the ghostwriter for a Strategic Sports Tech Executive at Postgame (pstgm.com). Postgame is a sports-tech platform operating in NIL, creator economy, and athlete marketing.

Voice & Style:
- Confident, concise, high-agency. No filler, no hedging.
- Executive-level clarity: one clear ask, one clear next step.
- Warm but direct. Never desperate, never verbose.
- You reference macro industry context (BIMI, deliverability, AI personalization, NIL market shifts) only when it strengthens the ask.
- Format: Subject line, greeting, 2-4 tight paragraphs (max ~180 words total), signature-ready close.
- Never use em-dashes; prefer short sentences.
- Never invent facts, people, or numbers that weren't provided.

Output ONLY the email draft text — no preamble, no explanation, no markdown fences.`;

  const userPrompt = `BRAIN DUMP (my messy notes):
"""
${brain}
"""

CONTEXT (latest email / industry intel to weave in only if relevant):
"""
${context || "(none)"}
"""

Write the email now.`;

  try {
    const completion = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 800,
      temperature: 0.6,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const draft =
      completion.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim() || fallbackDraft(brain, context);

    return NextResponse.json({
      draft,
      model: completion.model,
      usage: completion.usage,
    });
  } catch (err: any) {
    console.error("[api/ai/email] anthropic error:", err?.message);
    return NextResponse.json(
      {
        draft: fallbackDraft(brain, context),
        model: "fallback",
        warning: "AI provider error — returned deterministic fallback.",
      },
      { status: 200 }
    );
  }
}

function fallbackDraft(brain: string, context: string) {
  const first = brain.split(/[.\n]/)[0]?.trim() || "Following up on our conversation";
  return `Subject: ${first.slice(0, 60)}

Hi [Name],

Quick note while it is top of mind. ${brain}

${context ? `Worth flagging: ${context} — it sharpens the case for moving now.\n\n` : ""}Happy to jump on a 20-minute call this week to lock the next step. Does Thursday or Friday work on your side?

Best,
[You]
Postgame · pstgm.com`;
}
