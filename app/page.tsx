import { MissionControl } from "@/components/dashboard/mission-control";
import { EmailHub } from "@/components/dashboard/email-hub";
import { ContentVault } from "@/components/dashboard/content-vault";
import { CalendarPanel } from "@/components/dashboard/calendar-panel";
import { KpiRow } from "@/components/dashboard/kpi-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Command, Search, Bell } from "lucide-react";

export default function DashboardPage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <main className="relative min-h-screen">
      {/* Ambient grid backdrop */}
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-60" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,rgba(199,251,74,0.12),transparent_60%)]" />

      <div className="relative mx-auto max-w-[1400px] px-6 py-8">
        {/* Top Bar */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon text-charcoal shadow-neon">
              <Zap className="h-5 w-5" strokeWidth={3} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-neon">
                Postgame // pstgm.com
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Executive Dashboard
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-charcoal-300/60 bg-charcoal-100/60 px-3 py-2 text-xs text-white/50 md:flex">
              <Search className="h-3 w-3" />
              Jump to…
              <kbd className="ml-2 flex items-center gap-1 rounded border border-charcoal-300 bg-charcoal-200 px-1.5 py-0.5 font-mono text-[10px]">
                <Command className="h-2.5 w-2.5" /> K
              </kbd>
            </div>
            <Button variant="outline" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <Badge variant="neon" className="hidden md:inline-flex">
              {today}
            </Badge>
          </div>
        </header>

        {/* Hero welcome */}
        <section className="mb-6">
          <p className="text-sm text-white/50">
            <span className="text-neon">◆</span> Strategic Sports Tech Executive · High-Agency Mode
          </p>
          <h2 className="mt-1 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Ship the next <span className="text-neon">Postgame</span> chapter.
          </h2>
        </section>

        {/* Grid */}
        <div className="grid grid-cols-12 gap-6">
          <KpiRow />
          <MissionControl />
          <CalendarPanel />
          <EmailHub />
          <ContentVault />
        </div>

        <footer className="mt-12 flex items-center justify-between border-t border-charcoal-300/40 pt-6 text-[11px] text-white/40">
          <p>Built for velocity · pstgm.com</p>
          <p className="font-mono">v0.1 // mission-control</p>
        </footer>
      </div>
    </main>
  );
}
