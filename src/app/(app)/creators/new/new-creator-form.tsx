"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Platform, fmtNum } from "@/lib/creator-meta";
import { createCreator } from "@/lib/actions/creators";
import { lookupCreator, LookupResult } from "@/lib/actions/lookup";

type Found = Extract<LookupResult, { ok: true }>;
type SocialPlatform = "INSTAGRAM" | "X" | "TIKTOK" | "YOUTUBE";

// Turns a pasted profile link (instagram.com/druski, tiktok.com/@lilbaby, …)
// into a platform + handle. Post/video links (reel, /p/, /watch, /status)
// still resolve to the profile they belong to where the URL allows it.
function parseProfileUrl(input: string): { platform: SocialPlatform; handle: string } | null {
  const text = input.trim();
  if (!/^(https?:\/\/|www\.|(m|www)?\.?(instagram|x|twitter|tiktok|youtube)\.com)/i.test(text)) return null;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m)\./, "").toLowerCase();
  const segs = url.pathname.split("/").filter(Boolean);
  const first = segs[0] ? decodeURIComponent(segs[0]) : "";
  const handle = (h: string) => `@${h.replace(/^@/, "")}`;

  if (host === "instagram.com") {
    if (!first || ["p", "reel", "reels", "stories", "explore", "accounts", "tv", "direct"].includes(first.toLowerCase()))
      return null;
    return { platform: "INSTAGRAM", handle: handle(first) };
  }
  if (host === "x.com" || host === "twitter.com") {
    if (!first || ["i", "home", "search", "explore", "hashtag", "intent", "settings", "messages", "notifications"].includes(first.toLowerCase()))
      return null;
    return { platform: "X", handle: handle(first) };
  }
  if (host === "tiktok.com") {
    if (first.startsWith("@")) return { platform: "TIKTOK", handle: first };
    return null;
  }
  if (host === "youtube.com") {
    if (first.startsWith("@")) return { platform: "YOUTUBE", handle: first };
    if ((first === "c" || first === "user") && segs[1]) return { platform: "YOUTUBE", handle: handle(decodeURIComponent(segs[1])) };
    return null;
  }
  return null;
}

export function NewCreatorForm({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [x, setX] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [youtube, setYoutube] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [agencyContact, setAgencyContact] = useState("");
  const [primary, setPrimary] = useState<Platform | "">("");
  const [igFollowers, setIgFollowers] = useState("");
  const [xFollowers, setXFollowers] = useState("");
  const [ttFollowers, setTtFollowers] = useState("");
  const [ytFollowers, setYtFollowers] = useState("");
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
    { key: "YOUTUBE", label: "YouTube", has: !!youtube.trim() },
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
    if (res.youtube) setYoutube(res.youtube.handle);
    if (res.email) setEmail(res.email);
    if (res.niche) setNiche(res.niche);
    if (res.instagram?.followers != null) setIgFollowers(String(res.instagram.followers));
    if (res.x?.followers != null) setXFollowers(String(res.x.followers));
    if (res.tiktok?.followers != null) setTtFollowers(String(res.tiktok.followers));
    if (res.youtube?.followers != null) setYtFollowers(String(res.youtube.followers));
    // Primary = biggest audience.
    const hits = [
      { key: "INSTAGRAM" as Platform, f: res.instagram ? (res.instagram.followers ?? 0) : -1 },
      { key: "X" as Platform, f: res.x ? (res.x.followers ?? 0) : -1 },
      { key: "TIKTOK" as Platform, f: res.tiktok ? (res.tiktok.followers ?? 0) : -1 },
      { key: "YOUTUBE" as Platform, f: res.youtube ? (res.youtube.followers ?? 0) : -1 },
    ].filter((h) => h.f >= 0);
    hits.sort((a, b) => b.f - a.f);
    if (hits[0]) setPrimary(hits[0].key);
    const counts = [
      res.instagram?.followers != null ? `IG ~${fmtNum(res.instagram.followers)}` : null,
      res.x?.followers != null ? `X ~${fmtNum(res.x.followers)}` : null,
      res.tiktok?.followers != null ? `TikTok ~${fmtNum(res.tiktok.followers)}` : null,
      res.youtube?.followers != null ? `YouTube ~${fmtNum(res.youtube.followers)} subs` : null,
    ].filter(Boolean);
    setLookupNote(
      [counts.length ? `Found: ${counts.join(" · ")} (approximate)` : "Profiles found.", res.note]
        .filter(Boolean)
        .join(" — ")
    );
  }

  function doLookup() {
    if (!name.trim() || searching) return;
    // A pasted profile link anchors the search: prefill that channel, then
    // find the same person on the other platforms.
    const seed = parseProfileUrl(name);
    if (seed) {
      if (seed.platform === "INSTAGRAM") setInstagram(seed.handle);
      if (seed.platform === "X") setX(seed.handle);
      if (seed.platform === "TIKTOK") setTiktok(seed.handle);
      if (seed.platform === "YOUTUBE") setYoutube(seed.handle);
    }
    setError("");
    setLookupNote("");
    setSearching(true);
    startTransition(async () => {
      const res = await lookupCreator(seed ? seed.handle : name, seed ?? undefined);
      setSearching(false);
      if (!res.ok) return setError(res.error);
      if (!res.found) {
        if (seed) {
          setName(seed.handle.replace(/^@/, ""));
          setError("Couldn't confidently match that profile across other platforms — the pasted channel is filled in below; add the rest manually.");
        } else {
          setError(`Couldn't confidently find public profiles for "${name}" — you can still add them manually.`);
        }
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
        youtubeHandle: youtube || null,
        email: email || null,
        phone: phone || null,
        primaryPlatform: effectivePrimary,
        agencyName: agencyName || null,
        agencyContact: agencyContact || null,
        instagramFollowers: igFollowers === "" ? null : Number(igFollowers),
        xFollowers: xFollowers === "" ? null : Number(xFollowers),
        tiktokFollowers: ttFollowers === "" ? null : Number(ttFollowers),
        youtubeFollowers: ytFollowers === "" ? null : Number(ytFollowers),
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
        <label className="field-label" htmlFor="name">Creator name or profile link</label>
        <div className="flex gap-2">
          <input
            id="name"
            className="input flex-1"
            placeholder={aiEnabled ? `e.g. "Lil Baby" or paste instagram.com/… — then hit Find profiles` : "Creator name"}
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
            Type a name, or drop a profile link from Instagram, X, TikTok, or YouTube — we&apos;ll find the same creator&apos;s
            official handles on the other platforms, follower counts, niche, and public contact email.
          </p>
        )}
        {searching && (
          <p className="text-xs mt-2" style={{ color: "var(--accent)" }}>
            {parseProfileUrl(name)
              ? "Reading that profile and searching for the same creator on other platforms — this takes a few seconds…"
              : `Searching the web for ${name}'s official profiles — this takes a few seconds…`}
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
            <label className="field-label" htmlFor="youtube">YouTube · subscribers</label>
            <div className="flex gap-2">
              <input id="youtube" className="input flex-1" placeholder="@channel" value={youtube} onChange={(e) => setYoutube(e.target.value)} />
              <input className="input w-28" type="number" min={0} placeholder="subs" value={ytFollowers} onChange={(e) => setYtFollowers(e.target.value)} />
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
