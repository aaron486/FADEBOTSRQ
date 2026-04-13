"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Mail, Sparkles, Loader2, Rss, Copy } from "lucide-react";

const NEWS = [
  {
    topic: "BIMI",
    headline: "Gmail expands BIMI to unverified senders with VMC lite",
    source: "Email Geeks · Apr 2026",
  },
  {
    topic: "Deliverability",
    headline: "Yahoo raises DMARC alignment thresholds for bulk senders",
    source: "Litmus · Apr 2026",
  },
  {
    topic: "AI Personalization",
    headline: "Brand.ai hits 48% lift with per-open rewrite models",
    source: "MarTech Today · Mar 2026",
  },
  {
    topic: "Deliverability",
    headline: "Apple MPP v3 obscures open-time signals entirely",
    source: "Email on Acid · Mar 2026",
  },
];

export function EmailHub() {
  const [brain, setBrain] = useState("");
  const [context, setContext] = useState(
    "BIMI is now open to non-VMC senders on Gmail; Yahoo has tightened DMARC alignment."
  );
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brain, context }),
      });
      const data = await res.json();
      setDraft(data.draft ?? "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="col-span-12 lg:col-span-8">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-neon/10 p-2 text-neon">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>Email Intelligence Hub</CardTitle>
            <CardDescription>
              Brain Dump &rarr; Executive-grade draft
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
              The Brain Dump
            </label>
            <Textarea
              value={brain}
              onChange={(e) => setBrain(e.target.value)}
              placeholder="messy thoughts… reply to AD about NIL pilot, push for Q3 start, mention BIMI advantage"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
              The Context
            </label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Draft Email
          </Button>
        </div>

        {draft && (
          <div className="relative rounded-xl border border-neon/30 bg-charcoal-50/80 p-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigator.clipboard.writeText(draft)}
              className="absolute right-3 top-3"
            >
              <Copy className="h-3 w-3" /> copy
            </Button>
            <pre className="whitespace-pre-wrap font-sans text-sm text-white/90">
              {draft}
            </pre>
          </div>
        )}

        <div className="mt-5 border-t border-charcoal-300/40 pt-4">
          <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-white/50">
            <Rss className="h-3 w-3 text-neon" /> Email Marketing News · 2026
          </div>
          <ul className="space-y-2">
            {NEWS.map((n, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-lg border border-charcoal-300/40 bg-charcoal-50/40 p-3"
              >
                <Badge variant="neon">{n.topic}</Badge>
                <div>
                  <p className="text-sm text-white/90">{n.headline}</p>
                  <p className="text-[11px] text-white/40">{n.source}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
