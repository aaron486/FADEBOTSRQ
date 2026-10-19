"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ContactFields,
  Stage,
  stageMeta,
  primaryChannel,
  totalFollowers,
  fmtCompact,
  PLATFORMS,
} from "@/lib/creator-meta";
import { TONES, ToneKey } from "@/lib/scenarios";
import { CreatorAvatar } from "@/components/creator-avatar";
import { findCreatorEmail } from "@/lib/actions/lookup";
import { craftOutreach } from "@/lib/actions/ai";
import { sendOutreachEmail } from "@/lib/actions/outreach";
import { removeCreatorsFromList } from "@/lib/actions/lists";

export type ListMember = ContactFields & {
  id: string;
  name: string;
  niche: string | null;
  stage: Stage;
  instagramFollowers: number | null;
  xFollowers: number | null;
  tiktokFollowers: number | null;
  youtubeFollowers: number | null;
};

type Draft = { subject: string; body: string; sent?: "real" | "simulated" };

export function ListOutreachView({
  listId,
  listName,
  initialMembers,
  aiEnabled,
}: {
  listId: string;
  listName: string;
  initialMembers: ListMember[];
  aiEnabled: boolean;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [note, setNote] = useState<Record<string, string>>({}); // per-creator status line
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [bulkBusy, setBulkBusy] = useState<"" | "find" | "draft" | "send">("");
  const [bulkNote, setBulkNote] = useState("");
  const [tone, setTone] = useState<ToneKey>("casual");
  const [instructions, setInstructions] = useState("");

  const missingEmail = members.filter((m) => !m.email);
  const withEmail = members.filter((m) => m.email);
  const readyDrafts = withEmail.filter((m) => drafts[m.id] && !drafts[m.id].sent);

  const setMemberNote = (id: string, text: string) => setNote((n) => ({ ...n, [id]: text }));
  const setMemberBusy = (id: string, v: boolean) => setBusy((b) => ({ ...b, [id]: v }));

  async function findOne(id: string): Promise<boolean> {
    setMemberBusy(id, true);
    setMemberNote(id, "Searching the web for their business email…");
    try {
      const res = await findCreatorEmail(id);
      if (!res.ok) {
        setMemberNote(id, res.error);
        return false;
      }
      if (res.email) {
        const email = res.email;
        setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, email } : m)));
        setMemberNote(id, `Found: ${email}${res.note ? ` (${res.note})` : ""}`);
        return true;
      }
      setMemberNote(id, "No publicly listed email found — try their DMs instead.");
      return false;
    } finally {
      setMemberBusy(id, false);
    }
  }

  async function findAllMissing() {
    if (bulkBusy) return;
    setBulkBusy("find");
    setBulkNote("");
    let found = 0;
    const targets = members.filter((m) => !m.email);
    for (let i = 0; i < targets.length; i++) {
      setBulkNote(`Searching ${i + 1} of ${targets.length} — ${targets[i].name}…`);
      if (await findOne(targets[i].id)) found++;
    }
    setBulkNote(`Done — found ${found} of ${targets.length} missing email${targets.length === 1 ? "" : "s"}.`);
    setBulkBusy("");
  }

  async function draftOne(id: string): Promise<boolean> {
    setMemberBusy(id, true);
    setMemberNote(id, "Drafting their email…");
    try {
      const res = await craftOutreach(id, {
        channel: "EMAIL",
        scenario: "first_contact",
        tone,
        instructions: instructions.trim() || undefined,
        currentDraft: drafts[id] && !drafts[id].sent ? { subject: drafts[id].subject, body: drafts[id].body } : undefined,
      });
      if (!res.ok) {
        setMemberNote(id, res.error);
        return false;
      }
      setDrafts((d) => ({ ...d, [id]: { subject: res.subject, body: res.body } }));
      setMemberNote(id, "Draft ready — review below.");
      return true;
    } finally {
      setMemberBusy(id, false);
    }
  }

  async function draftAll() {
    if (bulkBusy) return;
    setBulkBusy("draft");
    setBulkNote("");
    const targets = members.filter((m) => m.email && !drafts[m.id]?.sent);
    let done = 0;
    for (let i = 0; i < targets.length; i++) {
      setBulkNote(`Drafting ${i + 1} of ${targets.length} — ${targets[i].name}…`);
      if (await draftOne(targets[i].id)) done++;
    }
    setBulkNote(`Drafted ${done} of ${targets.length} — review and edit below, then send.`);
    setBulkBusy("");
  }

  async function sendOne(id: string): Promise<boolean> {
    const d = drafts[id];
    if (!d || d.sent) return false;
    setMemberBusy(id, true);
    setMemberNote(id, "Sending…");
    try {
      const res = await sendOutreachEmail(id, { subject: d.subject, body: d.body, isFollowUp: false });
      if (!res.ok) {
        setMemberNote(id, `Send failed: ${res.error}`);
        return false;
      }
      setDrafts((ds) => ({ ...ds, [id]: { ...d, sent: res.simulated ? "simulated" : "real" } }));
      setMemberNote(id, res.simulated ? "Sent (simulated — no email service configured)." : "Sent ✓");
      return true;
    } finally {
      setMemberBusy(id, false);
    }
  }

  async function sendAll() {
    if (bulkBusy) return;
    setBulkBusy("send");
    setBulkNote("");
    const targets = readyDrafts;
    let sent = 0;
    for (let i = 0; i < targets.length; i++) {
      setBulkNote(`Sending ${i + 1} of ${targets.length} — ${targets[i].name}…`);
      if (await sendOne(targets[i].id)) sent++;
    }
    setBulkNote(`Sent ${sent} of ${targets.length}.`);
    setBulkBusy("");
  }

  function removeMember(id: string, name: string) {
    if (!confirm(`Remove ${name} from "${listName}"? (They stay in the pipeline.)`)) return;
    setMembers((ms) => ms.filter((m) => m.id !== id));
    void removeCreatorsFromList(listId, [id]);
  }

  const editDraft = (id: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <Link href="/lists" className="text-sm text-ink-3 hover:underline">← Lists</Link>
        <h1 className="text-xl font-bold">{listName}</h1>
      </div>
      <p className="text-sm text-ink-2 mb-4">
        {members.length} creator{members.length === 1 ? "" : "s"} · {withEmail.length} with email
        {missingEmail.length > 0 ? ` · ${missingEmail.length} missing email` : ""}
      </p>

      {/* ---- Step 1: members + email finding ---- */}
      <section className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h2 className="font-semibold">1 · Emails</h2>
          {missingEmail.length > 0 && (
            <button className="btn btn-sm" onClick={findAllMissing} disabled={!!bulkBusy || !aiEnabled}>
              {bulkBusy === "find" ? "Searching…" : `🔍 Find ${missingEmail.length} missing email${missingEmail.length === 1 ? "" : "s"}`}
            </button>
          )}
          {!aiEnabled && (
            <span className="text-xs" style={{ color: "var(--critical)" }}>
              Email finding and drafting need ANTHROPIC_API_KEY set in Vercel.
            </span>
          )}
        </div>
        <p className="text-xs text-ink-3 mb-3">
          The finder web-searches each creator&apos;s bio, linktree, and about pages for the business email they list
          publicly, and saves it to their profile. No public email → outreach goes through DMs from their creator page.
        </p>
        <div className="space-y-1">
          {members.map((m) => {
            const ch = primaryChannel(m);
            return (
              <div key={m.id} className="flex items-center gap-3 py-1.5" style={{ borderBottom: "1px solid var(--grid)" }}>
                <CreatorAvatar creator={m} size={30} />
                <div className="flex-1 min-w-0">
                  <Link href={`/creators/${m.id}`} className="font-medium hover:underline">{m.name}</Link>
                  <span className="text-xs text-ink-3 ml-2">
                    {[
                      ch ? `${PLATFORMS[ch.platform].short} ${ch.handle}` : null,
                      totalFollowers(m) > 0 ? fmtCompact(totalFollowers(m)) : null,
                      stageMeta(m.stage).label,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {note[m.id] && <div className="text-xs mt-0.5" style={{ color: "var(--accent)" }}>{note[m.id]}</div>}
                </div>
                <div className="flex-none text-sm">
                  {m.email ? (
                    <span className="tabular-nums">✉ {m.email}</span>
                  ) : (
                    <button className="btn btn-sm" onClick={() => findOne(m.id)} disabled={busy[m.id] || !!bulkBusy || !aiEnabled}>
                      {busy[m.id] ? "Searching…" : "🔍 Find email"}
                    </button>
                  )}
                </div>
                <button
                  className="btn btn-ghost btn-sm flex-none"
                  title="Remove from this list"
                  onClick={() => removeMember(m.id, m.name)}
                >
                  ✕
                </button>
              </div>
            );
          })}
          {members.length === 0 && <p className="text-sm text-ink-3">This list is empty — add creators from the Creators page.</p>}
        </div>
      </section>

      {/* ---- Step 2: craft ---- */}
      <section className="card p-4 mb-4">
        <h2 className="font-semibold mb-2">2 · Craft the emails</h2>
        <p className="text-xs text-ink-3 mb-3">
          One click writes a personalized first-contact email for every creator with an email — in FADE&apos;s voice,
          using each creator&apos;s niche and follower counts. Add instructions to steer all of them at once.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="field-label" htmlFor="tone">Tone</label>
            <select id="tone" className="input w-auto" value={tone} onChange={(e) => setTone(e.target.value as ToneKey)}>
              {TONES.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="field-label" htmlFor="instr">Instructions for every email (optional)</label>
            <input
              id="instr"
              className="input"
              placeholder='e.g. "mention the March Madness campaign, $500 flat rate, 1 TikTok"'
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={draftAll}
            disabled={!!bulkBusy || !aiEnabled || withEmail.length === 0}
          >
            {bulkBusy === "draft" ? "Drafting…" : `✨ Draft ${withEmail.length} email${withEmail.length === 1 ? "" : "s"}`}
          </button>
        </div>
        {bulkNote && <p className="text-xs mt-2" style={{ color: "var(--accent)" }}>{bulkNote}</p>}
      </section>

      {/* ---- Step 3: review + send ---- */}
      {Object.keys(drafts).length > 0 && (
        <section className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h2 className="font-semibold">3 · Review &amp; send</h2>
            {readyDrafts.length > 0 && (
              <button className="btn btn-primary btn-sm" onClick={sendAll} disabled={!!bulkBusy}>
                {bulkBusy === "send" ? "Sending…" : `📨 Send all ${readyDrafts.length}`}
              </button>
            )}
          </div>
          <div className="space-y-3">
            {withEmail
              .filter((m) => drafts[m.id])
              .map((m) => {
                const d = drafts[m.id];
                return (
                  <div key={m.id} className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CreatorAvatar creator={m} size={26} />
                      <span className="font-medium">{m.name}</span>
                      <span className="text-xs text-ink-3">→ {m.email}</span>
                      {d.sent && (
                        <span className="chip" style={{ color: "var(--good-text)", borderColor: "var(--good)" }}>
                          {d.sent === "simulated" ? "Sent (simulated)" : "Sent ✓"}
                        </span>
                      )}
                    </div>
                    <input
                      className="input mb-2"
                      value={d.subject}
                      onChange={(e) => editDraft(m.id, { subject: e.target.value })}
                      disabled={!!d.sent}
                      aria-label={`Subject for ${m.name}`}
                    />
                    <textarea
                      className="input"
                      rows={7}
                      value={d.body}
                      onChange={(e) => editDraft(m.id, { body: e.target.value })}
                      disabled={!!d.sent}
                      aria-label={`Email body for ${m.name}`}
                    />
                    {!d.sent && (
                      <div className="flex items-center gap-2 mt-2">
                        <button className="btn btn-primary btn-sm" onClick={() => sendOne(m.id)} disabled={busy[m.id] || !!bulkBusy}>
                          {busy[m.id] ? "Working…" : "Send"}
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => draftOne(m.id)} disabled={busy[m.id] || !!bulkBusy}>
                          ↻ Redraft
                        </button>
                        {note[m.id] && <span className="text-xs" style={{ color: "var(--accent)" }}>{note[m.id]}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      )}
    </div>
  );
}
