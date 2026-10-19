"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { fmtCompact } from "@/lib/creator-meta";
import { scoutTalent, scrapeTikTokHashtags, addScoutedCreator, ScoutCandidate } from "@/lib/actions/scout";

const EXAMPLES = [
  "College football meme pages, 20K–200K followers, SEC-heavy audience",
  "Funny sports-betting creators on TikTok, 50K–500K, who post picks or bad beats",
  "Man-on-the-street interview creators near college campuses",
  "Barstool-style personalities who talk trash about parlays",
];

export function ScoutView({ aiEnabled, apifyEnabled }: { aiEnabled: boolean; apifyEnabled: boolean }) {
  const [mode, setMode] = useState<"ai" | "hashtags">("ai");
  const [call, setCall] = useState("");
  const [candidates, setCandidates] = useState<ScoutCandidate[] | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [scouting, setScouting] = useState(false);
  const [added, setAdded] = useState<Record<number, string>>({}); // index -> creator id
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  function scout() {
    if (!call.trim() || scouting) return;
    setError("");
    setNote("");
    setCandidates(null);
    setAdded({});
    setScouting(true);
    startTransition(async () => {
      const res = mode === "hashtags" ? await scrapeTikTokHashtags(call) : await scoutTalent(call);
      setScouting(false);
      if (!res.ok) return setError(res.error);
      setCandidates(res.candidates);
      if (res.note) setNote(res.note);
    });
  }

  function add(i: number, c: ScoutCandidate) {
    setBusyIdx(i);
    startTransition(async () => {
      const res = await addScoutedCreator(c);
      setBusyIdx(null);
      if (res.ok) setAdded((a) => ({ ...a, [i]: res.id }));
      else setError(res.error);
    });
  }

  const channels = (c: ScoutCandidate) =>
    [
      c.instagram && { label: "IG", ...c.instagram },
      c.tiktok && { label: "TT", ...c.tiktok },
      c.x && { label: "X", ...c.x },
      c.youtube && { label: "YT", ...c.youtube },
    ].filter((v): v is { label: string; handle: string; followers: number | null } => !!v);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-1">Talent scout</h1>
      <p className="text-sm text-ink-2 mb-4">
        Describe who you&apos;re casting for — the scout searches the web, finds real accounts, and you add
        the good ones straight into the pipeline at &quot;To contact.&quot;
      </p>

      {!aiEnabled && (
        <p className="text-xs mb-3" style={{ color: "var(--critical)" }}>
          The scout needs ANTHROPIC_API_KEY set in Vercel.
        </p>
      )}

      <section className="card p-4 mb-4">
        <div className="flex rounded-lg overflow-hidden w-fit mb-3" style={{ border: "1px solid var(--edge)" }}>
          {([
            { key: "ai", label: "✨ AI casting call" },
            { key: "hashtags", label: "# TikTok hashtag scrape" },
          ] as const).map((m) => (
            <button key={m.key} onClick={() => { setMode(m.key); setCall(""); setCandidates(null); setError(""); }}
              className="px-3 py-1.5 text-[13px] cursor-pointer"
              style={mode === m.key
                ? { background: "var(--accent)", color: "var(--accent-ink)", fontWeight: 600 }
                : { background: "transparent", color: "var(--text-secondary)" }}>
              {m.label}
            </button>
          ))}
        </div>
        <label className="field-label" htmlFor="call">{mode === "hashtags" ? "Niche hashtags" : "Casting call"}</label>
        <textarea
          id="call"
          className="input"
          rows={mode === "hashtags" ? 2 : 3}
          placeholder={mode === "hashtags" ? "#sportsbetting #badbeats #parlay" : `e.g. "${EXAMPLES[0]}"`}
          value={call}
          onChange={(e) => setCall(e.target.value)}
        />
        {mode === "hashtags" && (
          <p className="text-[11px] text-ink-3 mt-1">
            Scrapes the top TikTok posts for up to 5 hashtags via Apify and returns the accounts behind
            them — follower counts and bio emails included.{!apifyEnabled && " Needs APIFY_TOKEN set in Vercel."}
          </p>
        )}
        {mode === "ai" && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} className="chip cursor-pointer" onClick={() => setCall(ex)}>
              {ex.length > 52 ? ex.slice(0, 52) + "…" : ex}
            </button>
          ))}
        </div>
        )}
        <div className="flex items-center gap-3 mt-3">
          <button className="btn btn-primary" onClick={scout}
            disabled={scouting || !call.trim() || (mode === "ai" ? !aiEnabled : !apifyEnabled)}>
            {scouting ? "Scouting…" : mode === "hashtags" ? "# Scrape hashtags" : "🔍 Scout talent"}
          </button>
          {scouting && (
            <span className="text-xs" style={{ color: "var(--accent)" }}>
              {mode === "hashtags"
                ? "Scraping TikTok via Apify — up to 2 minutes for busy hashtags…"
                : "Searching the web for candidates — this takes 20–60 seconds…"}
            </span>
          )}
          {error && <span className="text-xs" style={{ color: "var(--critical)" }}>{error}</span>}
        </div>
      </section>

      {note && <p className="text-xs text-ink-3 mb-3">{note}</p>}

      {candidates && (
        <div className="space-y-3">
          {candidates.map((c, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{c.name}</span>
                    {c.niche && <span className="chip">{c.niche}</span>}
                    {c.alreadyInCrm && (
                      <span className="chip" style={{ color: "var(--good-text)" }}>already in pipeline</span>
                    )}
                  </div>
                  <p className="text-xs text-ink-2 mt-1">{c.why}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-ink-3">
                    {channels(c).map((ch) => (
                      <span key={ch.label} className="tabular-nums">
                        <b>{ch.label}</b> {ch.handle}
                        {ch.followers != null ? ` · ${fmtCompact(ch.followers)}` : ""}
                      </span>
                    ))}
                    {c.email && <span>✉ {c.email}</span>}
                  </div>
                </div>
                <div className="flex-none">
                  {added[i] ? (
                    <Link href={`/creators/${added[i]}`} className="btn btn-sm">Added ✓ Open</Link>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => add(i, c)}
                      disabled={busyIdx === i || c.alreadyInCrm}
                      title={c.alreadyInCrm ? "One of these handles is already in the pipeline" : undefined}
                    >
                      {busyIdx === i ? "Adding…" : "+ Add to pipeline"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-ink-3 pb-6">
            Counts are what public pages report — hit ↻ on a creator&apos;s profile after adding to verify.
            Found someone great? Their outreach starts on their creator page.
          </p>
        </div>
      )}
    </div>
  );
}
