"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Platform, fmtNum } from "@/lib/creator-meta";
import { createCreator } from "@/lib/actions/creators";
import { lookupCreator, LookupResult } from "@/lib/actions/lookup";

type Found = Extract<LookupResult, { ok: true }>;

export function NewCreatorForm({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [x, setX] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [agencyContact, setAgencyContact] = useState("");
  const [primary, setPrimary] = useState<Platform | "">("");
  const [igFollowers, setIgFollowers] = useState("");
  const [xFollowers, setXFollowers] = useState("");
  const [ttFollowers, setTtFollowers] = useState("");
  const [niche, setNiche] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const [searching, setSearching] = useState(false);
  const [lookupNote, setLookupNote] = useState("");

  const channelOptions: { key: Platform; label: string; has: boolean }[] = [
    { key: "INSTAGRAM", label: "Instagram", has: !!instagram.trim() },
    { key: "X", label: "X", has: !!x.trim() },
    { key: "TIKTOK", label: "TikTok", has: !!tiktok.trim() },
    { key: "EMAIL", label: "Email", has: !!email.trim() },
  ];
  const available = channelOptions.filter((c) => c.has);
  const effectivePrimary: Platform | "" =
    primary && available.some((c) => c.key === primary) ? primary : (available[0]?.key ?? "");

  function applyLookup(res: Found) {
    setName(res.name);
    if (res.instagram) setInstagram(res.instagram.handle);
    if (res.x) setX(res.x.handle);
    if (res.tiktok) setTiktok(res.tiktok.handle);
    if (res.email) setEmail(res.email);
    if (res.niche) setNiche(res.niche);
    if (res.instagram?.followers != null) setIgFollowers(String(res.instagram.followers));
    if (res.x?.followers != null) setXFollowers(String(res.x.followers));
    if (res.tiktok?.followers != null) setTtFollowers(String(res.tiktok.followers));
    // Primary = biggest audience.
    const hits = [
      { key: "INSTAGRAM" as Platform, f: res.instagram ? (res.instagram.followers ?? 0) : -1 },
      { key: "X" as Platform, f: res.x ? (res.x.followers ?? 0) : -1 },
      { key: "TIKTOK" as Platform, f: res.tiktok ? (res.tiktok.followers ?? 0) : -1 },
    ].filter((h) => h.f >= 0);
    hits.sort((a, b) => b.f - a.f);
    if (hits[0]) setPrimary(hits[0].key);
    const counts = [
      res.instagram?.followers != null ? `IG ~${fmtNum(res.instagram.followers)}` : null,
      res.x?.followers != null ? `X ~${fmtNum(res.x.followers)}` : null,
      res.tiktok?.followers != null ? `TikTok ~${fmtNum(res.tiktok.followers)}` : null,
    ].filter(Boolean);
    setLookupNote(
      [counts.length ? `Found: ${counts.join(" · ")} (approximate)` : "Profiles found.", res.note]
        .filter(Boolean)
        .join(" — ")
    );
  }

  function doLookup() {
    if (!name.trim() || searching) return;
    setError("");
    setLookupNote("");
    setSearching(true);
    startTransition(async () => {
      const res = await lookupCreator(name);
      setSearching(false);
      if (!res.ok) return setError(res.error);
      if (!res.found) {
        setError(`Couldn't confidently find public profiles for "${name}" — you can still add them manually.`);
        return;
      }
      applyLookup(res);
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!effectivePrimary) {
      setError("Add at least one contact channel (IG, X, TikTok, or email).");
      return;
    }
    startTransition(async () => {
      // createCreator redirects to the new creator's page on success
      const res = await createCreator({
        name,
        instagramHandle: instagram || null,
        xHandle: x || null,
        tiktokHandle: tiktok || null,
        email: email || null,
        phone: phone || null,
        primaryPlatform: effectivePrimary,
        agencyName: agencyName || null,
        agencyContact: agencyContact || null,
        instagramFollowers: igFollowers === "" ? null : Number(igFollowers),
        xFollowers: xFollowers === "" ? null : Number(xFollowers),
        tiktokFollowers: ttFollowers === "" ? null : Number(ttFollowers),
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
            placeholder={aiEnabled ? `e.g. "Lil Baby" — then hit Find profiles` : "Creator name"}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && aiEnabled && available.length === 0) {
                e.preventDefault();
                doLookup();
              }
            }}
          />
          {aiEnabled && (
            <button type="button" className="btn" onClick={doLookup} disabled={searching || !name.trim()}>
              {searching ? "Searching…" : "🔍 Find profiles"}
            </button>
          )}
        </div>
        {aiEnabled && !searching && !lookupNote && (
          <p className="text-[11px] text-ink-3 mt-1">
            Searches the web for their official Instagram, X, and TikTok handles, follower counts, niche, and public contact email.
          </p>
        )}
        {searching && (
          <p className="text-xs mt-2" style={{ color: "var(--accent)" }}>
            Searching the web for {name}&apos;s official profiles — this takes a few seconds…
          </p>
        )}
        {lookupNote && (
          <p className="text-xs mt-2" style={{ color: "var(--good-text)" }}>
            {lookupNote}
          </p>
        )}
      </div>

      {/* Contact channels */}
      <div>
        <div className="field-label">Contact channels — add any or all</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="field-label" htmlFor="instagram">Instagram · followers</label>
            <div className="flex gap-2">
              <input id="instagram" className="input flex-1" placeholder="@handle" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
              <input className="input w-28" type="number" min={0} placeholder="followers" value={igFollowers} onChange={(e) => setIgFollowers(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="x">X · followers</label>
            <div className="flex gap-2">
              <input id="x" className="input flex-1" placeholder="@handle" value={x} onChange={(e) => setX(e.target.value)} />
              <input className="input w-28" type="number" min={0} placeholder="followers" value={xFollowers} onChange={(e) => setXFollowers(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="tiktok">TikTok · followers</label>
            <div className="flex gap-2">
              <input id="tiktok" className="input flex-1" placeholder="@handle" value={tiktok} onChange={(e) => setTiktok(e.target.value)} />
              <input className="input w-28" type="number" min={0} placeholder="followers" value={ttFollowers} onChange={(e) => setTtFollowers(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="field-label" htmlFor="email">Email</label>
            <input id="email" className="input" type="email" placeholder="creator@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="phone">Phone</label>
            <input id="phone" className="input" type="tel" placeholder="+1 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="primary">Primary outreach channel</label>
            <select
              id="primary"
              className="input"
              value={effectivePrimary}
              onChange={(e) => setPrimary(e.target.value as Platform)}
            >
              {available.length === 0 && <option value="">Add a channel first…</option>}
              {available.map((c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Agency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="agencyName">Agency (optional)</label>
          <input id="agencyName" className="input" placeholder="e.g. QC / WME" value={agencyName} onChange={(e) => setAgencyName(e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="agencyContact">Agency contact</label>
          <input id="agencyContact" className="input" placeholder="agent name, email, or phone" value={agencyContact} onChange={(e) => setAgencyContact(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="niche">Niche</label>
          <input id="niche" className="input" placeholder="e.g. sports betting, comedy" value={niche} onChange={(e) => setNiche(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="notes">Notes</label>
        <textarea id="notes" className="input" rows={3} placeholder="Anything worth remembering" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
