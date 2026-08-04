import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  CampaignStatus,
  campaignStatusMeta,
  totalFollowers,
  fmtCompact,
  fmtMoneyCents,
  fmtDate,
} from "@/lib/creator-meta";
import { NewCampaignForm } from "./new-campaign-form";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { creators: { include: { creator: true } } },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold mb-1">Campaigns</h1>
          <p className="text-sm text-ink-2">
            Group creators into a push — track reach, spend, and who&apos;s posted, per campaign.
          </p>
        </div>
        <NewCampaignForm />
      </div>

      {campaigns.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-3">
          No campaigns yet — name your first one above, then add creators to it.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {campaigns.map((c) => {
            const members = c.creators.map((m) => m.creator);
            const reach = members.reduce((sum, m) => sum + totalFollowers(m), 0);
            const committed = members.reduce((sum, m) => sum + (m.agreedCostCents ?? 0), 0);
            const paid = members.reduce((sum, m) => sum + (m.paidCents ?? 0), 0);
            const posted = members.filter((m) => m.stage === "POSTED").length;
            const status = campaignStatusMeta(c.status as CampaignStatus);
            return (
              <Link key={c.id} href={`/campaigns/${c.id}`} className="card p-4 block hover:border-accent transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-[15px]">{c.name}</span>
                  <span className="chip ml-auto flex items-center gap-1.5">
                    <span className="dot" style={{ background: status.colorVar }} />
                    {status.label}
                  </span>
                </div>
                <div className="text-xs text-ink-3 mb-3">
                  {c.startDate || c.endDate
                    ? `${c.startDate ? fmtDate(c.startDate) : "…"} → ${c.endDate ? fmtDate(c.endDate) : "…"}`
                    : `Created ${fmtDate(c.createdAt)}`}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <Stat label="Creators" value={String(members.length)} />
                  <Stat label="Reach" value={reach > 0 ? fmtCompact(reach) : "—"} />
                  <Stat label="Committed" value={committed > 0 ? fmtMoneyCents(committed) : "—"} />
                  <Stat label="Posted" value={`${posted}/${members.length}`} />
                </div>
                {c.budgetCents != null && (
                  <div className="text-xs text-ink-3 mt-2 tabular-nums">
                    Budget {fmtMoneyCents(c.budgetCents)} · paid {fmtMoneyCents(paid)}
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-ink-3">{label}</div>
    </div>
  );
}
