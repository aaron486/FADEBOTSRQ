"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Target, Sparkles, Flag, Loader2 } from "lucide-react";

type Milestone = { title: string; done: boolean };
type Goal = {
  id: string;
  title: string;
  category: string;
  horizon: "long_term" | "weekly_sprint";
  milestones: Milestone[];
};

const SEED: Goal[] = [
  {
    id: "1",
    title: "Close 3 Power-5 NIL partnerships by Q3",
    category: "partnerships",
    horizon: "long_term",
    milestones: [
      { title: "Finalize tier-1 pitch deck", done: true },
      { title: "Warm intro to 10 AD offices", done: true },
      { title: "Run 5 discovery calls", done: false },
      { title: "Negotiate MSA templates with legal", done: false },
      { title: "Signed LOI from 3 programs", done: false },
    ],
  },
  {
    id: "2",
    title: "Ship Postgame v2 creator analytics",
    category: "product",
    horizon: "weekly_sprint",
    milestones: [
      { title: "Spec review w/ eng", done: true },
      { title: "API contract locked", done: true },
      { title: "Staging QA pass", done: false },
    ],
  },
];

export function MissionControl() {
  const [goals, setGoals] = useState<Goal[]>(SEED);
  const [newGoal, setNewGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const breakdown = async () => {
    if (!newGoal.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: newGoal }),
      });
      const data = await res.json();
      const milestones: Milestone[] = (data.milestones ?? []).map((t: string) => ({
        title: t,
        done: false,
      }));
      setGoals((g) => [
        {
          id: String(Date.now()),
          title: newGoal,
          category: "revenue",
          horizon: "long_term",
          milestones:
            milestones.length > 0
              ? milestones
              : [
                  { title: "Define success metric", done: false },
                  { title: "Identify key stakeholders", done: false },
                  { title: "Draft 30/60/90 plan", done: false },
                  { title: "Ship v0 this sprint", done: false },
                  { title: "Review + iterate", done: false },
                ],
        },
        ...g,
      ]);
      setNewGoal("");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (gid: string, idx: number) =>
    setGoals((gs) =>
      gs.map((g) =>
        g.id === gid
          ? {
              ...g,
              milestones: g.milestones.map((m, i) =>
                i === idx ? { ...m, done: !m.done } : m
              ),
            }
          : g
      )
    );

  return (
    <Card className="col-span-12 lg:col-span-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-neon/10 p-2 text-neon">
              <Target className="h-4 w-4" />
            </div>
            <div>
              <CardTitle>Mission Control</CardTitle>
              <CardDescription>Long-term goals &middot; Weekly sprints</CardDescription>
            </div>
          </div>
          <Badge variant="neon">{goals.length} active</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Type a bold objective — e.g. 'Become the #1 NIL platform in the SEC by EOY'"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
          />
          <Button onClick={breakdown} disabled={loading} className="self-end">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            AI Breakdown
          </Button>
        </div>

        <div className="space-y-4">
          {goals.map((g) => {
            const done = g.milestones.filter((m) => m.done).length;
            const pct = g.milestones.length
              ? Math.round((done / g.milestones.length) * 100)
              : 0;
            return (
              <div
                key={g.id}
                className="rounded-xl border border-charcoal-300/60 bg-charcoal-50/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <Flag className="mt-0.5 h-4 w-4 text-neon" />
                    <div>
                      <p className="text-sm font-semibold text-white">{g.title}</p>
                      <div className="mt-1 flex gap-2">
                        <Badge variant={g.horizon === "long_term" ? "neon" : "warn"}>
                          {g.horizon === "long_term" ? "Long-Term" : "Weekly Sprint"}
                        </Badge>
                        <Badge variant="muted">{g.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-neon">{pct}%</p>
                    <p className="text-[10px] uppercase tracking-wider text-white/40">
                      {done}/{g.milestones.length}
                    </p>
                  </div>
                </div>
                <Progress value={pct} className="mt-3" />
                <ul className="mt-3 space-y-1.5">
                  {g.milestones.map((m, i) => (
                    <li key={i}>
                      <button
                        onClick={() => toggle(g.id, i)}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs text-white/70 transition hover:bg-charcoal-200 hover:text-white"
                      >
                        <span
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${
                            m.done
                              ? "border-neon bg-neon text-charcoal"
                              : "border-white/30"
                          }`}
                        >
                          {m.done && "✓"}
                        </span>
                        <span className={m.done ? "line-through text-white/30" : ""}>
                          {m.title}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
