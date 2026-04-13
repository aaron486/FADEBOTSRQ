import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Mail, Target, Trophy } from "lucide-react";

const KPIS = [
  { label: "Active Goals", value: "7", delta: "+2 WoW", icon: Target },
  { label: "Pipeline Value", value: "$4.2M", delta: "+18%", icon: TrendingUp },
  { label: "Emails Drafted", value: "32", delta: "+12", icon: Mail },
  { label: "Deals Closed", value: "3", delta: "Q2", icon: Trophy },
];

export function KpiRow() {
  return (
    <div className="col-span-12 grid grid-cols-2 gap-4 md:grid-cols-4">
      {KPIS.map((k) => {
        const Icon = k.icon;
        return (
          <Card key={k.label}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
                  {k.label}
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-white">
                  {k.value}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-neon">{k.delta}</p>
              </div>
              <div className="rounded-xl border border-neon/20 bg-neon/5 p-3 text-neon">
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
