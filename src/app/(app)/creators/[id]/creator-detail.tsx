"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Platform,
  Stage,
  ContractStatus,
  STAGES,
  stageMeta,
  PLATFORMS,
  CONTRACT_STATUSES,
  channels,
  profileUrl,
  fmtNum,
  fmtDate,
  fmtDateTime,
} from "@/lib/creator-meta";
import {
  updateCreatorProfile,
  setStage,
  updateDeal,
  deleteCreator,
  addPost,
  updatePostMetrics,
  deletePost,
  addNote,
} from "@/lib/actions/creators";
import { Composer } from "@/components/composer";

export type CreatorDetailData = {
  id: string;
  name: string;
  instagramHandle: string | null;
  xHandle: string | null;
  tiktokHandle: string | null;
  email: string | null;
  phone: string | null;
  primaryPlatform: Platform;
  agencyName: string | null;
  agencyContact: string | null;
  instagramFollowers: number | null;
  xFollowers: number | null;
  tiktokFollowers: number | null;
  niche: string | null;
  notes: string | null;
  stage: Stage;
  agreedCostCents: number | null;
  paidCents: number | null;
  paidAt: string | null;
  contractStatus: ContractStatus;
  contractSentAt: string | null;
  contractSignedAt: string | null;
  contractNotes: string | null;
};

export type MessageItem = {
  id: string;
  channel: Platform;
  subject: string | null;
  body: string;
  status: "DRAFT" | "SENT" | "FAILED";
  isFollowUp: boolean;
  sentAt: string | null;
  sentByEmail: string | null;
  error: string | null;
};

export type PostItem = { id: string; url: string; postedAt: string; views: number | null; likes: number | null };
export type ActivityItem = { id: string; text: string; createdAt: string; userEmail: string | null };
export type TemplateItem = {
  id: string;
  name: string;
  platform: Platform | null;
  subject: string | null;
  body: string;
};

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

export function CreatorDetail({
  creator,
  posts,
  messages,
  activities,
  templates,
  aiEnabled,
}: {
  creator: CreatorDetailData;
  posts: PostItem[];
  messages: MessageItem[];
  activities: ActivityItem[];
  templates: TemplateItem[];
  aiEnabled: boolean;
}) {
  const s = stageMeta(creator.stage);
  const [, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/" className="btn btn-ghost btn-sm">← Dashboard</Link>
        <h1 className="text-xl font-bold">{creator.name}</h1>
        <span className="flex flex-wrap items-center gap-2 text-sm">
          {channels(creator).map((ch) => (
            <a
              key={ch.platform}
              href={profileUrl(ch.platform, ch.handle)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{
                color: "var(--accent)",
                fontWeight: ch.platform === creator.primaryPlatform ? 600 : 400,
              }}
              title={ch.platform === creator.primaryPlatform ? "Primary channel" : undefined}
            >
              {PLATFORMS[ch.platform].label} {ch.handle}
            </a>
          ))}
          {creator.phone && (
            <a href={`tel:${creator.phone}`} className="text-ink-2 hover:underline">
              ☎ {creator.phone}
            </a>
          )}
        </span>
        <span className="inline-flex items-center gap-1.5 ml-auto text-sm">
          <span className="dot" style={{ background: s.colorVar }} />
          <select
            className="input w-auto py-1"
            value={creator.stage}
            onChange={(e) => startTransition(() => void setStage(creator.id, e.target.value as Stage))}
            aria-label="Pipeline stage"
          >
            {STAGES.map((st) => (
              <option key={st.key} value={st.key}>{st.label}</option>
            ))}
          </select>
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <ProfileSection creator={creator} />
          <DealSection creator={creator} />
          <PostsSection creator={creator} posts={posts} />
        </div>
        <div className="space-y-4">
          <Section title="Outreach">
            <Composer
              creator={creator}
              templates={templates}
              hasSentBefore={messages.some((m) => m.status === "SENT")}
              aiEnabled={aiEnabled}
            />
          </Section>
          <MessagesSection messages={messages} />
          <ActivitySection creator={creator} activities={activities} />
        </div>
      </div>
    </div>
  );
}

/* ---------------- profile ---------------- */

