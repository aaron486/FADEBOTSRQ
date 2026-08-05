"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { saveBrief, deleteBrief } from "@/lib/actions/briefs";

type BriefData = {
  token: string;
  headline: string;
  intro: string;
  deliverables: string;
  talkingPoints: string;
  dos: string;
  donts: string;
  dueDate: string;
  compensationCents: number | null;
  updatedAt: string;
};

export function BriefEditor({
  campaignId,
  campaignName,
  campaignWindow,
  creatorId,
  creatorName,
  hasUploadForm,
  brief,
  defaults,
}: {
  campaignId: string;
  campaignName: string;
  campaignWindow: string | null;
  creatorId: string;
  creatorName: string;
  hasUploadForm: boolean;
  brief: BriefData | null;
  defaults: Omit<BriefData, "token" | "updatedAt">;
}) {
  const src = brief ?? defaults;
  const [headline, setHeadline] = useState(src.headline);
  const [intro, setIntro] = useState(src.intro);
  const [deliverables, setDeliverables] = useState(src.deliverables);
  const [talkingPoints, setTalkingPoints] = useState(src.talkingPoints);
  const [dos, setDos] = useState(src.dos);
  const [donts, setDonts] = useState(src.donts);
  const [dueDate, setDueDate] = useState(src.dueDate);
  const [comp, setComp] = useState(
    src.compensationCents != null ? String(src.compensationCents / 100) : ""
  );
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  const briefUrl = brief ? `/b/${brief.token}` : null;

  function save() {
    setNote("");
    startTransition(async () => {
      const res = await saveBrief(campaignId, creatorId, {
        headline,
        intro,
        deliverables,
        talkingPoints,
        dos,
        donts,
        dueDate: dueDate || null,
        compensationCents: comp.trim() === "" ? null : Math.round(Number(comp) * 100),
      });
      setNote(res.ok ? "Saved — the shared page updates instantly." : "Couldn't save, try again.");
    });
  }

  function copyLink() {
    if (!briefUrl) return;
    void navigator.clipboard.writeText(`${window.location.origin}${briefUrl}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function del() {
    if (!confirm(`Delete ${creatorName}'s brief? Their shared link will stop working.`)) return;
    startTransition(async () => {
      await deleteBrief(campaignId, creatorId);
    });
  }

  function field(
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    rows: number,
    hint?: string
  ) {
    return (
      <div>
        <label className="field-label" htmlFor={id}>{label}</label>
        <textarea id={id} className="input" rows={rows} value={value} onChange={(e) => set(e.target.value)} />
        {hint && <p className="text-[11px] text-ink-3 mt-1">{hint}</p>}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href={`/campaigns/${campaignId}`} className="btn btn-ghost btn-sm">← {campaignName}</Link>
        <h1 className="text-xl font-bold">Creative brief — {creatorName}</h1>
      </div>

      <div className="card p-4 flex flex-wrap items-center gap-2">
        {briefUrl ? (
          <>
            <span className="text-sm text-ink-2 mr-auto">
              Shareable page is live — send {creatorName} this link:
            </span>
            <a href={briefUrl} target="_blank" rel="noreferrer" className="btn btn-sm">Open page ↗</a>
            <button className="btn btn-primary btn-sm" onClick={copyLink}>
              {copied ? "Copied!" : "Copy link"}
            </button>
          </>
        ) : (
          <span className="text-sm text-ink-2">
            Save the brief to publish {creatorName}&apos;s page and get a shareable link — no login needed on their end.
          </span>
        )}
      </div>

      {!hasUploadForm && (
        <p className="text-xs text-ink-3">
          Tip: link an upload form in the campaign&apos;s Content library and the brief page will include an
          &quot;Upload your content&quot; button automatically.
        </p>
      )}

      <section className="card p-4 space-y-4">
        <div>
          <label className="field-label" htmlFor="b-headline">Headline</label>
          <input id="b-headline" className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} />
        </div>
        {field("b-intro", "Welcome note", intro, setIntro, 3)}
        {field("b-deliverables", "Deliverables — one per line", deliverables, setDeliverables, 4, "Shows as a checklist on their page.")}
        {field("b-talking", "Talking points — one per line", talkingPoints, setTalkingPoints, 4)}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {field("b-dos", "Do — one per line", dos, setDos, 4)}
          {field("b-donts", "Don't — one per line", donts, setDonts, 4)}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="b-due">Content due</label>
            <input id="b-due" className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            {campaignWindow && <p className="text-[11px] text-ink-3 mt-1">Campaign window: {campaignWindow}</p>}
          </div>
          <div>
            <label className="field-label" htmlFor="b-comp">Compensation (USD)</label>
            <input
              id="b-comp"
              className="input"
              type="number"
              min={0}
              step="0.01"
              placeholder="from their agreed rate"
              value={comp}
              onChange={(e) => setComp(e.target.value)}
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          {brief ? (
            <button className="btn btn-danger btn-sm" onClick={del} disabled={pending}>
              Delete brief
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-3">
            {note && <span className="text-xs" style={{ color: "var(--good-text)" }}>{note}</span>}
            <button className="btn btn-primary" onClick={save} disabled={pending}>
              {pending ? "Saving…" : brief ? "Save brief" : "Save & publish page"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
