"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Wand2, Loader2 } from "lucide-react";

type Idea = {
  id: string;
  raw: string;
  refined?: string;
  status: "raw" | "refined";
};

const SEED: Idea[] = [
  { id: "a", raw: "NIL deals are really just infra problems disguised as marketing", status: "raw" },
  { id: "b", raw: "Why every D1 program needs an attribution layer before 2027", status: "raw" },
];

export function ContentVault() {
  const [ideas, setIdeas] = useState<Idea[]>(SEED);
  const [draft, setDraft] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const add = () => {
    if (!draft.trim()) return;
    setIdeas((i) => [
      { id: String(Date.now()), raw: draft, status: "raw" },
      ...i,
    ]);
    setDraft("");
  };

  const refine = async (id: string) => {
    const idea = ideas.find((x) => x.id === id);
    if (!idea) return;
    setLoadingId(id);
    try {
      const res = await fetch("/api/ai/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: idea.raw }),
      });
      const data = await res.json();
      setIdeas((xs) =>
        xs.map((x) =>
          x.id === id ? { ...x, refined: data.refined, status: "refined" } : x
        )
      );
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Card className="col-span-12 lg:col-span-8">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-neon/10 p-2 text-neon">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>Content Idea Vault</CardTitle>
            <CardDescription>Raw sparks &rarr; Published assets</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="One sentence idea for NIL / Sports Marketing content…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <Button onClick={add} variant="outline" className="self-end">
            + Capture
          </Button>
        </div>

        <div className="space-y-3">
          {ideas.map((idea) => (
            <div
              key={idea.id}
              className="rounded-xl border border-charcoal-300/60 bg-charcoal-50/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-white/90">{idea.raw}</p>
                <Badge variant={idea.status === "refined" ? "neon" : "muted"}>
                  {idea.status}
                </Badge>
              </div>
              {idea.refined && (
                <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-neon/20 bg-charcoal p-3 font-sans text-xs text-white/80">
                  {idea.refined}
                </pre>
              )}
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  onClick={() => refine(idea.id)}
                  disabled={loadingId === idea.id}
                >
                  {loadingId === idea.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Wand2 className="h-3 w-3" />
                  )}
                  Refine
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
