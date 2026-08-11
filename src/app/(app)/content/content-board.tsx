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
import { createPiece, generateConcept, setPieceStatus, setVaultFolder, syncVaultFolder } from "@/lib/actions/studio";

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
  updatedAt: string;
};

/* ---- Vault Drive folder: link once, sync files in as In-vault pieces ---- */
function VaultFolderBar({
  vaultFolderUrl,
  driveConfigured,
}: {
  vaultFolderUrl: string | null;
  driveConfigured: boolean;
}) {
  const [editing, setEditing] = useState(!vaultFolderUrl);
  const [draft, setDraft] = useState(vaultFolderUrl ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  // Render-time resync when the saved folder changes server-side.
  const [lastUrl, setLastUrl] = useState(vaultFolderUrl);
  if (vaultFolderUrl !== lastUrl) {
    setLastUrl(vaultFolderUrl);
    setDraft(vaultFolderUrl ?? "");
    setEditing(!vaultFolderUrl);
  }

  function save() {
    setNote("");
    setBusy(true);
    startTransition(async () => {
      const res = await setVaultFolder(draft);
      setBusy(false);
      if (!res.ok) return setNote(res.error);
      setEditing(false);
      setNote(draft.trim() ? "Folder linked." : "Folder removed.");
    });
  }

  function sync() {
    setNote("");
    setBusy(true);
    startTransition(async () => {
      const res = await syncVaultFolder();
      setBusy(false);
      setNote(
        res.ok
          ? `Synced — ${res.total} file${res.total === 1 ? "" : "s"} in the folder, ${res.added} new piece${res.added === 1 ? "" : "s"} added to the vault.`
          : res.error
      );
    });
  }

  const isError = note && !/linked|removed|Synced/.test(note);

  return (
    <section className="card p-4 mb-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-2 mr-auto">
          Vault Drive folder
        </div>
        {editing ? (
          <>
            <input
              className="input flex-1 min-w-[260px]"
              placeholder="https://drive.google.com/drive/folders/… — where your finished content lives"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Vault Drive folder link"
            />
            <button className="btn btn-primary btn-sm" onClick={save} disabled={busy}>
              Save
            </button>
            {vaultFolderUrl && (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            )}
          </>
        ) : (
          <>
            <a href={vaultFolderUrl!} target="_blank" rel="noreferrer" className="btn btn-sm">
              Open folder ↗
            </a>
            <button
              className="btn btn-primary btn-sm"
              onClick={sync}
              disabled={busy || !driveConfigured}
              title={driveConfigured ? "Pull the folder's files in as In-vault pieces" : "Add GOOGLE_API_KEY in Vercel to enable sync"}
            >
              {busy ? "Syncing…" : "⇅ Sync vault"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>Edit</button>
          </>
        )}
      </div>
      <p className="text-xs text-ink-3 mt-2">
        Every file in this folder becomes an <b>In vault</b> piece here (deduped by file, titles from
        filenames) — drop finished content in Drive, hit sync, and it&apos;s tracked.
        {!driveConfigured && " Sync needs the GOOGLE_API_KEY env var in Vercel."}
      </p>
      {note && (
        <p className="text-xs mt-1" style={{ color: isError ? "var(--critical)" : "var(--good-text)" }}>{note}</p>
      )}
    </section>
  );
}

export function ContentBoard({
  rows: initial,
  aiEnabled,
  driveConfigured,
  vaultFolderUrl,
}: {
  rows: PieceRow[];
  aiEnabled: boolean;
  driveConfigured: boolean;
  vaultFolderUrl: string | null;
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

  /* ---- New concept form ---- */
  const [sourceUrl, setSourceUrl] = useState("");
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
      let title = angle.trim().slice(0, 60) || sourceUrl.trim().slice(0, 60) || "Untitled concept";
      let concept: string | null = null;
      let finalTheme = theme.trim() || null;
      if (withAi) {
        const gen = await generateConcept({ sourceUrl, angle, format, theme: finalTheme });
        if (!gen.ok) {
          setBusy("idle");
          return setNote(gen.error);
        }
        title = gen.title || title;
        concept = gen.concept;
        finalTheme = finalTheme ?? (gen.theme || null);
      }
      const res = await createPiece({ title, format, theme: finalTheme, sourceUrl: sourceUrl || null, angle: angle || null, concept });
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
          </button>
        ))}
      </section>

      <VaultFolderBar vaultFolderUrl={vaultFolderUrl} driveConfigured={driveConfigured} />

      {/* New concept */}
      <section className="card p-4 mb-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">New concept</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
          <div>
            <label className="field-label" htmlFor="src">Source post link (X, Instagram, TikTok)</label>
            <input id="src" className="input" placeholder="https://x.com/…  ·  instagram.com/reel/…  ·  tiktok.com/@…/video/…"
              value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
            {platform && <p className="text-[11px] text-ink-3 mt-1">Detected: {platform === "X" ? "X" : platform.charAt(0) + platform.slice(1).toLowerCase()}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="angle">Angle — what&apos;s the play here?</label>
            <textarea id="angle" className="input" rows={2}
              placeholder={`e.g. "Everyone's on the Chiefs after this post — classic public trap game"`}
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
          {aiEnabled && (
            <button className="btn btn-primary" onClick={() => addPiece(true)} disabled={busy !== "idle" || (!sourceUrl.trim() && !angle.trim())}>
              {busy === "generating" ? "Writing concept…" : "✨ Generate concept"}
            </button>
          )}
          <button className="btn" onClick={() => addPiece(false)} disabled={busy !== "idle" || (!sourceUrl.trim() && !angle.trim())}>
            + Add without AI
          </button>
          {note && <span className="text-xs" style={{ color: "var(--critical)" }}>{note}</span>}
          {busy === "generating" && (
            <span className="text-xs" style={{ color: "var(--accent)" }}>
              Turning that into a {pieceFormatMeta(format).label.toLowerCase()} concept…
            </span>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="flex flex-wrap items-center gap-2 mb-3">
        <input type="search" className="input flex-1 min-w-[200px]" placeholder="Search title, theme, tags, angle…"
          value={q} onChange={(e) => setQ(e.target.value)} />
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
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-left text-xs text-ink-3">
                <th className="px-3 py-2 font-medium">Piece</th>
                <th className="px-3 py-2 font-medium">Format</th>
                <th className="px-3 py-2 font-medium">Theme</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Scheduled</th>
                <th className="px-3 py-2 font-medium text-right">Views</th>
                <th className="px-3 py-2 font-medium">Links</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="cursor-pointer hover:bg-accent/5" onClick={() => router.push(`/content/${r.id}`)}>
                  <td className="px-3 py-2.5" style={{ borderTop: "1px solid var(--grid)" }}>
                    <div className="font-medium leading-tight">{r.title}</div>
                    <div className="text-xs text-ink-3">
                      {r.hasConcept ? "concept ready" : "no concept yet"}
                      {r.tags ? ` · ${r.tags}` : ""}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-xs" style={{ borderTop: "1px solid var(--grid)" }}>
                    {pieceFormatMeta(r.format).label}
                  </td>
                  <td className="px-3 py-2.5 text-xs" style={{ borderTop: "1px solid var(--grid)" }}>
                    {r.theme ?? "—"}
                  </td>
                  <td className="px-3 py-2.5" style={{ borderTop: "1px solid var(--grid)" }} onClick={(e) => e.stopPropagation()}>
                    <select className="input w-auto text-xs" value={r.status} onChange={(e) => moveStatus(r.id, e.target.value as PieceStatus)}>
                      {PIECE_STATUSES.map((s) => (
                        <option key={s.key} value={s.key}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-xs tabular-nums" style={{ borderTop: "1px solid var(--grid)" }}>
                    {r.scheduledFor ? fmtDate(r.scheduledFor) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs tabular-nums text-right" style={{ borderTop: "1px solid var(--grid)" }}>
                    {r.views != null ? fmtCompact(r.views) : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs" style={{ borderTop: "1px solid var(--grid)" }} onClick={(e) => e.stopPropagation()}>
                    {r.sourceUrl && (
                      <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="underline mr-2">source</a>
                    )}
                    {r.assetUrl && (
                      <a href={r.assetUrl} target="_blank" rel="noreferrer" className="underline mr-2">asset</a>
                    )}
                    {r.publishedUrl && (
                      <a href={r.publishedUrl} target="_blank" rel="noreferrer" className="underline">post</a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
