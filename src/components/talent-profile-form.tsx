"use client";

import { useState, useTransition } from "react";
import {
  BackgroundCheck,
  BACKGROUND_CHECKS,
  TalentProfileFields,
  backgroundCheckMeta,
  fmtDate,
  photoList,
} from "@/lib/creator-meta";
import { saveTalentProfile } from "@/lib/actions/talent";

/**
 * Editor for the roster profile a creator shows on every partnership deck:
 * photos, positioning, past partnerships, brand fit, audience, and the
 * background check. Creator-level — decks reuse it, and each deck adds its
 * own "why them, for this partner" pitch on top.
 */
export function TalentProfileForm({
  creatorId,
  profile,
}: {
  creatorId: string;
  profile: TalentProfileFields;
}) {
  const [f, setF] = useState({
    tagline: profile.tagline ?? "",
    bio: profile.bio ?? "",
    location: profile.location ?? "",
    photoUrls: profile.photoUrls ?? "",
    pastPartnerships: profile.pastPartnerships ?? "",
    brandAlignment: profile.brandAlignment ?? "",
    audienceAgeRange: profile.audienceAgeRange ?? "",
    audienceGenderSplit: profile.audienceGenderSplit ?? "",
    audienceTopLocations: profile.audienceTopLocations ?? "",
    audienceInterests: profile.audienceInterests ?? "",
    engagementRatePct: profile.engagementRatePct?.toString() ?? "",
    avgViews: profile.avgViews?.toString() ?? "",
    backgroundCheck: profile.backgroundCheck as BackgroundCheck,
    backgroundCheckNotes: profile.backgroundCheckNotes ?? "",
  });
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => {
    setF((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const num = (v: string) => {
    const n = Number(v.replace(/[^0-9.]/g, ""));
    return v.trim() && Number.isFinite(n) ? n : null;
  };

  function save() {
    startTransition(async () => {
      await saveTalentProfile(creatorId, {
        ...f,
        engagementRatePct: num(f.engagementRatePct),
        avgViews: num(f.avgViews) == null ? null : Math.round(num(f.avgViews)!),
      });
      setSaved(true);
    });
  }

  const photos = photoList(f.photoUrls);
  const check = backgroundCheckMeta(f.backgroundCheck);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Tagline" hint="One line under their name on the deck">
          <input
            className="input"
            value={f.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            placeholder="Sports comedy — NFL Sundays, live reactions"
          />
        </Field>
        <Field label="Based in">
          <input
            className="input"
            value={f.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Atlanta, GA"
          />
        </Field>
      </div>

      <Field label="Bio" hint="Two or three sentences a partner reads first">
        <textarea
          className="input"
          rows={3}
          value={f.bio}
          onChange={(e) => set("bio", e.target.value)}
          placeholder="Who they are, what they post, why people watch."
        />
      </Field>

      <Field label="Photos" hint="One image URL per line — Google Drive links work">
        <textarea
          className="input font-mono text-xs"
          rows={3}
          value={f.photoUrls}
          onChange={(e) => set("photoUrls", e.target.value)}
          placeholder={"https://…/headshot.jpg\nhttps://drive.google.com/file/d/…/view"}
        />
      </Field>
      {photos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {photos.map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              className="w-16 h-16 rounded-lg object-cover"
              style={{ background: "var(--grid)", border: "1px solid var(--edge)" }}
            />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Avg views per post">
          <input
            className="input"
            inputMode="numeric"
            value={f.avgViews}
            onChange={(e) => set("avgViews", e.target.value)}
            placeholder="450000"
          />
        </Field>
        <Field label="Engagement rate %">
          <input
            className="input"
            inputMode="decimal"
            value={f.engagementRatePct}
            onChange={(e) => set("engagementRatePct", e.target.value)}
            placeholder="4.8"
          />
        </Field>
      </div>

      <Field label="Relevant partnerships" hint="One per line — brand, then what they did">
        <textarea
          className="input"
          rows={4}
          value={f.pastPartnerships}
          onChange={(e) => set("pastPartnerships", e.target.value)}
          placeholder={"DraftKings — 3-part Super Bowl series, 2.1M views\nNike — launch day Reels"}
        />
      </Field>

      <Field label="Brand alignment" hint="Why they fit a betting/sports brand — shown on every deck">
        <textarea
          className="input"
          rows={3}
          value={f.brandAlignment}
          onChange={(e) => set("brandAlignment", e.target.value)}
          placeholder="21+ sports audience, already posts betting-adjacent content, no competitor exclusivity."
        />
      </Field>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Audience age">
          <input
            className="input"
            value={f.audienceAgeRange}
            onChange={(e) => set("audienceAgeRange", e.target.value)}
            placeholder="72% aged 21–34"
          />
        </Field>
        <Field label="Audience gender split">
          <input
            className="input"
            value={f.audienceGenderSplit}
            onChange={(e) => set("audienceGenderSplit", e.target.value)}
            placeholder="68% male / 32% female"
          />
        </Field>
        <Field label="Top locations">
          <input
            className="input"
            value={f.audienceTopLocations}
            onChange={(e) => set("audienceTopLocations", e.target.value)}
            placeholder="US 81% · UK 6% · CA 4%"
          />
        </Field>
        <Field label="Audience interests">
          <input
            className="input"
            value={f.audienceInterests}
            onChange={(e) => set("audienceInterests", e.target.value)}
            placeholder="NFL, NBA, sneakers, comedy"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3">
        <Field label="Background check">
          <select
            className="input"
            value={f.backgroundCheck}
            onChange={(e) => set("backgroundCheck", e.target.value as BackgroundCheck)}
          >
            {BACKGROUND_CHECKS.map((b) => (
              <option key={b.key} value={b.key}>
                {b.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Vetting notes" hint="Internal — never shown on a shared deck">
          <input
            className="input"
            value={f.backgroundCheckNotes}
            onChange={(e) => set("backgroundCheckNotes", e.target.value)}
            placeholder="Socials reviewed back 24 months, no competitor deals, no flagged content."
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save talent profile"}
        </button>
        {saved && !pending && <span className="text-xs" style={{ color: "var(--good-text)" }}>Saved</span>}
        <span className="chip flex items-center gap-1.5">
          <span className="dot" style={{ background: check.colorVar }} />
          {check.label}
          {profile.backgroundCheckedAt ? ` · ${fmtDate(profile.backgroundCheckedAt)}` : ""}
        </span>
        {check.publicLabel == null && f.backgroundCheck !== "NOT_STARTED" && (
          <span className="text-xs text-ink-3">Flagged talent shows no vetting badge to partners.</span>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="field-label">
        {label}
        {hint && <span className="font-normal text-ink-3"> — {hint}</span>}
      </label>
      {children}
    </div>
  );
}
