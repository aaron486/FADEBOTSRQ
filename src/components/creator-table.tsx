"use client";

import { useRouter } from "next/navigation";
import {
  Stage,
  STAGES,
  stageMeta,
  PLATFORMS,
  channels,
  primaryChannel,
  totalFollowers,
  profileUrl,
  fmtMoneyCents,
  fmtNum,
  fmtDate,
} from "@/lib/creator-meta";
import type { CreatorRow } from "@/components/dashboard-view";

export function CreatorTable({
  rows,
  onStageChange,
}: {
  rows: CreatorRow[];
  onStageChange: (id: string, stage: Stage) => void;
}) {
  const router = useRouter();

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[920px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs text-ink-3">
            {["Creator", "Contact", "Stage", "Last outreach", "Agreed", "Paid", "Contract", "Posts", "Views"].map(
              (h, i) => (
                <th
                  key={h}
                  className={`px-3 py-2.5 font-semibold whitespace-nowrap ${i >= 4 && i <= 5 ? "text-right" : ""} ${
                    i >= 7 ? "text-right" : ""
                  }`}
                  style={{ borderBottom: "1px solid var(--grid)" }}
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => {
            const s = stageMeta(c.stage);
            return (
              <tr
                key={c.id}
                className="cursor-pointer hover:bg-accent/5"
                onClick={() => router.push(`/creators/${c.id}`)}
              >
                <td className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--grid)" }}>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-ink-3">
                    {[c.niche, totalFollowers(c) > 0 ? `${fmtNum(totalFollowers(c))} followers` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </td>
                <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderBottom: "1px solid var(--grid)" }}>
                  {(() => {
                    const primary = primaryChannel(c);
                    const others = channels(c).filter((ch) => ch.platform !== primary?.platform);
                    return (
                      <span className="inline-flex items-center gap-1.5">
                        {primary ? (
                          <>
                            <span className="chip">{PLATFORMS[primary.platform].label}</span>
                            <a
                              href={profileUrl(primary.platform, primary.handle)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:underline"
                              style={{ color: "var(--accent)" }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {primary.handle}
                            </a>
                          </>
                        ) : (
                          <span className="text-ink-3">—</span>
                        )}
                        {others.map((ch) => (
                          <a
                            key={ch.platform}
                            href={profileUrl(ch.platform, ch.handle)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="chip hover:underline"
                            title={`${PLATFORMS[ch.platform].label}: ${ch.handle}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {PLATFORMS[ch.platform].short}
                          </a>
                        ))}
                        {c.phone && <span className="chip" title={`Phone: ${c.phone}`}>☎</span>}
                      </span>
                    );
                  })()}
                </td>
                <td className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--grid)" }} onClick={(e) => e.stopPropagation()}>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="dot" style={{ background: s.colorVar }} />
                    <select
                      className="bg-transparent text-[13px] cursor-pointer"
                      style={{ color: "var(--text-primary)" }}
                      value={c.stage}
                      onChange={(e) => onStageChange(c.id, e.target.value as Stage)}
                      aria-label={`Stage for ${c.name}`}
                    >
                      {STAGES.map((st) => (
                        <option key={st.key} value={st.key}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </span>
                </td>
                <td className="px-3 py-2.5 text-ink-3 whitespace-nowrap" style={{ borderBottom: "1px solid var(--grid)" }}>
                  {fmtDate(c.lastOutreachAt)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums" style={{ borderBottom: "1px solid var(--grid)" }}>
                  {fmtMoneyCents(c.agreedCostCents)}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums" style={{ borderBottom: "1px solid var(--grid)" }}>
                  {fmtMoneyCents(c.paidCents)}
                </td>
                <td className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--grid)" }}>
                  {c.contractStatus === "SIGNED" ? (
                    <span className="chip" style={{ color: "var(--good-text)", borderColor: "var(--good)" }}>
                      Signed
                    </span>
                  ) : c.contractStatus === "NONE" ? (
                    <span className="text-ink-3">—</span>
                  ) : (
                    <span className="chip">{c.contractStatus.toLowerCase()}</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums" style={{ borderBottom: "1px solid var(--grid)" }}>
                  {c.postCount || "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums" style={{ borderBottom: "1px solid var(--grid)" }}>
                  {c.totalViews ? fmtNum(c.totalViews) : "—"}
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={9} className="px-3 py-8 text-center text-ink-3">
                No creators match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
