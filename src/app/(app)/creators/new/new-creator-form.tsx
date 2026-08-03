"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Platform, PLATFORMS, fmtNum } from "@/lib/creator-meta";
import { createCreator } from "@/lib/actions/creators";
import { lookupCreator, LookupResult } from "@/lib/actions/lookup";

type Found = Extract<LookupResult, { ok: true }>;

export function NewCreatorForm({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("INSTAGRAM");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [followers, setFollowers] = useState("");
  const [niche, setNiche] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<Found | null>(null);
  const [picked, setPicked] = useState<"instagram" | "x" | null>(null);

  const isEmail = PLATFORMS[platform].isEmail;

  function doLookup() {
    if (!name.trim() || searching) return;
    setError("");
    setResult(null);
    setSearching(true);
    startTransition(async () => {
      const res = await lookupCreator(name);
      setSearching(false);
      if (!res.ok) return setError(res.error);
      if (!res.found) {
        setError(`Couldn't confidently find public profiles for "${name}" — you can still add them manually.`);
        return;
      }
      setResult(res);
      setName(res.name);
      if (res.niche) setNiche(res.niche);
      if (res.email) setEmail(res.email);
      // Default to the bigger profile (Instagram wins ties).
      const primary =
        res.instagram && res.x
          ? (res.x.followers ?? 0) > (res.instagram.followers ?? 0)
            ? "x"
            : "instagram"
          : res.instagram
            ? "instagram"
            : "x";
      applyProfile(res, primary);
    });
  }

  function applyProfile(res: Found, which: "instagram" | "x") {
    const profile = which === "instagram" ? res.instagram : res.x;
    const other = which === "instagram" ? res.x : res.instagram;
    if (!profile) return;
    setPicked(which);
    setPlatform(which === "instagram" ? "INSTAGRAM" : "X");
    setHandle(profile.handle);
    setFollowers(profile.followers != null ? String(profile.followers) : "");
    const extras = [
      other
        ? `Also on ${which === "instagram" ? "X" : "Instagram"}: ${other.handle}${
            other.followers != null ? ` (~${fmtNum(other.followers)} followers)` : ""
          }`
        : null,
      res.note,
    ].filter(Boolean);
    setNotes(extras.join("\n"));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      // createCreator redirects to the new creator's page on success
      const res = await createCreator({
        name,
        platform,
        handle,
        email: isEmail ? null : email || null,
        followers: followers === "" ? null : Number(followers),
        niche: niche || null,
        notes: notes || null,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Name + auto-lookup */}
      <div>
        <label className="field-label" htmlFor="name">Creator name</label>
        <div className="flex gap-2">
          <input
            id="name"
            className="input flex-1"
            placeholder={aiEnabled ? `e.g. "Lil Baby" — then hit Find profiles` : "Creator name (defaults to handle)"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && aiEnabled && !handle) {
                e.preventDefault();
                doLookup();
              }
            }}
          />
          {aiEnabled && (
            <button
              type="button"
              className="btn"
              onClick={doLookup}
              disabled={searching || !name.trim()}
            >
              {searching ? "Searching…" : "🔍 Find profiles"}
            </button>
          )}
        </div>
        {aiEnabled && (
          <p className="text-[11px] text-ink-3 mt-1">
            Searches the web for their official Instagram/X handles, follower counts, niche, and public contact email.
          </p>
        )}
        {searching && (
          <p className="text-xs mt-2" style={{ color: "var(--accent)" }}>
            Searching the web for {name}&apos;s official profiles — this takes a few seconds…
          </p>
        )}
      </div>

      {/* Lookup results */}
      {result && (
        <div className="rounded-lg p-3 space-y-2" style={{ background: "var(--page)", border: "1px solid var(--grid)" }}>
          <div className="text-xs font-semibold text-ink-2">
            Found profiles — pick the primary one
          </div>
          <div className="flex flex-wrap gap-2">
            {result.instagram && (
              <button
                type="button"
                className="btn btn-sm"
                style={picked === "instagram" ? { borderColor: "var(--accent)", outline: "1px solid var(--accent)" } : undefined}
                onClick={() => applyProfile(result, "instagram")}
              >
                Instagram {result.instagram.handle}
                {result.instagram.followers != null && ` · ${fmtNum(result.instagram.followers)}`}
              </button>
            )}
            {result.x && (
              <button
                type="button"
                className="btn btn-sm"
                style={picked === "x" ? { borderColor: "var(--accent)", outline: "1px solid var(--accent)" } : undefined}
                onClick={() => applyProfile(result, "x")}
              >
                X {result.x.handle}
                {result.x.followers != null && ` · ${fmtNum(result.x.followers)}`}
              </button>
            )}
          </div>
          <p className="text-[11px] text-ink-3">
            Follower counts are approximate. Double-check the handle before your first outreach.
            {result.note ? ` Note: ${result.note}` : ""}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="platform">Platform</label>
          <select
            id="platform"
            className="input"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
          >
            {Object.entries(PLATFORMS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="handle">
            {isEmail ? "Email address" : "Handle"}
          </label>
          <input
            id="handle"
            className="input"
            required
            type={isEmail ? "email" : "text"}
            placeholder={PLATFORMS[platform].handlePlaceholder}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
        </div>
        {!isEmail && (
          <div>
            <label className="field-label" htmlFor="email">Email (optional)</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="For sending outreach by email too"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="followers">Followers</label>
          <input
            id="followers"
            className="input"
            type="number"
            min={0}
            placeholder="e.g. 45000"
            value={followers}
            onChange={(e) => setFollowers(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="niche">Niche</label>
          <input
            id="niche"
            className="input"
            placeholder="e.g. sports betting, comedy"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          className="input"
          rows={3}
          placeholder="Anything worth remembering"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <p className="text-xs" style={{ color: "var(--critical)" }}>{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending || searching}>
          {pending && !searching ? "Adding…" : "Add creator"}
        </button>
      </div>
    </form>
  );
}
