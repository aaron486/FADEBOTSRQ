"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ContactFields,
  FollowerFields,
  TalentProfileFields,
  backgroundCheckMeta,
  fmtCompact,
  fmtDateTime,
  totalFollowers,
} from "@/lib/creator-meta";
import { CreatorAvatar } from "@/components/creator-avatar";
import { TalentProfileForm } from "@/components/talent-profile-form";
import {
  updateDeck,
  deleteDeck,
  addCreatorToDeck,
  removeCreatorFromDeck,
  moveDeckCreator,
  setDeckPitch,
} from "@/lib/actions/talent";

export type DeckData = {
  id: string;
  name: string;
  token: string;
  headline: string | null;
  clientName: string | null;
  intro: string | null;
  closing: string | null;
  contactName: string | null;
  contactEmail: string | null;
  ctaUrl: string | null;
  published: boolean;
  updatedAt: string;
};

export type RosterCreator = ContactFields &
  FollowerFields &
  TalentProfileFields & { id: string; name: string; niche: string | null };

export type RosterRow = { pitch: string | null; creator: RosterCreator };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-4">
      <h2
        className="text-xs font-semibold uppercase tracking-wider text-ink-2 pb-2 mb-3"
        style={{ borderBottom: "1px solid var(--grid)" }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DeckEditor({
  deck,
  roster,
  candidates,
  shareUrl,
}: {
  deck: DeckData;
  roster: RosterRow[];
  candidates: { id: string; name: string }[];
  shareUrl: string;
}) {
  const reach = roster.reduce((sum, r) => sum + totalFollowers(r.creator), 0);
  const unvetted = roster.filter((r) => r.creator.backgroundCheck !== "CLEARED");

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/talent" className="text-sm text-ink-3 hover:text-ink">
          ← Talent decks
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ShareLink url={shareUrl} published={deck.published} />
          <a className="btn btn-sm" href={`/d/${deck.token}`} target="_blank" rel="noreferrer">
            Preview ↗
          </a>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-xl font-bold">{deck.name}</h1>
        <span className="text-xs text-ink-3">
          {roster.length} talent · {reach > 0 ? fmtCompact(reach) : "—"} reach · updated{" "}
          {fmtDateTime(deck.updatedAt)}
        </span>
      </div>

      {unvetted.length > 0 && (
        <div
          className="card p-3 text-sm"
          style={{ borderColor: "var(--warning)", color: "var(--text-secondary)" }}
        >
          No cleared background check for {unvetted.map((r) => r.creator.name).join(", ")} — partners
          see no vetting badge on {unvetted.length === 1 ? "their card" : "those cards"}.
        </div>
      )}

      <DeckFields deck={deck} />

      <RosterSection deckId={deck.id} roster={roster} candidates={candidates} clientName={deck.clientName} />

      <DangerZone deckId={deck.id} name={deck.name} />
    </div>
  );
}

function ShareLink({ url, published }: { url: string; published: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
      title={published ? url : "Deck is unpublished — the link 404s until you publish it"}
    >
      {copied ? "Link copied" : "Copy share link"}
    </button>
  );
}

