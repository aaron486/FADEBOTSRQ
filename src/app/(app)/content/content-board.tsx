"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PieceFormat,
  PieceStatus,
  PIECE_FORMATS,
  PIECE_STATUSES,
  pieceFormatMeta,
  detectPostPlatform,
  fmtDate,
  fmtCompact,
} from "@/lib/creator-meta";
import { createPiece, generateConcept, setPieceStatus, syncVaultByLink } from "@/lib/actions/studio";

export type PieceRow = {
  id: string;
  title: string;
  format: PieceFormat;
  status: PieceStatus;
  theme: string | null;
  tags: string | null;
  sourceUrl: string | null;
  angle: string | null;
  hasConcept: boolean;
  assetUrl: string | null;
  scheduledFor: string | null;
  publishedUrl: string | null;
  views: number | null;
  thumbnailUrl: string | null;
  updatedAt: string;
};

/* Large card cover — the visual is the point of the card view. */
function CardThumb({ row }: { row: PieceRow }) {
  const [failed, setFailed] = useState(false);
  if (!row.thumbnailUrl || failed) {
    const isFolder = row.assetUrl?.includes("/folders/");
    return (
      <div className="w-full flex items-center justify-center text-4xl" style={{ background: "var(--grid)", aspectRatio: "16/10" }}>
        {row.assetUrl ? (isFolder ? "📁" : "🎬") : "💡"}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={row.thumbnailUrl.replace("sz=w400", "sz=w800")} alt="" className="w-full object-cover"
      style={{ aspectRatio: "16/10" }} onError={() => setFailed(true)} />
  );
}


/* ---- Vault import: paste any Drive folder link, sync it in ---- */
function VaultFolderBar({ driveConfigured }: { driveConfigured: boolean }) {
  const [link, setLink] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  function sync() {
    if (!link.trim() || busy) return;
    setNote("");
    setBusy(true);
    startTransition(async () => {
      const res = await syncVaultByLink(link);
      setBusy(false);
      if (!res.ok) return setNote(res.error);
      setLink("");
      setNote(
        `Synced — ${res.total} item${res.total === 1 ? "" : "s"} in the folder, ${res.added} new piece${res.added === 1 ? "" : "s"} added to the vault.`
      );
    });
  }

  const isError = note && !note.startsWith("Synced");

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-2">
          Bulk import a vault folder
        </div>
        <input
          className="input flex-1 min-w-[260px]"
          placeholder="https://drive.google.com/drive/folders/… — paste any vault folder"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          aria-label="Vault folder link"
        />
        <button
          className="btn btn-primary btn-sm"
          onClick={sync}
          disabled={busy || !driveConfigured || !link.trim()}
          title={driveConfigured ? "Pull this folder's contents in as In-vault pieces" : "Add GOOGLE_API_KEY in Vercel to enable sync"}
        >
          {busy ? "Syncing…" : "⇅ Sync folder"}
        </button>
      </div>
      <p className="text-xs text-ink-3 mt-2">
        Works with as many vault folders as you have — every loose file, and every <b>subfolder</b> (one
        post&apos;s worth of content), becomes an <b>In vault</b> piece. Deduped, so re-syncing a folder never
        duplicates.
        {!driveConfigured && " Sync needs the GOOGLE_API_KEY env var in Vercel."}
      </p>
      {note && (
        <p className="text-xs mt-1" style={{ color: isError ? "var(--critical)" : "var(--good-text)" }}>{note}</p>
      )}
    </div>
  );
}

