"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { stageMeta, totalFollowers, fmtNum, fmtCompact, fmtDate } from "@/lib/creator-meta";
import { refreshFollowers } from "@/lib/actions/lookup";
import type { CreatorRow } from "@/components/dashboard-view";

type Col = "ig" | "tt" | "x" | "yt" | "total";

const COLS: { key: Col; label: string; value: (c: CreatorRow) => number | null }[] = [
  { key: "ig", label: "Instagram", value: (c) => c.instagramFollowers },
  { key: "tt", label: "TikTok", value: (c) => c.tiktokFollowers },
  { key: "x", label: "X", value: (c) => c.xFollowers },
  { key: "yt", label: "YouTube", value: (c) => c.youtubeFollowers },
  { key: "total", label: "Total", value: (c) => totalFollowers(c) },
];

const handleFor = (c: CreatorRow, col: Col) =>
  col === "ig"
    ? c.instagramHandle
    : col === "tt"
      ? c.tiktokHandle
      : col === "x"
        ? c.xHandle
        : col === "yt"
          ? c.youtubeHandle
          : null;

const deltaFor = (c: CreatorRow, col: Col): number | null => {
  switch (col) {
    case "ig":
      return c.igDelta;
    case "tt":
      return c.ttDelta;
    case "x":
      return c.xDelta;
    case "yt":
      return c.ytDelta;
    case "total": {
      const parts = [c.igDelta, c.ttDelta, c.xDelta, c.ytDelta].filter((d): d is number => d != null);
      return parts.length ? parts.reduce((s, d) => s + d, 0) : null;
    }
  }
};

function Delta({ value }: { value: number | null }) {
  if (value == null || value === 0) return null;
  return (
    <div
      className="text-[11px] font-normal"
      style={{ color: value > 0 ? "var(--good-text)" : "var(--critical)" }}
      title="Change since the previous count"
    >
      {value > 0 ? "+" : "−"}
      {fmtCompact(Math.abs(value))}
    </div>
  );
}

export function FollowersTable({ rows, aiEnabled }: { rows: CreatorRow[]; aiEnabled: boolean }) {
  const router = useRouter();
  const [sortCol, setSortCol] = useState<Col>("total");
  const [desc, setDesc] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batch, setBatch] = useState<{ done: number; total: number } | null>(null);
  const [notice, setNotice] = useState("");

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

  const refreshable = sorted.filter(
    (c) => c.instagramHandle || c.xHandle || c.tiktokHandle || c.youtubeHandle
  );

  async function refreshOne(id: string) {
    setBusyId(id);
    setNotice("");
    const res = await refreshFollowers(id);
    setBusyId(null);
    setNotice(
      res.ok
        ? res.changes.length
          ? `Updated: ${res.changes.join(", ")}`
          : "Counts verified — no change"
        : res.error
    );
    router.refresh();
  }

  async function refreshAll() {
    if (batch) return;
    setNotice("");
    const targets = refreshable;
    setBatch({ done: 0, total: targets.length });
    let updated = 0;
    for (let i = 0; i < targets.length; i++) {
      setBusyId(targets[i].id);
      const res = await refreshFollowers(targets[i].id);
      if (res.ok && res.changes.length) updated++;
      setBatch({ done: i + 1, total: targets.length });
      router.refresh();
    }
    setBusyId(null);
    setBatch(null);
    setNotice(`Refreshed ${targets.length} creators — ${updated} with changed counts`);
  }

  const totals = {
    ig: rows.reduce((s, c) => s + (c.instagramFollowers ?? 0), 0),
    tt: rows.reduce((s, c) => s + (c.tiktokFollowers ?? 0), 0),
    x: rows.reduce((s, c) => s + (c.xFollowers ?? 0), 0),
    yt: rows.reduce((s, c) => s + (c.youtubeFollowers ?? 0), 0),
  };

  return (
    <div className="space-y-2">
      {aiEnabled && (
        <div className="flex items-center gap-3">
          <button className="btn btn-sm" onClick={refreshAll} disabled={!!batch || !!busyId || refreshable.length === 0}>
            {batch ? `Refreshing ${batch.done}/${batch.total}…` : "↻ Refresh all counts"}
          </button>
          {notice && <span className="text-xs text-ink-2">{notice}</span>}
          {!notice && !batch && (
            <span className="text-[11px] text-ink-3">
              Re-checks live follower counts via web search (~a few seconds per creator). Green/red numbers show change since the last check.
            </span>
          )}
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-sm">
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
              {aiEnabled && <th style={{ borderBottom: "1px solid var(--grid)" }}></th>}
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
                        className="px-3 py-2.5 text-right tabular-nums whitespace-nowrap align-top"
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
                            <Delta value={deltaFor(c, col.key)} />
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
                  {aiEnabled && (
                    <td
                      className="px-3 py-2.5 text-right whitespace-nowrap"
                      style={{ borderBottom: "1px solid var(--grid)" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {(c.instagramHandle || c.xHandle || c.tiktokHandle || c.youtubeHandle) && (
                        <button
                          className="btn btn-sm btn-ghost"
                          disabled={!!busyId || !!batch}
                          onClick={() => refreshOne(c.id)}
                          title={
                            c.followersUpdatedAt
                              ? `Refresh counts (last checked ${fmtDate(c.followersUpdatedAt)})`
                              : "Refresh counts via web search"
                          }
                        >
                          {busyId === c.id ? "…" : "↻"}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {sorted.length > 0 && (
              <tr className="text-xs text-ink-2 font-semibold">
                <td className="px-3 py-2.5">Reach across {sorted.length} creators</td>
                <td className="px-3 py-2.5 text-right tabular-nums" title={fmtNum(totals.ig)}>{fmtCompact(totals.ig || null)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums" title={fmtNum(totals.tt)}>{fmtCompact(totals.tt || null)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums" title={fmtNum(totals.x)}>{fmtCompact(totals.x || null)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums" title={fmtNum(totals.yt)}>{fmtCompact(totals.yt || null)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums" title={fmtNum(totals.ig + totals.tt + totals.x + totals.yt)}>
                  {fmtCompact(totals.ig + totals.tt + totals.x + totals.yt || null)}
                </td>
                <td className="px-3 py-2.5"></td>
                {aiEnabled && <td></td>}
              </tr>
            )}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={aiEnabled ? 8 : 7} className="px-3 py-8 text-center text-ink-3">
                  No creators match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