function DeckFields({ deck }: { deck: DeckData }) {
  const [f, setF] = useState({
    name: deck.name,
    headline: deck.headline ?? "",
    clientName: deck.clientName ?? "",
    intro: deck.intro ?? "",
    closing: deck.closing ?? "",
    contactName: deck.contactName ?? "",
    contactEmail: deck.contactEmail ?? "",
    ctaUrl: deck.ctaUrl ?? "",
    published: deck.published,
  });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => {
    setF((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  function save() {
    startTransition(async () => {
      const res = await updateDeck(deck.id, f);
      if (res && !res.ok) {
        setError(res.error);
        return;
      }
      setError("");
      setSaved(true);
    });
  }

  return (
    <Section title="Deck cover">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="field-label">Deck name (internal)</label>
          <input className="input" value={f.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div>
          <label className="field-label">Prepared for</label>
          <input
            className="input"
            value={f.clientName}
            onChange={(e) => set("clientName", e.target.value)}
            placeholder="Brand or agency name"
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="field-label">Headline</label>
        <input
          className="input"
          value={f.headline}
          onChange={(e) => set("headline", e.target.value)}
          placeholder="FADE top talent — NFL season"
        />
      </div>

      <div className="mt-3">
        <label className="field-label">Intro</label>
        <textarea
          className="input"
          rows={3}
          value={f.intro}
          onChange={(e) => set("intro", e.target.value)}
          placeholder="A sentence or two on why this roster, for this partner."
        />
      </div>

      <div className="mt-3">
        <label className="field-label">Closing note</label>
        <textarea
          className="input"
          rows={2}
          value={f.closing}
          onChange={(e) => set("closing", e.target.value)}
          placeholder="What happens next — timelines, packaging, exclusivity."
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
        <div>
          <label className="field-label">Contact name</label>
          <input
            className="input"
            value={f.contactName}
            onChange={(e) => set("contactName", e.target.value)}
            placeholder="Aaron"
          />
        </div>
        <div>
          <label className="field-label">Contact email</label>
          <input
            className="input"
            type="email"
            value={f.contactEmail}
            onChange={(e) => set("contactEmail", e.target.value)}
            placeholder="partnerships@fade.bet"
          />
        </div>
        <div>
          <label className="field-label">Booking link</label>
          <input
            className="input"
            value={f.ctaUrl}
            onChange={(e) => set("ctaUrl", e.target.value)}
            placeholder="https://cal.com/…"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <button className="btn btn-primary" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save deck"}
        </button>
        <label className="flex items-center gap-2 text-sm text-ink-2">
          <input
            type="checkbox"
            checked={f.published}
            onChange={(e) => set("published", e.target.checked)}
          />
          Published — the share link works
        </label>
        {saved && !pending && <span className="text-xs" style={{ color: "var(--good-text)" }}>Saved</span>}
        {error && <span className="text-xs" style={{ color: "var(--critical)" }}>{error}</span>}
      </div>
    </Section>
  );
}

function RosterSection({
  deckId,
  roster,
  candidates,
  clientName,
}: {
  deckId: string;
  roster: RosterRow[];
  candidates: { id: string; name: string }[];
  clientName: string | null;
}) {
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [, startTransition] = useTransition();

  function add() {
    if (!selected) return;
    const id = selected;
    setSelected("");
    setBusy(true);
    startTransition(async () => {
      await addCreatorToDeck(deckId, id);
      setBusy(false);
    });
  }

  return (
    <Section title={`Roster — ${roster.length}`}>
      <div className="flex gap-2 mb-3">
        <select
          className="input flex-1"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Add talent to deck"
        >
          <option value="">
            {candidates.length ? "Add talent to this deck…" : "Every creator is already on this deck"}
          </option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="btn" onClick={add} disabled={!selected || busy}>
          Add
        </button>
      </div>

      {roster.length === 0 ? (
        <p className="text-sm text-ink-3 py-4 text-center">
          Nobody on this deck yet — add your top talent above.
        </p>
      ) : (
        <div className="space-y-2">
          {roster.map((row, i) => (
            <RosterRowCard
              key={row.creator.id}
              deckId={deckId}
              row={row}
              clientName={clientName}
              isFirst={i === 0}
              isLast={i === roster.length - 1}
            />
          ))}
        </div>
      )}
    </Section>
  );
}

function RosterRowCard({
  deckId,
  row,
  clientName,
  isFirst,
  isLast,
}: {
  deckId: string;
  row: RosterRow;
  clientName: string | null;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { creator } = row;
  const [open, setOpen] = useState(false);
  const [pitch, setPitch] = useState(row.pitch ?? "");
  const [pitchSaved, setPitchSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const check = backgroundCheckMeta(creator.backgroundCheck);
  const reach = totalFollowers(creator);

  const run = (fn: () => Promise<unknown>) => startTransition(async () => void (await fn()));

  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <CreatorAvatar creator={creator} size={36} />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/creators/${creator.id}`} className="font-semibold text-sm hover:underline">
              {creator.name}
            </Link>
            <span className="chip flex items-center gap-1.5">
              <span className="dot" style={{ background: check.colorVar }} />
              {check.label}
            </span>
          </div>
          <div className="text-xs text-ink-3 truncate">
            {creator.tagline || creator.niche || "No tagline yet"}
            {reach > 0 ? ` · ${fmtCompact(reach)} reach` : ""}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => run(() => moveDeckCreator(deckId, creator.id, "up"))}
            disabled={isFirst || pending}
            aria-label={`Move ${creator.name} up`}
          >
            ↑
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => run(() => moveDeckCreator(deckId, creator.id, "down"))}
            disabled={isLast || pending}
            aria-label={`Move ${creator.name} down`}
          >
            ↓
          </button>
          <button className="btn btn-sm" onClick={() => setOpen((o) => !o)}>
            {open ? "Close" : "Edit profile"}
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => run(() => removeCreatorFromDeck(deckId, creator.id))}
            disabled={pending}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-3">
        <label className="field-label">
          Why {creator.name}{clientName ? ` for ${clientName}` : ""}?
          <span className="font-normal text-ink-3"> — this deck only</span>
        </label>
        <textarea
          className="input"
          rows={2}
          value={pitch}
          onChange={(e) => {
            setPitch(e.target.value);
            setPitchSaved(false);
          }}
          placeholder="The one-liner that makes this pairing obvious."
        />
        <div className="flex items-center gap-2 mt-2">
          <button
            className="btn btn-sm"
            disabled={pending || pitch === (row.pitch ?? "")}
            onClick={() =>
              startTransition(async () => {
                await setDeckPitch(deckId, creator.id, pitch);
                setPitchSaved(true);
              })
            }
          >
            Save pitch
          </button>
          {pitchSaved && !pending && (
            <span className="text-xs" style={{ color: "var(--good-text)" }}>Saved</span>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--grid)" }}>
          <TalentProfileForm creatorId={creator.id} profile={creator} />
        </div>
      )}
    </div>
  );
}

function DangerZone({ deckId, name }: { deckId: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="flex justify-end">
      {confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-2">Delete “{name}” and its share link?</span>
          <button className="btn btn-sm" onClick={() => setConfirming(false)}>
            Cancel
          </button>
          <button
            className="btn btn-sm btn-danger"
            onClick={() => startTransition(async () => void (await deleteDeck(deckId)))}
          >
            Delete deck
          </button>
        </div>
      ) : (
        <button className="btn btn-sm btn-ghost text-ink-3" onClick={() => setConfirming(true)}>
          Delete deck
        </button>
      )}
    </div>
  );
}