export function ContentBoard({
  rows: initial,
  aiEnabled,
  driveConfigured,
}: {
  rows: PieceRow[];
  aiEnabled: boolean;
  driveConfigured: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [, startTransition] = useTransition();

  // Render-time resync when the server sends fresh data.
  const [lastInitial, setLastInitial] = useState(initial);
  if (initial !== lastInitial) {
    setLastInitial(initial);
    setRows(initial);
  }

  /* ---- Add-a-campaign form (existing content, or imagine a new one) ---- */
  const [mode, setMode] = useState<"existing" | "new">("new");
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [angle, setAngle] = useState("");
  const [format, setFormat] = useState<PieceFormat>("REACTION_VIDEO");
  const [theme, setTheme] = useState("");
  const [busy, setBusy] = useState<"idle" | "generating" | "adding">("idle");
  const [note, setNote] = useState("");

  function addPiece(withAi: boolean) {
    if (busy !== "idle") return;
    setNote("");
    setBusy(withAi ? "generating" : "adding");
    startTransition(async () => {
      // Your title wins; AI only names it when you left the title blank.
      let finalTitle =
        title.trim() || angle.trim().slice(0, 60) || sourceUrl.trim().slice(0, 60) || "Untitled concept";
      let concept: string | null = null;
      let finalTheme = theme.trim() || null;
      if (withAi) {
        const gen = await generateConcept({ sourceUrl, angle, format, theme: finalTheme });
        if (!gen.ok) {
          setBusy("idle");
          return setNote(gen.error);
        }
        if (!title.trim()) finalTitle = gen.title || finalTitle;
        concept = gen.concept;
        finalTheme = finalTheme ?? (gen.theme || null);
      }
      const res = await createPiece({ title: finalTitle, format, theme: finalTheme, sourceUrl: sourceUrl || null, angle: angle || null, concept, assetUrl: assetUrl || null });
      setBusy("idle");
      if (!res.ok) return setNote(res.error);
      router.push(`/content/${res.id}`);
    });
  }

  /* ---- Filters ---- */
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<PieceStatus | "">("");
  const [formatFilter, setFormatFilter] = useState<PieceFormat | "">("");
  const [themeFilter, setThemeFilter] = useState("");

  const themes = useMemo(
    () => Array.from(new Set(rows.map((r) => r.theme?.trim()).filter((t): t is string => !!t))).sort(),
    [rows]
  );

  const filtered = rows.filter((r) => {
    if (statusFilter && r.status !== statusFilter) return false;
    if (formatFilter && r.format !== formatFilter) return false;
    if (themeFilter && (r.theme ?? "") !== themeFilter) return false;
    if (q.trim()) {
      const hay = `${r.title} ${r.theme ?? ""} ${r.tags ?? ""} ${r.angle ?? ""}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  const counts = Object.fromEntries(PIECE_STATUSES.map((s) => [s.key, 0])) as Record<PieceStatus, number>;
  rows.forEach((r) => {
    counts[r.status] += 1;
  });

  function moveStatus(id: string, status: PieceStatus) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    startTransition(() => {
      void setPieceStatus(id, status);
    });
  }

  const platform = sourceUrl ? detectPostPlatform(sourceUrl) : null;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-1">Content studio</h1>
        <p className="text-sm text-ink-2">
          What&apos;s banked in the vault, what&apos;s scheduled, and what still needs making — all in one place.
        </p>
      </div>

      {/* Status tiles (click to filter) */}
      <section className="grid gap-2 mb-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        {PIECE_STATUSES.map((s) => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(statusFilter === s.key ? "" : s.key)}
            className="card px-3 py-2.5 text-left cursor-pointer"
            style={statusFilter === s.key ? { outline: "2px solid var(--accent)", outlineOffset: -1 } : undefined}
          >
            <div className="text-xl font-bold tabular-nums">{counts[s.key]}</div>
            <div className="flex items-center gap-1.5 text-xs text-ink-2">
              <span className="dot" style={{ background: s.colorVar }} />
              {s.label}
            </div>
            <div className="text-[11px] text-ink-3">{s.caption}</div>
          </button>
        ))}
      </section>

      {/* Add a campaign — existing content, or imagine a new one */}
      <section className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-ink-2 mr-auto">Add a campaign</div>
          <div className="flex rounded-lg overflow-hidden" style={{ border: "1px solid var(--edge)" }}>
            {(
              [
                { key: "new", label: "✨ Imagine a new one" },
                { key: "existing", label: "I have the content" },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className="px-3 py-1.5 text-[13px] cursor-pointer"
                style={
                  mode === m.key
                    ? { background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 600 }
                    : { background: "transparent", color: "var(--text-secondary)" }
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          <div>
            <label className="field-label" htmlFor="c-title">Campaign title</label>
            <input id="c-title" className="input" placeholder={`e.g. "Chiefs trap game week"`}
              value={title} onChange={(e) => setTitle(e.target.value)} />
            {mode === "new" && <p className="text-[11px] text-ink-3 mt-1">Leave blank and ✨ will name it for you.</p>}
          </div>
          {mode === "existing" ? (
            <div>
              <label className="field-label" htmlFor="c-asset">Content link (Google Drive — file or folder)</label>
              <input id="c-asset" className="input" placeholder="drive.google.com/… — a folder with several files still counts as one post"
                value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} />
              {assetUrl.trim() && <p className="text-[11px] text-ink-3 mt-1">Lands In vault, ready to queue.</p>}
            </div>
          ) : (
            <div>
              <label className="field-label" htmlFor="src">Source post link (X, Instagram, TikTok)</label>
              <input id="src" className="input" placeholder="https://x.com/…  ·  instagram.com/reel/…  ·  tiktok.com/@…/video/…"
                value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
              {platform && <p className="text-[11px] text-ink-3 mt-1">Detected: {platform === "X" ? "X" : platform.charAt(0) + platform.slice(1).toLowerCase()}</p>}
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="angle">Description — what&apos;s this about, and what&apos;s the play?</label>
            <textarea id="angle" className="input" rows={2}
              placeholder={
                mode === "existing"
                  ? `e.g. "Five slides from the rivalry week shoot — one post"`
                  : `e.g. "Schefter post has everyone on the Chiefs — classic public trap game, we fade it"`
              }
              value={angle} onChange={(e) => setAngle(e.target.value)} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="input w-auto" value={format} onChange={(e) => setFormat(e.target.value as PieceFormat)} aria-label="Format">
            {PIECE_FORMATS.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
          <input className="input w-44" placeholder="Theme (optional)" value={theme} onChange={(e) => setTheme(e.target.value)} list="themes" />
          <datalist id="themes">
            {themes.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          {mode === "existing" ? (
            <button
              className="btn btn-primary"
              onClick={() => addPiece(false)}
              disabled={busy !== "idle" || (!title.trim() && !assetUrl.trim())}
            >
              {busy === "adding" ? "Adding…" : "+ Add to vault"}
            </button>
          ) : (
            <>
              {aiEnabled && (
                <button className="btn btn-primary" onClick={() => addPiece(true)} disabled={busy !== "idle" || (!sourceUrl.trim() && !angle.trim())}>
                  {busy === "generating" ? "Writing concept…" : "✨ Generate concept"}
                </button>
              )}
              <button
                className="btn"
                onClick={() => addPiece(false)}
                disabled={busy !== "idle" || (!title.trim() && !sourceUrl.trim() && !angle.trim())}
              >
                + Add without AI
              </button>
            </>
          )}
          {note && <span className="text-xs" style={{ color: "var(--critical)" }}>{note}</span>}
          {busy === "generating" && (
            <span className="text-xs" style={{ color: "var(--accent)" }}>
              Turning that into a {pieceFormatMeta(format).label.toLowerCase()} concept…
            </span>
          )}
        </div>

        {mode === "existing" && (
          <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--grid)" }}>
            <VaultFolderBar driveConfigured={driveConfigured} />
          </div>
        )}
      </section>

      {/* Filters */}
      <section className="flex flex-wrap items-center gap-2 mb-3">
        <input type="search" className="input flex-1 min-w-[200px]" placeholder="Search title, theme, tags, angle…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PieceStatus | "")}>
          <option value="">All statuses</option>
          {PIECE_STATUSES.map((st) => (
            <option key={st.key} value={st.key}>{st.label}</option>
          ))}
        </select>
        <select className="input w-auto" value={formatFilter} onChange={(e) => setFormatFilter(e.target.value as PieceFormat | "")}>
          <option value="">All formats</option>
          {PIECE_FORMATS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>
        <select className="input w-auto" value={themeFilter} onChange={(e) => setThemeFilter(e.target.value)}>
          <option value="">All themes</option>
          {themes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </section>

      {/* Pieces */}
      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-3">
          {rows.length === 0
            ? "Nothing yet — drop a post link and an angle above to spin up your first concept."
            : "No pieces match those filters."}
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {filtered.map((r) => (
            <div key={r.id} className="card overflow-hidden cursor-pointer hover:border-accent transition-colors"
              onClick={() => router.push(`/content/${r.id}`)}>
              <CardThumb row={r} />
              <div className="p-3">
                <div className="font-semibold leading-tight mb-0.5">{r.title}</div>
                <div className="text-xs text-ink-3 mb-2">
                  {pieceFormatMeta(r.format).label}
                  {r.theme ? ` · ${r.theme}` : ""}
                  {r.tags ? ` · ${r.tags}` : ""}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <select className="input w-auto text-xs" value={r.status}
                    onChange={(e) => moveStatus(r.id, e.target.value as PieceStatus)}>
                    {PIECE_STATUSES.map((st) => (
                      <option key={st.key} value={st.key}>{st.label}</option>
                    ))}
                  </select>
                  <span className="text-xs text-ink-3 tabular-nums ml-auto">
                    {r.views != null ? `${fmtCompact(r.views)} views` : r.scheduledFor ? fmtDate(r.scheduledFor) : ""}
                  </span>
                </div>
                <div className="text-xs mt-2" onClick={(e) => e.stopPropagation()}>
                  {r.sourceUrl && <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="underline mr-2">source</a>}
                  {r.assetUrl && <a href={r.assetUrl} target="_blank" rel="noreferrer" className="underline mr-2">asset</a>}
                  {r.publishedUrl && <a href={r.publishedUrl} target="_blank" rel="noreferrer" className="underline">post</a>}
                  {!r.sourceUrl && !r.assetUrl && !r.publishedUrl && <span className="text-ink-3">no links yet</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
