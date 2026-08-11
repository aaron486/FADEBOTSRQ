"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  PieceFormat,
  PieceStatus,
  PIECE_FORMATS,
  PIECE_STATUSES,
  pieceStatusMeta,
} from "@/lib/creator-meta";
import { updatePiece, deletePiece, generateConcept, assignPieceAndBrief } from "@/lib/actions/studio";

type PieceData = {
  id: string;
  title: string;
  format: PieceFormat;
  status: PieceStatus;
  theme: string;
  tags: string;
  sourceUrl: string;
  angle: string;
  concept: string;
  assetUrl: string;
  scheduledFor: string;
  publishedUrl: string;
  views: number | null;
  likes: number | null;
  thumbnailUrl: string | null;
  notes: string;
  updatedAt: string;
};

type Option = { id: string; name: string };

/* Assign the idea to a creator in a campaign and publish their brief page. */
function AssignSection({
  pieceId,
  campaigns,
  creators,
  assignment,
  onAssigned,
}: {
  pieceId: string;
  campaigns: Option[];
  creators: Option[];
  assignment: { campaignId: string; creatorId: string; label: string } | null;
  onAssigned: () => void;
}) {
  const [campaignId, setCampaignId] = useState(assignment?.campaignId ?? "");
  const [creatorId, setCreatorId] = useState(assignment?.creatorId ?? "");
  const [result, setResult] = useState<{ briefPath: string; editorPath: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  function go() {
    if (!campaignId || !creatorId || busy) return;
    setBusy(true);
    startTransition(async () => {
      const res = await assignPieceAndBrief(pieceId, campaignId, creatorId);
      setBusy(false);
      if (res.ok) {
        setResult({ briefPath: res.briefPath, editorPath: res.editorPath });
        onAssigned();
      }
    });
  }

  function copy() {
    if (!result) return;
    void navigator.clipboard.writeText(`${window.location.origin}${result.briefPath}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <section className="card p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-2 mb-2">
        Assign &amp; brief
      </div>
      <p className="text-xs text-ink-3 mb-2">
        Hand this idea to a creator: they&apos;re added to the campaign, and their shareable brief page is
        created from this piece — concept, description, and the source post included.
        {assignment && ` Currently assigned to ${assignment.label}.`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <select className="input w-auto" value={campaignId} onChange={(e) => setCampaignId(e.target.value)} aria-label="Campaign">
          <option value="">Pick a campaign…</option>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select className="input w-auto" value={creatorId} onChange={(e) => setCreatorId(e.target.value)} aria-label="Creator">
          <option value="">Pick a creator…</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" onClick={go} disabled={busy || !campaignId || !creatorId}>
          {busy ? "Creating…" : assignment ? "Re-assign & update brief" : "Assign & create brief"}
        </button>
        {result && (
          <>
            <a href={result.briefPath} target="_blank" rel="noreferrer" className="btn btn-sm">Open brief ↗</a>
            <button className="btn btn-sm" onClick={copy}>{copied ? "Copied!" : "Copy brief link"}</button>
            <Link href={result.editorPath} className="btn btn-ghost btn-sm">Edit brief</Link>
          </>
        )}
      </div>
      {campaigns.length === 0 && (
        <p className="text-xs mt-2" style={{ color: "var(--critical)" }}>
          No campaigns yet — create one on the Campaigns tab first.
        </p>
      )}
    </section>
  );
}

export function PieceEditor({
  piece,
  aiEnabled,
  campaigns,
  creators,
  assignment,
}: {
  piece: PieceData;
  aiEnabled: boolean;
  campaigns: Option[];
  creators: Option[];
  assignment: { campaignId: string; creatorId: string; label: string } | null;
}) {
  const [title, setTitle] = useState(piece.title);
  const [format, setFormat] = useState<PieceFormat>(piece.format);
  const [status, setStatus] = useState<PieceStatus>(piece.status);
  const [theme, setTheme] = useState(piece.theme);
  const [tags, setTags] = useState(piece.tags);
  const [sourceUrl, setSourceUrl] = useState(piece.sourceUrl);
  const [angle, setAngle] = useState(piece.angle);
  const [concept, setConcept] = useState(piece.concept);
  const [assetUrl, setAssetUrl] = useState(piece.assetUrl);
  const [scheduledFor, setScheduledFor] = useState(piece.scheduledFor);
  const [publishedUrl, setPublishedUrl] = useState(piece.publishedUrl);
  const [views, setViews] = useState(piece.views != null ? String(piece.views) : "");
  const [likes, setLikes] = useState(piece.likes != null ? String(piece.likes) : "");
  const [notes, setNotes] = useState(piece.notes);
  const [note, setNote] = useState("");
  const [generating, setGenerating] = useState(false);
  const [pending, startTransition] = useTransition();

  const statusMeta = pieceStatusMeta(status);

  function save() {
    setNote("");
    startTransition(async () => {
      const res = await updatePiece(piece.id, {
        title,
        format,
        status,
        theme: theme || null,
        tags: tags || null,
        sourceUrl: sourceUrl || null,
        angle: angle || null,
        concept: concept || null,
        assetUrl: assetUrl || null,
        scheduledFor: scheduledFor || null,
        publishedUrl: publishedUrl || null,
        views: views.trim() === "" ? null : Number(views),
        likes: likes.trim() === "" ? null : Number(likes),
        notes: notes || null,
      });
      setNote(res.ok ? "Saved." : res.error);
    });
  }

  function regenerate() {
    if (generating) return;
    setNote("");
    setGenerating(true);
    startTransition(async () => {
      const res = await generateConcept({ sourceUrl, angle, format, theme: theme || null });
      setGenerating(false);
      if (!res.ok) return setNote(res.error);
      setConcept(res.concept);
      if (!title.trim() || title === "Untitled concept") setTitle(res.title || title);
      if (!theme.trim()) setTheme(res.theme || theme);
      setNote("Concept written — review below, then save.");
    });
  }

  function del() {
    if (!confirm(`Delete "${piece.title}"?`)) return;
    startTransition(async () => {
      await deletePiece(piece.id);
    });
  }

  const isError = note && note !== "Saved." && !note.startsWith("Concept written");

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/content" className="btn btn-ghost btn-sm">← Content studio</Link>
        {piece.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={piece.thumbnailUrl} alt="" className="h-10 w-16 rounded object-cover"
            onError={(e) => { e.currentTarget.style.display = "none"; }} />
        )}
        <h1 className="text-xl font-bold">{piece.title}</h1>
        <span className="chip flex items-center gap-1.5">
          <span className="dot" style={{ background: statusMeta.colorVar }} />
          {statusMeta.label}
        </span>
      </div>

      <AssignSection
        pieceId={piece.id}
        campaigns={campaigns}
        creators={creators}
        assignment={assignment}
        // Assigning moves a Needed piece into production server-side; mirror it here.
        onAssigned={() => setStatus((s) => (s === "NEEDED" ? "IN_PROGRESS" : s))}
      />

      <section className="card p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="field-label" htmlFor="p-title">Title</label>
            <input id="p-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-format">Format</label>
            <select id="p-format" className="input" value={format} onChange={(e) => setFormat(e.target.value as PieceFormat)}>
              {PIECE_FORMATS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="p-status">Status</label>
            <select id="p-status" className="input" value={status} onChange={(e) => setStatus(e.target.value as PieceStatus)}>
              {PIECE_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="p-theme">Theme</label>
            <input id="p-theme" className="input" placeholder="e.g. celebrity bets, storylines" value={theme} onChange={(e) => setTheme(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-tags">Tags</label>
            <input id="p-tags" className="input" placeholder="comma, separated, tags" value={tags} onChange={(e) => setTags(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-source">Source post link</label>
            <div className="flex gap-2">
              <input id="p-source" className="input flex-1" value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
              {sourceUrl.trim() && (
                <a href={sourceUrl} target="_blank" rel="noreferrer" className="btn btn-sm self-center" title="Open source post">↗</a>
              )}
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="p-angle">Description / angle</label>
            <input id="p-angle" className="input" value={angle} onChange={(e) => setAngle(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="field-label mb-0" htmlFor="p-concept">Concept</label>
            {aiEnabled && (
              <button className="btn btn-sm" onClick={regenerate} disabled={generating || (!sourceUrl.trim() && !angle.trim())}>
                {generating ? "Writing…" : concept.trim() ? "✨ Rewrite concept" : "✨ Write concept"}
              </button>
            )}
          </div>
          <textarea id="p-concept" className="input font-mono text-[13px]" rows={14}
            placeholder="HOOK / BEATS / CAPTION — write it yourself or hit ✨"
            value={concept} onChange={(e) => setConcept(e.target.value)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="field-label" htmlFor="p-asset">Finished asset link</label>
            <input id="p-asset" className="input" placeholder="Drive / Dropbox / frame.io" value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-sched">Scheduled for</label>
            <input id="p-sched" className="input" type="date" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-pub">Live post link (IG / X / TikTok)</label>
            <div className="flex gap-2">
              <input id="p-pub" className="input flex-1" placeholder="paste once it's live" value={publishedUrl} onChange={(e) => setPublishedUrl(e.target.value)} />
              {publishedUrl.trim() && (
                <a href={publishedUrl} target="_blank" rel="noreferrer" className="btn btn-sm self-center" title="Open live post">↗</a>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="field-label" htmlFor="p-views">Views</label>
            <input id="p-views" className="input" type="number" min={0} placeholder="from the live post" value={views} onChange={(e) => setViews(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-likes">Likes</label>
            <input id="p-likes" className="input" type="number" min={0} placeholder="from the live post" value={likes} onChange={(e) => setLikes(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="p-notes">Notes</label>
          <textarea id="p-notes" className="input" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex items-center justify-between">
          <button className="btn btn-danger btn-sm" onClick={del} disabled={pending}>
            Delete piece
          </button>
          <div className="flex items-center gap-3">
            {note && (
              <span className="text-xs" style={{ color: isError ? "var(--critical)" : "var(--good-text)" }}>
                {note}
              </span>
            )}
            <button className="btn btn-primary" onClick={save} disabled={pending || generating}>
              {pending && !generating ? "Saving…" : "Save piece"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
