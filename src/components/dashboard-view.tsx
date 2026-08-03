"use client";

import { useMemo, useState, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import {
  Platform,
  Stage,
  ContractStatus,
  STAGES,
  stageIndex,
  PLATFORMS,
  fmtMoneyCents,
  fmtNum,
} from "@/lib/creator-meta";
import { setStage } from "@/lib/actions/creators";
import { CreatorTable } from "@/components/creator-table";
import { KanbanBoard } from "@/components/kanban";

export type CreatorRow = {
  id: string;
  name: string;
  instagramHandle: string | null;
  xHandle: string | null;
  tiktokHandle: string | null;
  email: string | null;
  phone: string | null;
  primaryPlatform: Platform;
  agencyName: string | null;
  followers: number | null;
  niche: string | null;
  notes: string | null;
  stage: Stage;
  agreedCostCents: number | null;
  paidCents: number | null;
  contractStatus: ContractStatus;
  postCount: number;
  totalViews: number;
  lastOutreachAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SortKey = "updated" | "created" | "name" | "followers" | "cost" | "stage";
type ViewMode = "table" | "board";

// View preference lives in localStorage, exposed as an external store so it
// survives reloads without hydration mismatches.
const VIEW_EVENT = "fade-view-change";
function subscribeView(cb: () => void) {
  window.addEventListener(VIEW_EVENT, cb);
  return () => window.removeEventListener(VIEW_EVENT, cb);
}
function readView(): ViewMode {
  try {
    return localStorage.getItem("fade-view") === "board" ? "board" : "table";
  } catch {
    return "table";
  }
}

export function DashboardView({ rows: serverRows }: { rows: CreatorRow[] }) {
  // Local copy so kanban drags apply optimistically; resyncs when the server
  // revalidates and sends fresh props.
  const [rows, setRows] = useState(serverRows);
  const [prevServerRows, setPrevServerRows] = useState(serverRows);
  if (prevServerRows !== serverRows) {
    setPrevServerRows(serverRows);
    setRows(serverRows);
  }

  const view = useSyncExternalStore(subscribeView, readView, () => "table" as ViewMode);
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState<Platform | "">("");
  const [stageFilter, setStageFilter] = useState<Stage | "">("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [, startTransition] = useTransition();

  function switchView(v: ViewMode) {
    try {
      localStorage.setItem("fade-view", v);
    } catch {}
    window.dispatchEvent(new Event(VIEW_EVENT));
  }

  const filtered = useMemo(() => {
    let list = rows;
    const query = q.trim().toLowerCase();
    if (query) {
      list = list.filter((c) =>
        [c.name, c.instagramHandle, c.xHandle, c.tiktokHandle, c.email, c.phone, c.agencyName, c.niche, c.notes].some(
          (v) => (v ?? "").toLowerCase().includes(query)
        )
      );
    }
    if (platform) {
      const key = {
        INSTAGRAM: "instagramHandle",
        X: "xHandle",
        TIKTOK: "tiktokHandle",
        EMAIL: "email",
      }[platform] as keyof CreatorRow;
      list = list.filter((c) => !!c[key]);
    }
    if (stageFilter) list = list.filter((c) => c.stage === stageFilter);

    const sorters: Record<SortKey, (a: CreatorRow, b: CreatorRow) => number> = {
      updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      created: (a, b) => b.createdAt.localeCompare(a.createdAt),
      name: (a, b) => a.name.localeCompare(b.name),
      followers: (a, b) => (b.followers ?? 0) - (a.followers ?? 0),
      cost: (a, b) => (b.agreedCostCents ?? 0) - (a.agreedCostCents ?? 0),
      stage: (a, b) => stageIndex(a.stage) - stageIndex(b.stage),
    };
    return [...list].sort(sorters[sort]);
  }, [rows, q, platform, stageFilter, sort]);

  function moveStage(id: string, stage: Stage) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, stage } : r)));
    startTransition(() => {
      void setStage(id, stage);
    });
  }

  /* ---- KPIs ---- */
  const active = rows.filter((c) => c.stage !== "DECLINED");
  const awaiting = rows.filter((c) => c.stage === "OUTREACH_SENT").length;
  const confirmedPlus = active.filter((c) => stageIndex(c.stage) >= stageIndex("CONFIRMED")).length;
  const committed = active.reduce((s, c) => s + (c.agreedCostCents ?? 0), 0);
  const paid = active.reduce((s, c) => s + (c.paidCents ?? 0), 0);
  const postCount = rows.reduce((s, c) => s + c.postCount, 0);
  const views = rows.reduce((s, c) => s + c.totalViews, 0);
  const cpm = views > 0 && paid > 0 ? (paid / views) * 1000 : null;

  const kpis = [
    { label: "Creators", value: fmtNum(rows.length), sub: `${active.length} active` },
    { label: "Awaiting reply", value: fmtNum(awaiting), sub: "outreach sent" },
    { label: "Confirmed+", value: fmtNum(confirmedPlus), sub: "confirmed or beyond" },
    { label: "Committed", value: fmtMoneyCents(committed), sub: "agreed rates" },
    {
      label: "Paid out",
      value: fmtMoneyCents(paid),
      sub: committed > 0 ? `${Math.round((paid / committed) * 100)}% of committed` : "",
      good: true,
    },
    { label: "Posts", value: fmtNum(postCount), sub: `${fmtNum(views)} views` },
    { label: "Cost / 1k views", value: cpm == null ? "—" : fmtMoneyCents(Math.round(cpm)), sub: "paid ÷ views" },
  ];

  const stageCounts = Object.fromEntries(STAGES.map((s) => [s.key, 0])) as Record<Stage, number>;
  rows.forEach((c) => {
    stageCounts[c.stage] += 1;
  });

  return (
    <div>
      {/* KPI tiles */}
      <section className="grid gap-3 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {kpis.map((k) => (
          <div key={k.label} className="card px-3.5 py-3">
            <div className="text-xs text-ink-3">{k.label}</div>
            <div className="text-2xl font-bold">{k.value}</div>
            <div className="text-xs" style={{ color: k.good ? "var(--good-text)" : "var(--text-secondary)" }}>
              {k.sub || " "}
            </div>
          </div>
        ))}
      </section>

      {/* Stage cards (click to filter) */}
      <section className="grid gap-2 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
        {STAGES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStageFilter(stageFilter === s.key ? "" : s.key)}
            className="card px-3 py-2.5 text-left cursor-pointer"
            style={stageFilter === s.key ? { outline: "2px solid var(--accent)", outlineOffset: -1 } : undefined}
          >
            <div className="text-xl font-bold">{stageCounts[s.key]}</div>
            <div className="flex items-center gap-1.5 text-xs text-ink-2">
              <span className="dot" style={{ background: s.colorVar }} />
              {s.label}
            </div>
          </button>
        ))}
      </section>

      {/* Toolbar */}
      <section className="flex flex-wrap items-center gap-2 mb-3">
        <input
          type="search"
          className="input flex-1 min-w-[200px]"
          placeholder="Search name, handle, niche, notes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="input w-auto" value={platform} onChange={(e) => setPlatform(e.target.value as Platform | "")}>
          <option value="">All platforms</option>
          {Object.entries(PLATFORMS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        {view === "table" && (
          <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="updated">Recently updated</option>
            <option value="created">Recently added</option>
            <option value="name">Name A–Z</option>
            <option value="followers">Followers</option>
            <option value="cost">Agreed cost</option>
            <option value="stage">Pipeline stage</option>
          </select>
        )}
        <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--edge)" }}>
          {(["table", "board"] as const).map((v) => (
            <button
              key={v}
              onClick={() => switchView(v)}
              className="px-3 py-1.5 text-[13px] cursor-pointer"
              style={
                view === v
                  ? { background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 600 }
                  : { background: "var(--surface-1)", color: "var(--text-secondary)" }
              }
            >
              {v === "table" ? "Table" : "Board"}
            </button>
          ))}
        </div>
        <Link href="/creators/new" className="btn btn-primary">
          + Add creator
        </Link>
      </section>

      {rows.length === 0 ? (
        <div className="card p-12 text-center text-ink-2">
          <p className="font-semibold text-ink mb-1">No creators yet.</p>
          <p className="text-sm mb-4">
            Add a creator&apos;s Instagram, X, or email to start tracking outreach → confirmation → contract → posts.
          </p>
          <Link href="/creators/new" className="btn btn-primary">
            + Add your first creator
          </Link>
        </div>
      ) : view === "table" ? (
        <CreatorTable rows={filtered} onStageChange={moveStage} />
      ) : (
        <KanbanBoard rows={filtered} onStageChange={moveStage} />
      )}
    </div>
  );
}
