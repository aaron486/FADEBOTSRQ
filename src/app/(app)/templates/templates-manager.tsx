"use client";

import { useState, useTransition } from "react";
import { Platform, PLATFORMS } from "@/lib/creator-meta";
import { createTemplate, updateTemplate, deleteTemplate } from "@/lib/actions/templates";

type Template = {
  id: string;
  name: string;
  platform: Platform | null;
  subject: string | null;
  body: string;
};

const EMPTY = { name: "", platform: "" as Platform | "", subject: "", body: "" };

export function TemplatesManager({ templates }: { templates: Template[] }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function startEdit(t: Template) {
    setEditingId(t.id);
    setForm({ name: t.name, platform: t.platform ?? "", subject: t.subject ?? "", body: t.body });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit() {
    setError("");
    startTransition(async () => {
      const input = {
        name: form.name,
        platform: form.platform || null,
        subject: form.subject || null,
        body: form.body,
      };
      const res = editingId ? await updateTemplate(editingId, input) : await createTemplate(input);
      if (!res.ok) {
        setError(res.error);
      } else {
        setEditingId(null);
        setForm(EMPTY);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <h2 className="text-sm font-semibold mb-3">{editingId ? "Edit template" : "New template"}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="field-label">Name</label>
            <input
              className="input"
              placeholder="e.g. IG intro DM"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label">Platform</label>
            <select
              className="input"
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value as Platform | "" })}
            >
              <option value="">Any platform</option>
              {Object.entries(PLATFORMS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Subject (used for email)</label>
            <input
              className="input"
              placeholder="FADE x {name} — partnership"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="field-label">Body</label>
            <textarea
              className="input"
              rows={6}
              placeholder="Hey {name}! …"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </div>
        </div>
        {error && <p className="text-xs mt-2" style={{ color: "var(--critical)" }}>{error}</p>}
        <div className="flex justify-end gap-2 mt-3">
          {editingId && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditingId(null);
                setForm(EMPTY);
              }}
            >
              Cancel edit
            </button>
          )}
          <button className="btn btn-primary" onClick={submit} disabled={pending}>
            {pending ? "Saving…" : editingId ? "Save template" : "Add template"}
          </button>
        </div>
      </div>

      {templates.map((t) => (
        <div key={t.id} className="card p-4">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">{t.name}</h3>
            <span className="chip">{t.platform ? PLATFORMS[t.platform].label : "Any"}</span>
          </div>
          {t.subject && <div className="text-xs text-ink-3 mb-1">Subject: {t.subject}</div>}
          <pre
            className="whitespace-pre-wrap text-[12.5px] text-ink-2 rounded-lg p-3 mb-2.5"
            style={{ background: "var(--page)", border: "1px solid var(--grid)", fontFamily: "inherit" }}
          >
            {t.body}
          </pre>
          <div className="flex gap-2">
            <button className="btn btn-sm" onClick={() => startEdit(t)}>Edit</button>
            <button
              className="btn btn-sm btn-danger"
              disabled={pending}
              onClick={() => {
                if (confirm(`Delete template "${t.name}"?`)) {
                  startTransition(() => void deleteTemplate(t.id));
                }
              }}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
      {templates.length === 0 && <p className="text-sm text-ink-3">No templates yet — add one above.</p>}
    </div>
  );
}
