"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Platform,
  PLATFORMS,
  fillTemplate,
  channels,
  dmUrl,
} from "@/lib/creator-meta";
import { SCENARIOS, TONES, ToneKey, scenarioByKey } from "@/lib/scenarios";
import { markDmSent, sendOutreachEmail } from "@/lib/actions/outreach";
import { craftOutreach } from "@/lib/actions/ai";
import { createTemplate } from "@/lib/actions/templates";
import type { CreatorDetailData, TemplateItem } from "@/app/(app)/creators/[id]/creator-detail";

export function Composer({
  creator,
  templates,
  hasSentBefore,
  aiEnabled,
}: {
  creator: CreatorDetailData;
  templates: TemplateItem[];
  hasSentBefore: boolean;
  aiEnabled: boolean;
}) {
  // YouTube has no DM surface — it stays a contact/stats channel only.
  const channelOptions = channels(creator).filter((c) => c.platform !== "YOUTUBE");
  const defaultChannel =
    channelOptions.find((c) => c.platform === creator.primaryPlatform)?.platform ??
    channelOptions[0]?.platform ??
    "INSTAGRAM";

  const [channel, setChannel] = useState<Platform>(defaultChannel);
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isFollowUp, setIsFollowUp] = useState(hasSentBefore);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  // Craft panel state
  const [scenarioKey, setScenarioKey] = useState("");
  const [variantIndex, setVariantIndex] = useState(0);
  const [tone, setTone] = useState<ToneKey>("casual");
  const [instructions, setInstructions] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const isEmailChannel = channel === "EMAIL";
  const channelHandle = channelOptions.find((c) => c.platform === channel)?.handle ?? "";

  const visibleTemplates = useMemo(
    () => templates.filter((t) => !t.platform || t.platform === channel),
    [templates, channel]
  );

  function flash(kind: "ok" | "err", text: string) {
    setFeedback({ kind, text });
    setTimeout(() => setFeedback(null), 4000);
  }

  /* ---- scenario library (works with no AI key) ---- */

  const scenario = scenarioByKey(scenarioKey);
  const variantCount = scenario ? (isEmailChannel ? scenario.email.length : scenario.dm.length) : 0;

  function applyScenarioVariant(key: string, index: number) {
    const s = scenarioByKey(key);
    if (!s) return;
    if (isEmailChannel) {
      const v = s.email[index % s.email.length];
      setSubject(fillTemplate(v.subject, creator));
      setBody(fillTemplate(v.body, creator));
    } else {
      setBody(fillTemplate(s.dm[index % s.dm.length], creator));
    }
    setTemplateId("");
  }

  function pickScenario(key: string) {
    setScenarioKey(key);
    setVariantIndex(0);
    if (key) applyScenarioVariant(key, 0);
  }

  function shuffleVariant() {
    if (!scenario || variantCount < 2) return;
    const next = (variantIndex + 1) % variantCount;
    setVariantIndex(next);
    applyScenarioVariant(scenarioKey, next);
  }

  /* ---- AI craft / reimagine ---- */

  function runAi(mode: "generate" | "reimagine") {
    if (!scenarioKey && mode === "generate") return flash("err", "Pick a scenario first");
    setAiBusy(true);
    startTransition(async () => {
      const res = await craftOutreach(creator.id, {
        channel,
        scenario: scenarioKey || "first_contact",
        tone,
        instructions,
        currentDraft: mode === "reimagine" ? { subject, body } : undefined,
      });
      setAiBusy(false);
      if (!res.ok) return flash("err", res.error);
      setBody(res.body);
      if (isEmailChannel && res.subject) setSubject(res.subject);
      flash("ok", mode === "reimagine" ? "Draft reimagined" : "Draft generated");
    });
  }

  /* ---- templates ---- */

  function applyTemplate(id: string) {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setBody(fillTemplate(tpl.body, creator));
    if (tpl.subject) setSubject(fillTemplate(tpl.subject, creator));
    setScenarioKey("");
  }

  function saveAsTemplate() {
    if (!body.trim()) return flash("err", "Draft is empty");
    const suggested = scenario ? `${scenario.label} (custom)` : "Custom outreach";
    const name = window.prompt("Template name:", suggested);
    if (!name) return;
    // Store the generic form so the template works for other creators.
    let generic = body.split(creator.name).join("{name}");
    if (channelHandle) generic = generic.split(channelHandle).join("{handle}");
    startTransition(async () => {
      const res = await createTemplate({
        name,
        platform: channel,
        subject: isEmailChannel ? subject || null : null,
        body: generic,
      });
      flash(res.ok ? "ok" : "err", res.ok ? `Saved as template "${name}"` : res.error);
    });
  }

  /* ---- send / mark sent ---- */

  async function copyDraft() {
    if (!body.trim()) return flash("err", "Draft is empty");
    try {
      await navigator.clipboard.writeText(body);
      flash("ok", "Draft copied to clipboard");
    } catch {
      flash("err", "Couldn't access the clipboard");
    }
  }

  function doMarkSent() {
    startTransition(async () => {
      const res = await markDmSent(creator.id, { channel, body, isFollowUp });
      if (!res.ok) return flash("err", res.error);
      flash("ok", "Logged as sent — stage updated");
      setIsFollowUp(true);
    });
  }

  function doSendEmail() {
    startTransition(async () => {
      const res = await sendOutreachEmail(creator.id, { subject, body, isFollowUp });
      if (!res.ok) return flash("err", res.error ?? "Send failed");
      flash("ok", res.simulated ? "Email simulated (no RESEND_API_KEY set) and logged" : `Email sent to ${creator.email}`);
      setIsFollowUp(true);
    });
  }

  const busy = pending || aiBusy;

  if (channelOptions.length === 0) {
    return (
      <p className="text-sm text-ink-2">
        Add a contact channel (Instagram, X, TikTok, or email) in the profile to start outreach.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {channelOptions.length > 1 && (
        <div className="flex rounded-lg overflow-hidden w-fit" style={{ border: "1px solid var(--edge)" }}>
          {channelOptions.map((ch) => (
            <button
              key={ch.platform}
              onClick={() => setChannel(ch.platform)}
              className="px-3 py-1 text-xs cursor-pointer"
              style={
                channel === ch.platform
                  ? { background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 600 }
                  : { background: "var(--surface-1)", color: "var(--text-secondary)" }
              }
            >
              {ch.platform === "EMAIL" ? "Email" : `${PLATFORMS[ch.platform].label} DM`}
            </button>
          ))}
        </div>
      )}

      {/* Craft panel: scenario + tone + AI */}
      <div className="rounded-lg p-3 space-y-2" style={{ background: "var(--page)", border: "1px solid var(--grid)" }}>
        <div className="text-xs font-semibold text-ink-2">Craft a message</div>
        <div className="flex flex-wrap gap-1.5">
          {SCENARIOS.map((s) => (
            <button
              key={s.key}
              onClick={() => pickScenario(s.key === scenarioKey ? "" : s.key)}
              title={s.description}
              className="chip cursor-pointer"
              style={
                s.key === scenarioKey
                  ? { background: "var(--accent)", color: "var(--accent-ink)", borderColor: "var(--accent)" }
                  : undefined
              }
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {variantCount > 1 && (
            <button className="btn btn-sm" onClick={shuffleVariant} title="Cycle through variations of this scenario">
              ↺ Shuffle ({(variantIndex % variantCount) + 1}/{variantCount})
            </button>
          )}
          {aiEnabled && (
            <>
              <select className="input w-auto py-1 text-xs" value={tone} onChange={(e) => setTone(e.target.value as ToneKey)}>
                {TONES.map((t) => (
                  <option key={t.key} value={t.key}>{t.label} tone</option>
                ))}
              </select>
              <button className="btn btn-sm" disabled={busy || !scenarioKey} onClick={() => runAi("generate")}>
                {aiBusy ? "Thinking…" : "✨ AI draft"}
              </button>
              <button className="btn btn-sm" disabled={busy || !body.trim()} onClick={() => runAi("reimagine")}>
                {aiBusy ? "Thinking…" : "✨ Reimagine draft"}
              </button>
            </>
          )}
        </div>
        {aiEnabled && (
          <input
            className="input text-xs"
            placeholder="Optional AI instructions — e.g. mention their podcast, keep it under 2 sentences…"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        )}
        {!aiEnabled && (
          <p className="text-[11px] text-ink-3">
            Tip: add ANTHROPIC_API_KEY to unlock AI generation and tone-based reimagining. Scenarios and shuffle work without it.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="input flex-1 min-w-[180px]"
          value={templateId}
          onChange={(e) => applyTemplate(e.target.value)}
        >
          <option value="">Or pick a saved template…</option>
          {visibleTemplates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <span className="text-xs text-ink-3">{"{name} {handle} {platform}"}</span>
        <Link href="/templates" className="text-xs text-ink-3 underline hover:text-ink">
          Manage
        </Link>
      </div>

      {isEmailChannel && (
        <div>
          <label className="field-label">Subject</label>
          <input
            className="input"
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
      )}

      <div>
        <label className="field-label">
          {isEmailChannel ? `Email to ${creator.email ?? "—"}` : `${PLATFORMS[channel].label} DM to ${channelHandle}`}
        </label>
        <textarea
          className="input"
          rows={7}
          placeholder="Write or generate your outreach message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-ink-2 cursor-pointer">
          <input type="checkbox" checked={isFollowUp} onChange={(e) => setIsFollowUp(e.target.checked)} />
          This is a follow-up
        </label>
        <button className="btn btn-sm btn-ghost" onClick={saveAsTemplate} disabled={busy || !body.trim()}>
          Save as template
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!isEmailChannel ? (
          <>
            <button className="btn" onClick={copyDraft}>Copy draft</button>
            <a className="btn" href={dmUrl(channel, channelHandle)} target="_blank" rel="noopener noreferrer">
              Open {PLATFORMS[channel].label} ↗
            </a>
            <button className="btn btn-primary" onClick={doMarkSent} disabled={busy || !body.trim()}>
              {pending ? "Saving…" : "Mark as sent"}
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary"
            onClick={doSendEmail}
            disabled={busy || !body.trim() || !subject.trim() || !creator.email}
          >
            {pending ? "Sending…" : `Send email`}
          </button>
        )}
        {feedback && (
          <span
            className="text-xs"
            style={{ color: feedback.kind === "ok" ? "var(--good-text)" : "var(--critical)" }}
          >
            {feedback.text}
          </span>
        )}
      </div>
      {!isEmailChannel && (
        <p className="text-xs text-ink-3">
          {`${PLATFORMS[channel].label} doesn't allow sending DMs from outside apps — copy the draft, send it there, then mark it sent to track it here.`}
        </p>
      )}
    </div>
  );
}
