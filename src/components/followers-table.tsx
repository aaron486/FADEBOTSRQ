"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { stageMeta, totalFollowers, fmtNum, fmtCompact } from "@/lib/creator-meta";
import type { CreatorRow } from "@/components/dashboard-view";

type Col = "ig" | "tt" | "x" | "total";

const COLS: { key: Col; label: string; value: (c: CreatorRow) => number | null }[] = [
  { key: "ig", label: "Instagram", value: (c) => c.instagramFollowers },
  { key: "tt", label: "TikTok", value: (c) => c.tiktokFollowers },
  { key: "x", label: "X", value: (c) => c.xFollowers },
  { key: "total", label: "Total", value: (c) => totalFollowers(c) },
];

const handleFor = (c: CreatorRow, col: Col) =>
  col === "ig" ? c.instagramHandle : col === "tt" ? c.tiktokHandle : col === "x" ? c.xHandle : null;

export function FollowersTable({ rows }: { rows: CreatorRow[] }) {
  const router = useRouter();
  const [sortCol, setSortCol] = useState<Col>("total");
  const [desc, setDesc] = useState(true);

  function clickHeader(col: Col) {
    if (col === sortCol) setDesc(!desc);
    else {
      setSortCol(col);
      setDesc(true); // new column always starts highest-to-lowest
    }
  }

  const sorted = useMemo(() => {
    const def = COLS.find((c) => c.key === sortCol)!;
    return [...rows].sort((a, b) => {
      const av = def.value(a) ?? -1;
      const bv = def.value(b) ?? -1;
      return desc ? bv - av : av - bv;
    });
  }, [rows, sortCol, desc]);

  const totals = {
    ig: rows.reduce((s, c) => s + (c.instagramFollowers ?? 0), 0),
    tt: rows.reduce((s, c) => s + (c.tiktokFollowers ?? 0), 0),
    x: rows.reduce((s, c) => s + (c.xFollowers ?? 0), 0),
  };

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs text-ink-3">
            <th className="px-3 py-2.5 font-semibold" style={{ borderBottom: "1px solid var(--grid)" }}>
              Creator
            </th>
            {COLS.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2.5 font-semibold text-right whitespace-nowrap cursor-pointer select-none hover:text-ink"
                style={{ borderBottom: "1px solid var(--grid)" }}
                onClick={() => clickHeader(col.key)}
                title="Click to sort"
              >
                {col.label} {sortCol === col.key ? (desc ? "▼" : "▲") : ""}
              </th>
            ))}
            <th className="px-3 py-2.5 font-semibold" style={{ borderBottom: "1px solid var(--grid)" }}>
              Stage
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => {
            const s = stageMeta(c.stage);
            return (
              <tr key={c.id} className="cursor-pointer hover:bg-accent/5" onClick={() => router.push(`/creators/${c.id}`)}>
                <td className="px-3 py-2.5" style={{ borderBottom: "1px solid var(--grid)" }}>
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-ink-3">{c.niche ?? ""}</div>
                </td>
                {COLS.map((col) => {
                  const v = col.value(c);
                  const handle = handleFor(c, col.key);
                  return (
                    <td
                      key={col.key}
                      className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap"
                      style={{
                        borderBottom: "1px solid var(--grid)",
                        fontWeight: col.key === sortCol ? 600 : 400,
                      }}
                      title={v != null && v > 0 ? fmtNum(v) : undefined}
                    >
                      {col.key !== "total" && !handle ? (
                        <span className="text-ink-3">—</span>
                      ) : (
                        <>
                          {fmtCompact(v && v > 0 ? v : col.key === "total" ? null : v)}
                          {handle && <div className="text-[11px] text-ink-3 font-normal">{handle}</div>}
                        </>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 whitespace-nowrap" style={{ borderBottom: "1px solid var(--grid)" }}>
                  <span className="inline-flex items-center gap-1.5 text-[13px]">
                    <span className="dot" style={{ background: s.colorVar }} />
                    {s.label}
                  </span>
                </td>
              </tr>
            );
          })}
          {sorted.length > 0 && (
            <tr className="text-xs text-ink-2 font-semibold">
              <td className="px-3 py-2.5">Reach across {sorted.length} creators</td>
              <td className="px-3 py-2.5 text-right tabular-nums" title={fmtNum(totals.ig)}>{fmtCompact(totals.ig || null)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums" title={fmtNum(totals.tt)}>{fmtCompact(totals.tt || null)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums" title={fmtNum(totals.x)}>{fmtCompact(totals.x || null)}</td>
              <td className="px-3 py-2.5 text-right tabular-nums" title={fmtNum(totals.ig + totals.tt + totals.x)}>
                {fmtCompact(totals.ig + totals.tt + totals.x || null)}
              </td>
              <td className="px-3 py-2.5"></td>
            </tr>
          )}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-ink-3">
                No creators match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
