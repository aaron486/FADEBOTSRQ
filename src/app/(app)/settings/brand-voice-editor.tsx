"use client";

import { useState, useTransition } from "react";
import { saveBrandVoice } from "@/lib/actions/briefs";
import { BrandVoice } from "@/lib/brand-voice";

export function BrandVoiceEditor({ initial }: { initial: BrandVoice }) {
  const [voice, setVoice] = useState(initial.voice);
  const [contentPlan, setContentPlan] = useState(initial.contentPlan);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setNote("");
    startTransition(async () => {
      await saveBrandVoice({ voice, contentPlan });
      setNote("Saved — every AI draft, concept, and brief now uses this.");
    });
  }

  return (
    <div className="card p-4 mt-4">
      <div className="text-sm font-semibold mb-1">Brand voice &amp; content plan</div>
      <p className="text-xs text-ink-3 mb-3">
        Paste as much as you want — voice rules, phrases you use, example captions, content pillars,
        this month&apos;s priorities. The AI reads all of it every time it writes outreach messages,
        content concepts, or creative briefs.
      </p>
      <div className="space-y-3">
        <div>
          <label className="field-label" htmlFor="bv-voice">Brand voice — how FADE sounds</label>
          <textarea id="bv-voice" className="input" rows={8}
            placeholder={"e.g. rules, tone, signature phrases, words we never use, example posts we loved…"}
            value={voice} onChange={(e) => setVoice(e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="bv-plan">Content plan — pillars, themes, current priorities</label>
          <textarea id="bv-plan" className="input" rows={8}
            placeholder={"e.g. pillars (fade stories, celebrity bets, trap games), posting cadence, what we're pushing this month, promos to mention…"}
            value={contentPlan} onChange={(e) => setContentPlan(e.target.value)} />
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 mt-3">
        {note && <span className="text-xs" style={{ color: "var(--good-text)" }}>{note}</span>}
        <button className="btn btn-primary btn-sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save voice & plan"}
        </button>
      </div>
    </div>
  );
}
