import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { idea } = await req.json();
  if (!idea) {
    return NextResponse.json({ error: "`idea` required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ refined: fallback(idea) });
  }

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 700,
      temperature: 0.75,
      system: `You are a sports-tech content strategist. Turn a 1-sentence raw idea into a full LinkedIn post (~140 words) in the voice of a Strategic Sports Tech Executive at Postgame. Punchy hook, 2-3 insight paragraphs, 1 crisp takeaway, single CTA. Avoid em-dashes. No hashtags except up to 3 at the end.`,
      messages: [{ role: "user", content: `Raw idea: ${idea}` }],
    });
    const draft = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return NextResponse.json({ refined: draft || fallback(idea) });
  } catch {
    return NextResponse.json({ refined: fallback(idea) });
  }
}

function fallback(idea: string) {
  return `${idea}

Here is why it matters: the sports-marketing stack has outgrown its measurement layer. Programs spend millions on NIL activations and still guess at ROI. The teams that win the next cycle will not be the ones with the biggest budgets — they will be the ones with the clearest feedback loops.

At Postgame we see it every week. The programs that instrument early compound faster.

If you are an AD, a brand lead, or a collective operator: pick one activation this month and wire up real attribution end to end. That single decision will reshape your 2027 budget.

#NIL #SportsTech #Postgame`;
}