function ProfileSection({ creator }: { creator: CreatorDetailData }) {
  const [form, setForm] = useState({
    name: creator.name,
    instagram: creator.instagramHandle ?? "",
    x: creator.xHandle ?? "",
    tiktok: creator.tiktokHandle ?? "",
    email: creator.email ?? "",
    phone: creator.phone ?? "",
    primary: creator.primaryPlatform,
    agencyName: creator.agencyName ?? "",
    agencyContact: creator.agencyContact ?? "",
    igFollowers: creator.instagramFollowers?.toString() ?? "",
    xFollowers: creator.xFollowers?.toString() ?? "",
    ttFollowers: creator.tiktokFollowers?.toString() ?? "",
    niche: creator.niche ?? "",
    notes: creator.notes ?? "",
  });
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const available: { key: Platform; label: string }[] = [
    { key: "INSTAGRAM" as Platform, label: "Instagram", has: !!form.instagram.trim() },
    { key: "X" as Platform, label: "X", has: !!form.x.trim() },
    { key: "TIKTOK" as Platform, label: "TikTok", has: !!form.tiktok.trim() },
    { key: "EMAIL" as Platform, label: "Email", has: !!form.email.trim() },
  ].filter((c) => c.has);

  function save() {
    setError("");
    startTransition(async () => {
      const res = await updateCreatorProfile(creator.id, {
        name: form.name,
        instagramHandle: form.instagram || null,
        xHandle: form.x || null,
        tiktokHandle: form.tiktok || null,
        email: form.email || null,
        phone: form.phone || null,
        primaryPlatform: form.primary,
        agencyName: form.agencyName || null,
        agencyContact: form.agencyContact || null,
        instagramFollowers: form.igFollowers === "" ? null : Number(form.igFollowers),
        xFollowers: form.xFollowers === "" ? null : Number(form.xFollowers),
        tiktokFollowers: form.ttFollowers === "" ? null : Number(form.ttFollowers),
        niche: form.niche || null,
        notes: form.notes || null,
      });
      if (!res.ok) return setError(res.error);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Section title="Profile & contacts">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="field-label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Primary outreach channel</label>
          <select
            className="input"
            value={form.primary}
            onChange={(e) => setForm({ ...form, primary: e.target.value as Platform })}
          >
            {(available.length ? available : [{ key: form.primary, label: PLATFORMS[form.primary].label }]).map(
              (c) => (
                <option key={c.key} value={c.key}>{c.label}</option>
              )
            )}
          </select>
        </div>
        <div>
          <label className="field-label">Instagram · followers</label>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="@handle" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            <input className="input w-28" type="number" min={0} placeholder="followers" value={form.igFollowers} onChange={(e) => setForm({ ...form, igFollowers: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="field-label">X · followers</label>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="@handle" value={form.x} onChange={(e) => setForm({ ...form, x: e.target.value })} />
            <input className="input w-28" type="number" min={0} placeholder="followers" value={form.xFollowers} onChange={(e) => setForm({ ...form, xFollowers: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="field-label">TikTok · followers</label>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="@handle" value={form.tiktok} onChange={(e) => setForm({ ...form, tiktok: e.target.value })} />
            <input className="input w-28" type="number" min={0} placeholder="followers" value={form.ttFollowers} onChange={(e) => setForm({ ...form, ttFollowers: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="field-label">Email</label>
          <input className="input" type="email" placeholder="creator@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Phone</label>
          <input className="input" type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Agency</label>
          <input className="input" placeholder="e.g. QC / WME" value={form.agencyName} onChange={(e) => setForm({ ...form, agencyName: e.target.value })} />
        </div>
        <div>
          <label className="field-label">Agency contact</label>
          <input className="input" placeholder="agent name, email, or phone" value={form.agencyContact} onChange={(e) => setForm({ ...form, agencyContact: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Niche</label>
          <input className="input" value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Notes</label>
          <textarea
            className="input"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <button
          className="btn btn-danger btn-sm"
          onClick={() => {
            if (confirm(`Delete ${creator.name}? This can't be undone.`)) {
              startTransition(() => void deleteCreator(creator.id));
            }
          }}
        >
          Delete creator
        </button>
        <span className="flex items-center gap-2">
          {error && <span className="text-xs" style={{ color: "var(--critical)" }}>{error}</span>}
          {saved && <span className="text-xs" style={{ color: "var(--good-text)" }}>Saved</span>}
          <button className="btn btn-primary btn-sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </button>
        </span>
      </div>
    </Section>
  );
}

/* ---------------- deal & contract ---------------- */

function DealSection({ creator }: { creator: CreatorDetailData }) {
  const [agreed, setAgreed] = useState(
    creator.agreedCostCents != null ? (creator.agreedCostCents / 100).toString() : ""
  );
  const [paid, setPaid] = useState(creator.paidCents != null ? (creator.paidCents / 100).toString() : "");
  const [status, setStatus] = useState<ContractStatus>(creator.contractStatus);
  const [notes, setNotes] = useState(creator.contractNotes ?? "");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save() {
    startTransition(async () => {
      await updateDeal(creator.id, {
        agreedCostCents: agreed === "" ? null : Math.round(Number(agreed) * 100),
        paidCents: paid === "" ? null : Math.round(Number(paid) * 100),
        contractStatus: status,
        contractNotes: notes || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Section title="Deal & contract">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="field-label">Agreed cost (USD)</label>
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 500"
            value={agreed}
            onChange={(e) => setAgreed(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Paid so far (USD)</label>
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            placeholder="0"
            value={paid}
            onChange={(e) => setPaid(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label">Contract status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ContractStatus)}>
            {CONTRACT_STATUSES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Contract notes</label>
          <input
            className="input"
            placeholder="e.g. 2 reels + 1 story, net-15"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
      <p className="text-xs text-ink-3 mt-2">
        {creator.contractSentAt && `Contract sent ${fmtDate(creator.contractSentAt)}. `}
        {creator.contractSignedAt && `Signed ${fmtDate(creator.contractSignedAt)}. `}
        {creator.paidAt && `Last payment ${fmtDate(creator.paidAt)}.`}
      </p>
      <div className="flex items-center justify-end gap-2 mt-2">
        {saved && <span className="text-xs" style={{ color: "var(--good-text)" }}>Saved</span>}
        <button className="btn btn-primary btn-sm" onClick={save} disabled={pending}>
          {pending ? "Saving…" : "Save deal"}
        </button>
      </div>
    </Section>
  );
}

/* ---------------- posts ---------------- */

function PostsSection({ creator, posts }: { creator: CreatorDetailData; posts: PostItem[] }) {
  const [url, setUrl] = useState("");
  const [views, setViews] = useState("");
  const [likes, setLikes] = useState("");
  const [pending, startTransition] = useTransition();

  const totalViews = posts.reduce((s, p) => s + (p.views ?? 0), 0);

  function submit() {
    if (!url.trim()) return;
    startTransition(async () => {
      const res = await addPost(creator.id, {
        url,
        views: views === "" ? null : Number(views),
        likes: likes === "" ? null : Number(likes),
      });
      if (res.ok) {
        setUrl("");
        setViews("");
        setLikes("");
      }
    });
  }

  return (
    <Section title={`Posts & tracking${posts.length ? ` — ${fmtNum(totalViews)} views` : ""}`}>
      {posts.length > 0 && (
        <table className="w-full text-[13px] mb-3">
          <thead>
            <tr className="text-left text-[11.5px] text-ink-3">
              <th className="py-1.5 pr-2 font-semibold" style={{ borderBottom: "1px solid var(--grid)" }}>Link</th>
              <th className="py-1.5 pr-2 font-semibold" style={{ borderBottom: "1px solid var(--grid)" }}>Date</th>
              <th className="py-1.5 pr-2 font-semibold text-right" style={{ borderBottom: "1px solid var(--grid)" }}>Views</th>
              <th className="py-1.5 pr-2 font-semibold text-right" style={{ borderBottom: "1px solid var(--grid)" }}>Likes</th>
              <th style={{ borderBottom: "1px solid var(--grid)" }}></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <PostRow key={p.id} post={p} />
            ))}
          </tbody>
        </table>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          className="input flex-1 min-w-[160px]"
          placeholder="Post URL"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <input
          className="input w-[100px]"
          type="number"
          min={0}
          placeholder="Views"
          value={views}
          onChange={(e) => setViews(e.target.value)}
        />
        <input
          className="input w-[100px]"
          type="number"
          min={0}
          placeholder="Likes"
          value={likes}
          onChange={(e) => setLikes(e.target.value)}
        />
        <button className="btn" onClick={submit} disabled={pending || !url.trim()}>
          {pending ? "Adding…" : "Add post"}
        </button>
      </div>
    </Section>
  );
}

function PostRow({ post }: { post: PostItem }) {
  const [editing, setEditing] = useState(false);
  const [views, setViews] = useState(post.views?.toString() ?? "");
  const [likes, setLikes] = useState(post.likes?.toString() ?? "");
  const [pending, startTransition] = useTransition();

  const shortUrl = post.url.replace(/^https?:\/\/(www\.)?/, "").slice(0, 38);

  return (
    <tr>
      <td className="py-1.5 pr-2" style={{ borderBottom: "1px solid var(--grid)" }}>
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:underline break-all"
          style={{ color: "var(--accent)" }}
        >
          {shortUrl}
        </a>
      </td>
      <td className="py-1.5 pr-2 whitespace-nowrap text-ink-3" style={{ borderBottom: "1px solid var(--grid)" }}>
        {fmtDate(post.postedAt)}
      </td>
      {editing ? (
        <>
          <td className="py-1.5 pr-2 text-right" style={{ borderBottom: "1px solid var(--grid)" }}>
            <input className="input w-[80px] py-0.5" type="number" value={views} onChange={(e) => setViews(e.target.value)} />
          </td>
          <td className="py-1.5 pr-2 text-right" style={{ borderBottom: "1px solid var(--grid)" }}>
            <input className="input w-[80px] py-0.5" type="number" value={likes} onChange={(e) => setLikes(e.target.value)} />
          </td>
          <td className="py-1.5 text-right whitespace-nowrap" style={{ borderBottom: "1px solid var(--grid)" }}>
            <button
              className="btn btn-sm btn-primary"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await updatePostMetrics(post.id, {
                    views: views === "" ? null : Number(views),
                    likes: likes === "" ? null : Number(likes),
                  });
                  setEditing(false);
                })
              }
            >
              Save
            </button>
          </td>
        </>
      ) : (
        <>
          <td className="py-1.5 pr-2 text-right tabular-nums" style={{ borderBottom: "1px solid var(--grid)" }}>
            {fmtNum(post.views)}
          </td>
          <td className="py-1.5 pr-2 text-right tabular-nums" style={{ borderBottom: "1px solid var(--grid)" }}>
            {fmtNum(post.likes)}
          </td>
          <td className="py-1.5 text-right whitespace-nowrap" style={{ borderBottom: "1px solid var(--grid)" }}>
            <button className="btn btn-sm btn-ghost" onClick={() => setEditing(true)} title="Update metrics">✎</button>
            <button
              className="btn btn-sm btn-ghost"
              style={{ color: "var(--critical)" }}
              title="Remove post"
              disabled={pending}
              onClick={() => {
                if (confirm("Remove this post?")) startTransition(() => void deletePost(post.id));
              }}
            >
              ✕
            </button>
          </td>
        </>
      )}
    </tr>
  );
}

/* ---------------- message history ---------------- */

function MessagesSection({ messages }: { messages: MessageItem[] }) {
  if (messages.length === 0) return null;
  return (
    <Section title={`Message history — ${messages.length}`}>
      <ul className="space-y-2.5">
        {messages.map((m) => (
          <li key={m.id} className="text-[13px]">
            <div className="flex items-center gap-2 text-xs text-ink-3">
              <span className="chip">{PLATFORMS[m.channel].label}</span>
              {m.isFollowUp && <span className="chip">follow-up</span>}
              {m.status === "FAILED" ? (
                <span style={{ color: "var(--critical)" }}>failed{m.error ? `: ${m.error}` : ""}</span>
              ) : (
                <span>{fmtDateTime(m.sentAt)}</span>
              )}
              {m.sentByEmail && <span>by {m.sentByEmail}</span>}
            </div>
            {m.subject && <div className="font-semibold mt-0.5">{m.subject}</div>}
            <p className="text-ink-2 whitespace-pre-wrap mt-0.5 line-clamp-3">{m.body}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ---------------- activity ---------------- */

function ActivitySection({ creator, activities }: { creator: CreatorDetailData; activities: ActivityItem[] }) {
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!note.trim()) return;
    startTransition(async () => {
      const res = await addNote(creator.id, note);
      if (res.ok) setNote("");
    });
  }

  return (
    <Section title="Activity">
      <div className="flex gap-2 mb-3">
        <input
          className="input flex-1"
          placeholder="Add a note…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button className="btn" onClick={submit} disabled={pending || !note.trim()}>
          Add
        </button>
      </div>
      <ul>
        {activities.map((a) => (
          <li
            key={a.id}
            className="flex gap-3 py-1.5 text-[13px]"
            style={{ borderBottom: "1px solid var(--grid)" }}
          >
            <span className="text-ink-3 whitespace-nowrap tabular-nums">{fmtDateTime(a.createdAt)}</span>
            <span className="text-ink-2">
              {a.text}
              {a.userEmail && <span className="text-ink-3"> — {a.userEmail}</span>}
            </span>
          </li>
        ))}
        {activities.length === 0 && <li className="text-xs text-ink-3">No activity yet.</li>}
      </ul>
    </Section>
  );
}
