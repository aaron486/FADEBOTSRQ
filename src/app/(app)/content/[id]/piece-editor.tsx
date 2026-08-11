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
import { updatePiece, deletePiece, generateConcept } from "@/lib/actions/studio";

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
  notes: string;
  updatedAt: string;
};

export function PieceEditor({ piece, aiEnabled }: { piece: PieceData; aiEnabled: boolean }) {
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
        <h1 className="text-xl font-bold">{piece.title}</h1>
        <span className="chip flex items-center gap-1.5">
          <span className="dot" style={{ background: statusMeta.colorVar }} />
          {statusMeta.label}
        </span>
      </div>

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
