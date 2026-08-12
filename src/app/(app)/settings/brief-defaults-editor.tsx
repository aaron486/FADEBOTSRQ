"use client";

import { useState, useTransition } from "react";
import { saveBriefDefaults } from "@/lib/actions/briefs";
import { BriefDefaults, BRIEF_DEFAULT_FIELDS } from "@/lib/brief-defaults";

export function BriefDefaultsEditor({ defaults }: { defaults: BriefDefaults }) {
  const [values, setValues] = useState<BriefDefaults>(defaults);
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function save() {
    setNote("");
    startTransition(async () => {
      await saveBriefDefaults(values);
      setNote("Saved — every brief page now shows these.");
    });
  }

  return (
    <div className="card p-4 mt-4">
      <div className="text-sm font-semibold mb-1">Brief brand defaults</div>
      <p className="text-xs text-ink-3 mb-3">
        The boilerplate every creator brief shares — socials, product details, do/don&apos;t rules, legal
        disclosure, usage rights. Edit once here and all brief pages update instantly. A brief only differs
        if you type something into that field on that specific brief.
      </p>
      <div className="space-y-3">
        {BRIEF_DEFAULT_FIELDS.map((f) => (
          <div key={f.key}>
            <label className="field-label" htmlFor={`bd-${f.key}`}>{f.label}</label>
            <textarea
              id={`bd-${f.key}`}
              className="input"
              rows={f.rows}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-3 mt-3">
        {note && <span className="text-xs" style={{ color: "var(--good-text)" }}>{note}</span>}
        <button className="btn btn-primary btn-sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save brand defaults"}
        </button>
      </div>
    </div>
  );
}
