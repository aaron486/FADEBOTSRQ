"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Video,
  Users,
  Briefcase,
  Coffee,
  FileSignature,
} from "lucide-react";

const TODAY = [
  { time: "08:30", label: "Exec standup · Postgame leadership", icon: Users, tag: "P0" },
  { time: "10:00", label: "Pitch review · SEC partnership deck", icon: FileSignature, tag: "P0" },
  { time: "11:30", label: "1:1 · Head of Product", icon: Briefcase, tag: "P1" },
  { time: "13:00", label: "Lunch w/ agency partner", icon: Coffee, tag: "P2" },
  { time: "15:00", label: "Zoom · Nike NIL working session", icon: Video, tag: "P0" },
];

export function CalendarPanel() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="col-span-12 lg:col-span-4">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-neon/10 p-2 text-neon">
            <CalendarDays className="h-4 w-4" />
          </div>
          <div>
            <CardTitle>Today</CardTitle>
            <CardDescription>{today}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {TODAY.map((e, i) => {
            const Icon = e.icon;
            return (
              <li
                key={i}
                className="group flex items-center gap-3 rounded-xl border border-charcoal-300/40 bg-charcoal-50/40 p-3 transition hover:border-neon/40"
              >
                <span className="w-12 text-[11px] font-mono text-neon">{e.time}</span>
                <Icon className="h-4 w-4 text-white/60 group-hover:text-neon" />
                <span className="flex-1 text-sm text-white/90">{e.label}</span>
                <Badge variant={e.tag === "P0" ? "neon" : "muted"}>{e.tag}</Badge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
