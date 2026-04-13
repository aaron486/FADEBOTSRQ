import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { goal } = await req.json();
  if (!goal || typeof goal !== "string") {
    return NextResponse.json({ error: "`goal` required" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ milestones: fallbackMilestones(goal) });
  }

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 400,
      temperature: 0.5,
      system: `You break a long-term goal into EXACTLY 5 concrete, sequenced milestones. Each milestone is a single short imperative sentence (< 10 words). Output ONLY a JSON array of strings. No prose.`,
      messages: [{ role: "user", content: `Goal: ${goal}` }],
    });
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const parsed = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] ?? "[]");
    return NextResponse.json({
      milestones: Array.isArray(parsed) && parsed.length ? parsed : fallbackMilestones(goal),
    });
  } catch {
    return NextResponse.json({ milestones: fallbackMilestones(goal) });
  }
}

function fallbackMilestones(goal: string) {
  return [
    `Define success metric for: ${goal.slice(0, 40)}`,
    "Identify top 3 stakeholders and align",
    "Draft 30/60/90 execution plan",
    "Ship a v0 this sprint",
    "Review, learn, double down",
  ];
}
