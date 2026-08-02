"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Platform,
  PLATFORMS,
  fillTemplate,
  dmUrl,
  outreachEmail,
} from "@/lib/creator-meta";
import { markDmSent, sendOutreachEmail } from "@/lib/actions/outreach";
import type { CreatorDetailData, TemplateItem } from "@/app/(app)/creators/[id]/creator-detail";

export function Composer({
  creator,
  templates,
  hasSentBefore,
}: {
  creator: CreatorDetailData;
  templates: TemplateItem[];
  hasSentBefore: boolean;
}) {
  const emailTo = outreachEmail(creator);
  const canDm = !PLATFORMS[creator.platform].isEmail;
  // EMAIL creators only have the email channel; IG/X creators get an email
  // channel too when a backup email is on file.
  const [channel, setChannel] = useState<"dm" | "email">(canDm ? "dm" : "email");
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isFollowUp, setIsFollowUp] = useState(hasSentBefore);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const visibleTemplates = useMemo(() => {
    const wantPlatform: Platform = channel === "email" ? "EMAIL" : creator.platform;
    return templates.filter((t) => !t.platform || t.platform === wantPlatform);
  }, [templates, channel, creator.platform]);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setBody(fillTemplate(tpl.body, creator));
    if (tpl.subject) setSubject(fillTemplate(tpl.subject, creator));
  }

  function flash(kind: "ok" | "err", text: string) {
    setFeedback({ kind, text });
    setTimeout(() => setFeedback(null), 4000);
  }

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
      const res = await markDmSent(creator.id, { body, isFollowUp });
      if (res.ok) {
        flash("ok", "Logged as sent — stage updated");
        setIsFollowUp(true);
      }
    });
  }

  function doSendEmail() {
    startTransition(async () => {
      const res = await sendOutreachEmail(creator.id, { subject, body, isFollowUp });
      if (!res.ok) return flash("err", res.error ?? "Send failed");
      flash("ok", res.simulated ? "Email simulated (no RESEND_API_KEY set) and logged" : `Email sent to ${emailTo}`);
      setIsFollowUp(true);
    });
  }

  return (
    <div className="space-y-3">
      {canDm && emailTo && (
        <div className="flex rounded-lg overflow-hidden w-fit" style={{ border: "1px solid var(--edge)" }}>
          {(["dm", "email"] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setChannel(ch)}
              className="px-3 py-1 text-xs cursor-pointer"
              style={
                channel === ch
                  ? { background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 600 }
                  : { background: "var(--surface-1)", color: "var(--text-secondary)" }
              }
            >
              {ch === "dm" ? `${PLATFORMS[creator.platform].label} DM` : "Email"}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="input flex-1 min-w-[180px]"
          value={templateId}
          onChange={(e) => applyTemplate(e.target.value)}
        >
          <option value="">Pick a template…</option>
          {visibleTemplates.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <span className="text-xs text-ink-3">{"{name} {handle} {platform}"}</span>
      </div>

      {channel === "email" && (
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
        <label className="field-label">{channel === "email" ? `Email to ${emailTo ?? "—"}` : "DM draft"}</label>
        <textarea
          className="input"
          rows={7}
          placeholder="Write or generate your outreach message…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-ink-2 cursor-pointer w-fit">
        <input type="checkbox" checked={isFollowUp} onChange={(e) => setIsFollowUp(e.target.checked)} />
        This is a follow-up
      </label>

      <div className="flex flex-wrap items-center gap-2">
        {channel === "dm" ? (
          <>
            <button className="btn" onClick={copyDraft}>Copy draft</button>
            <a className="btn" href={dmUrl(creator)} target="_blank" rel="noopener noreferrer">
              Open {PLATFORMS[creator.platform].label} DMs ↗
            </a>
            <button className="btn btn-primary" onClick={doMarkSent} disabled={pending || !body.trim()}>
              {pending ? "Saving…" : "Mark as sent"}
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary"
            onClick={doSendEmail}
            disabled={pending || !body.trim() || !subject.trim() || !emailTo}
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
      {channel === "dm" && (
        <p className="text-xs text-ink-3">
          {`${PLATFORMS[creator.platform].label} doesn't allow sending DMs from outside apps — copy the draft, send it there, then mark it sent to track it here.`}
        </p>
      )}
    </div>
  );
}
