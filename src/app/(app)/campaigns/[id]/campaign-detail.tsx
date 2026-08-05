"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CampaignStatus,
  CAMPAIGN_STATUSES,
  campaignStatusMeta,
  ContactFields,
  FollowerFields,
  Stage,
  STAGES,
  stageMeta,
  primaryChannel,
  totalFollowers,
  fmtCompact,
  fmtMoneyCents,
  fmtNum,
  fmtDate,
  fmtDateTime,
} from "@/lib/creator-meta";
import { CreatorAvatar } from "@/components/creator-avatar";
import {
  updateCampaign,
  deleteCampaign,
  addCreatorToCampaign,
  removeCreatorFromCampaign,
} from "@/lib/actions/campaigns";
import {
  updateContentLinks,
  syncDriveContent,
  addContentLink,
  setContentStatus,
  assignContentCreator,
  deleteContentItem,
} from "@/lib/actions/content";
import {
  ContentStatus,
  CONTENT_STATUSES,
  contentStatusMeta,
} from "@/lib/creator-meta";

export type MemberRow = ContactFields &
  FollowerFields & {
    id: string;
    name: string;
    stage: Stage;
    agreedCostCents: number | null;
    paidCents: number | null;
    postCount: number;
    totalViews: number;
    totalLikes: number;
  };

export type CandidateRow = { id: string; name: string };

export type ActivityRow = {
  id: string;
  creatorId: string;
  creatorName: string;
  text: string;
  createdAt: string;
};

export type ContentRow = {
  id: string;
  name: string;
  url: string;
  thumbnailUrl: string | null;
  mimeType: string | null;
  status: ContentStatus;
  creatorId: string | null;
  creatorName: string | null;
  createdAt: string;
};

type CampaignData = {
  id: string;
  name: string;
  status: CampaignStatus;
  budgetCents: number | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  driveFolderUrl: string | null;
  formUrl: string | null;
  updatedAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export type BriefRef = { creatorId: string; token: string };

export function CampaignDetail({
  campaign,
  members,
  candidates,
  activities,
  contentItems,
  briefs,
  driveConfigured,
}: {
  campaign: CampaignData;
  members: MemberRow[];
  candidates: CandidateRow[];
  activities: ActivityRow[];
  contentItems: ContentRow[];
  briefs: BriefRef[];
  driveConfigured: boolean;
}) {
  const status = campaignStatusMeta(campaign.status);

  /* ---- Stats ---- */
  const active = members.filter((m) => m.stage !== "DECLINED");
  const reach = active.reduce((s, m) => s + totalFollowers(m), 0);
  const committed = active.reduce((s, m) => s + (m.agreedCostCents ?? 0), 0);
  const paid = members.reduce((s, m) => s + (m.paidCents ?? 0), 0);
  const posted = members.filter((m) => m.stage === "POSTED").length;
  const posts = members.reduce((s, m) => s + m.postCount, 0);
  const views = members.reduce((s, m) => s + m.totalViews, 0);
  const likes = members.reduce((s, m) => s + m.totalLikes, 0);
  const cpm = views > 0 && paid > 0 ? (paid / views) * 1000 : null;
  const budget = campaign.budgetCents;

  const kpis: { label: string; value: string; sub: string; good?: boolean }[] = [
    { label: "Creators", value: fmtNum(members.length), sub: `${active.length} active · ${posted} posted` },
    { label: "Total reach", value: reach > 0 ? fmtCompact(reach) : "—", sub: "combined followers" },
    { label: "Committed", value: fmtMoneyCents(committed), sub: "agreed rates" },
    {
      label: "Current spend",
      value: fmtMoneyCents(paid),
      sub:
        budget != null && budget > 0
          ? `${Math.round((paid / budget) * 100)}% of ${fmtMoneyCents(budget)} budget`
          : committed > 0
            ? `${Math.round((paid / committed) * 100)}% of committed`
            : "paid out so far",
      good: true,
    },
    ...(budget != null
      ? [{ label: "Budget left", value: fmtMoneyCents(Math.max(0, budget - paid)), sub: "budget − spend" }]
      : []),
    { label: "Posts", value: fmtNum(posts), sub: `${fmtCompact(views)} views · ${fmtCompact(likes)} likes` },
    { label: "Cost / 1k views", value: cpm == null ? "—" : fmtMoneyCents(Math.round(cpm)), sub: "spend ÷ views" },
    {
      label: "Content",
      value: fmtNum(contentItems.length),
      sub: `${contentItems.filter((i) => i.status === "APPROVED" || i.status === "POSTED").length} approved`,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/campaigns" className="btn btn-ghost btn-sm">← Campaigns</Link>
        <h1 className="text-xl font-bold">{campaign.name}</h1>
        <span className="chip flex items-center gap-1.5">
          <span className="dot" style={{ background: status.colorVar }} />
          {status.label}
        </span>
        {(campaign.startDate || campaign.endDate) && (
          <span className="text-xs text-ink-3">
            {campaign.startDate ? fmtDate(campaign.startDate) : "…"} → {campaign.endDate ? fmtDate(campaign.endDate) : "…"}
          </span>
        )}
      </div>

      <Timeline startDate={campaign.startDate} endDate={campaign.endDate} />

      {/* KPI tiles */}
      <section className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        {kpis.map((k) => (
          <div key={k.label} className="card px-3.5 py-3">
            <div className="text-xs text-ink-3">{k.label}</div>
            <div className="text-2xl font-bold tabular-nums">{k.value}</div>
            <div className="text-xs" style={{ color: k.good ? "var(--good-text)" : "var(--text-secondary)" }}>
              {k.sub || " "}
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <BudgetSection budget={budget} committed={committed} paid={paid} />
        <PipelineSection members={members} />
      </div>

      <RosterSection campaignId={campaign.id} members={members} candidates={candidates} briefs={briefs} />

      <ContentSection
        campaign={campaign}
        items={contentItems}
        members={members}
        driveConfigured={driveConfigured}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        <ActivitySection activities={activities} />
        <SettingsWrapper campaign={campaign} />
      </div>
    </div>
  );
}

/* ---- Timeline progress (only when both dates are set) ---- */
function Timeline({ startDate, endDate }: { startDate: string | null; endDate: string | null }) {
  // Captured once per mount — "today" doesn't need to tick live.
  const [now] = useState(() => Date.now());
  if (!startDate || !endDate) return null;
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T23:59:59Z`).getTime();
  if (end <= start) return null;
  const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  const totalDays = Math.max(1, Math.round((end - start) / DAY_MS));
  const label =
    now < start
      ? `Starts in ${Math.ceil((start - now) / DAY_MS)} days`
      : now > end
        ? "Ended"
        : `Day ${Math.min(totalDays, Math.floor((now - start) / DAY_MS) + 1)} of ${totalDays} — ${Math.ceil(
            (end - now) / DAY_MS
          )} days left`;
  return (
    <div className="card px-4 py-3">
      <div className="flex items-center justify-between text-xs text-ink-2 mb-1.5">
        <span>Campaign timeline</span>
        <span>{label}</span>
      </div>
      <Bar pct={pct} color="var(--accent)" />
    </div>
  );
}

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--grid)" }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

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

/* ---- Budget & spend ---- */
function BudgetSection({
  budget,
  committed,
  paid,
}: {
  budget: number | null;
  committed: number;
  paid: number;
}) {
  // Bars scale against the biggest of the three so they're always comparable.
  const denom = Math.max(budget ?? 0, committed, paid);
  const rows = [
    ...(budget != null ? [{ label: "Budget", cents: budget, color: "var(--grid-strong, var(--baseline))" }] : []),
    { label: "Committed", cents: committed, color: "var(--accent)" },
    { label: "Spent (paid)", cents: paid, color: "var(--good-text)" },
  ];
  return (
    <Section title="Budget & spend">
      {denom === 0 ? (
        <p className="text-sm text-ink-3">
          No money on the board yet — set agreed rates on creators, or a budget in the campaign settings below.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-ink-2">{r.label}</span>
                <span className="tabular-nums font-medium">{fmtMoneyCents(r.cents)}</span>
              </div>
              <Bar pct={denom > 0 ? (r.cents / denom) * 100 : 0} color={r.color} />
            </div>
          ))}
          {budget != null && (
            <p className="text-xs text-ink-3">
              {paid > budget
                ? `Over budget by ${fmtMoneyCents(paid - budget)}`
                : `${fmtMoneyCents(budget - paid)} left to spend`}
              {committed > budget ? ` · committed exceeds budget by ${fmtMoneyCents(committed - budget)}` : ""}
            </p>
          )}
        </div>
      )}
    </Section>
  );
}

/* ---- Pipeline funnel ---- */
function PipelineSection({ members }: { members: MemberRow[] }) {
  const counts = STAGES.map((s) => ({
    ...s,
    count: members.filter((m) => m.stage === s.key).length,
  }));
  const max = Math.max(1, ...counts.map((c) => c.count));
  return (
    <Section title="Pipeline">
      {members.length === 0 ? (
        <p className="text-sm text-ink-3">Add creators to see where they sit in the pipeline.</p>
      ) : (
        <div className="space-y-2">
          {counts.map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-xs">
              <span className="w-24 flex items-center gap-1.5 text-ink-2 flex-none">
                <span className="dot" style={{ background: s.colorVar }} />
                {s.label}
              </span>
              <div className="flex-1">
                <Bar pct={(s.count / max) * 100} color={s.colorVar} />
              </div>
              <span className="w-6 text-right tabular-nums font-medium flex-none">{s.count}</span>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/* ---- Roster ---- */
function BriefCell({ campaignId, creatorId, token }: { campaignId: string; creatorId: string; token: string | null }) {
  const [copied, setCopied] = useState(false);

  function copy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!token) return;
    void navigator.clipboard.writeText(`${window.location.origin}/b/${token}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <Link href={`/campaigns/${campaignId}/briefs/${creatorId}`} className="btn btn-ghost btn-sm">
        {token ? "Edit brief" : "+ Brief"}
      </Link>
      {token && (
        <button className="btn btn-ghost btn-sm" title="Copy the creator's brief page link" onClick={copy}>
          {copied ? "Copied!" : "🔗"}
        </button>
      )}
    </div>
  );
}

function RosterSection({
  campaignId,
  members,
  candidates,
  briefs,
}: {
  campaignId: string;
  members: MemberRow[];
  candidates: CandidateRow[];
  briefs: BriefRef[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function add() {
    if (!selected) return;
    const id = selected;
    setSelected("");
    setBusyId(id);
    startTransition(async () => {
      await addCreatorToCampaign(campaignId, id);
      setBusyId(null);
    });
  }

  function remove(creatorId: string) {
    setBusyId(creatorId);
    startTransition(async () => {
      await removeCreatorFromCampaign(campaignId, creatorId);
      setBusyId(null);
    });
  }

  const cell = { borderTop: "1px solid var(--grid)" } as const;

  return (
    <Section title={`Creators — ${members.length}`}>
      <div className="flex gap-2 mb-3">
        <select
          className="input flex-1"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-label="Add creator to campaign"
        >
          <option value="">
            {candidates.length ? "Add a creator to this campaign…" : "All creators are already in this campaign"}
          </option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button className="btn" onClick={add} disabled={!selected || !!busyId}>
          Add
        </button>
      </div>

      {members.length === 0 ? (
        <p className="text-sm text-ink-3">No creators yet — add your first one above.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="text-left text-xs text-ink-3">
                <th className="px-2 py-1.5 font-medium">Creator</th>
                <th className="px-2 py-1.5 font-medium">Stage</th>
                <th className="px-2 py-1.5 font-medium text-right">Followers</th>
                <th className="px-2 py-1.5 font-medium text-right">Posts</th>
                <th className="px-2 py-1.5 font-medium text-right">Views</th>
                <th className="px-2 py-1.5 font-medium text-right">Agreed</th>
                <th className="px-2 py-1.5 font-medium text-right">Paid</th>
                <th className="px-2 py-1.5 font-medium">Brief</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const primary = primaryChannel(m);
                const stage = stageMeta(m.stage);
                const brief = briefs.find((b) => b.creatorId === m.id);
                return (
                  <tr
                    key={m.id}
                    className="cursor-pointer hover:bg-accent/5"
                    onClick={() => router.push(`/creators/${m.id}`)}
                  >
                    <td className="px-2 py-2" style={cell}>
                      <div className="flex items-center gap-2">
                        <CreatorAvatar creator={m} size={28} />
                        <div>
                          <div className="font-medium leading-tight">{m.name}</div>
                          <div className="text-xs text-ink-3">{primary?.handle ?? "no contact"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2" style={cell}>
                      <span className="chip flex items-center gap-1.5 w-fit">
                        <span className="dot" style={{ background: stage.colorVar }} />
                        {stage.label}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums" style={cell}>
                      {totalFollowers(m) > 0 ? fmtCompact(totalFollowers(m)) : "—"}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums" style={cell}>
                      {m.postCount > 0 ? fmtNum(m.postCount) : "—"}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums" style={cell}>
                      {m.totalViews > 0 ? fmtCompact(m.totalViews) : "—"}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums" style={cell}>
                      {fmtMoneyCents(m.agreedCostCents)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums" style={cell}>
                      {fmtMoneyCents(m.paidCents)}
                    </td>
                    <td className="px-2 py-2" style={cell}>
                      <BriefCell campaignId={campaignId} creatorId={m.id} token={brief?.token ?? null} />
                    </td>
                    <td className="px-2 py-2 text-right" style={cell}>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Remove from campaign"
                        disabled={busyId === m.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(m.id);
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

/* ---- Content library: Drive folder + upload form + synced items ---- */
function contentIcon(mimeType: string | null): string {
  if (!mimeType) return "🔗";
  if (mimeType.startsWith("video/")) return "🎬";
  if (mimeType.startsWith("image/")) return "🖼️";
  if (mimeType.startsWith("audio/")) return "🎵";
  return "📄";
}

function ContentThumb({ item }: { item: ContentRow }) {
  const [failed, setFailed] = useState(false);
  if (!item.thumbnailUrl || failed) {
    return (
      <div
        className="w-16 h-10 rounded flex items-center justify-center text-base flex-none"
        style={{ background: "var(--grid)" }}
      >
        {contentIcon(item.mimeType)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.thumbnailUrl}
      alt=""
      width={64}
      height={40}
      className="w-16 h-10 rounded object-cover flex-none"
      onError={() => setFailed(true)}
    />
  );
}

function ContentSection({
  campaign,
  items,
  members,
  driveConfigured,
}: {
  campaign: CampaignData;
  items: ContentRow[];
  members: MemberRow[];
  driveConfigured: boolean;
}) {
  const hasLinks = !!campaign.driveFolderUrl || !!campaign.formUrl;
  const [editingLinks, setEditingLinks] = useState(!hasLinks);
  const [driveUrl, setDriveUrl] = useState(campaign.driveFolderUrl ?? "");
  const [formUrl, setFormUrl] = useState(campaign.formUrl ?? "");
  const [note, setNote] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manualUrl, setManualUrl] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCreator, setManualCreator] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isError = (msg: string) => !/^(Saved|Synced|Added)/.test(msg);

  function saveLinks() {
    setNote("");
    startTransition(async () => {
      const res = await updateContentLinks(campaign.id, { driveUrl, formUrl });
      if (!res.ok) return setNote(res.error);
      setNote("Saved.");
      setEditingLinks(false);
    });
  }

  function sync() {
    setNote("");
    setSyncing(true);
    startTransition(async () => {
      const res = await syncDriveContent(campaign.id);
      setSyncing(false);
      setNote(
        res.ok
          ? `Synced — ${res.total} file${res.total === 1 ? "" : "s"} in the folder, ${res.added} new.`
          : res.error
      );
    });
  }

  function copyFormLink() {
    if (!campaign.formUrl) return;
    void navigator.clipboard.writeText(campaign.formUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function addManual() {
    if (!manualUrl.trim()) return;
    setNote("");
    startTransition(async () => {
      const res = await addContentLink(campaign.id, {
        url: manualUrl,
        name: manualName,
        creatorId: manualCreator || null,
      });
      if (!res.ok) return setNote(res.error);
      setManualUrl("");
      setManualName("");
      setManualCreator("");
      setNote("Added.");
    });
  }

  function setStatus(id: string, status: ContentStatus) {
    setBusyId(id);
    startTransition(async () => {
      await setContentStatus(id, status);
      setBusyId(null);
    });
  }

  function assign(id: string, creatorId: string) {
    setBusyId(id);
    startTransition(async () => {
      await assignContentCreator(id, creatorId || null);
      setBusyId(null);
    });
  }

  function remove(id: string) {
    setBusyId(id);
    startTransition(async () => {
      await deleteContentItem(id);
      setBusyId(null);
    });
  }

  return (
    <Section title={`Content library — ${items.length}`}>
      {/* Links row / setup */}
      {editingLinks ? (
        <div className="mb-4 space-y-3">
          <p className="text-sm text-ink-2">
            Creators upload through a Google Form that drops files into a Drive folder — link both here and
            this page becomes your content hub. In Google Forms, add a <b>File upload</b> question (responses
            land in a Drive folder automatically), then paste that folder&apos;s link below.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label" htmlFor="drive-url">Drive folder link</label>
              <input
                id="drive-url"
                className="input"
                placeholder="https://drive.google.com/drive/folders/…"
                value={driveUrl}
                onChange={(e) => setDriveUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="field-label" htmlFor="form-url">Upload form link (share with creators)</label>
              <input
                id="form-url"
                className="input"
                placeholder="https://forms.gle/…"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary btn-sm" onClick={saveLinks} disabled={pending}>
              Save links
            </button>
            {hasLinks && (
              <button className="btn btn-ghost btn-sm" onClick={() => setEditingLinks(false)}>
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {campaign.driveFolderUrl && (
            <a href={campaign.driveFolderUrl} target="_blank" rel="noreferrer" className="btn btn-sm">
              Open Drive folder ↗
            </a>
          )}
          {campaign.formUrl && (
            <>
              <a href={campaign.formUrl} target="_blank" rel="noreferrer" className="btn btn-sm">
                Open upload form ↗
              </a>
              <button className="btn btn-sm" onClick={copyFormLink}>
                {copied ? "Copied!" : "Copy form link"}
              </button>
            </>
          )}
          {campaign.driveFolderUrl && (
            <button className="btn btn-primary btn-sm" onClick={sync} disabled={syncing || !driveConfigured}
              title={driveConfigured ? "Pull new uploads from the Drive folder" : "Add GOOGLE_API_KEY in Vercel to enable sync"}>
              {syncing ? "Syncing…" : "⇅ Sync from Drive"}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => setEditingLinks(true)}>
            Edit links
          </button>
        </div>
      )}

      {!driveConfigured && campaign.driveFolderUrl && !editingLinks && (
        <p className="text-xs text-ink-3 mb-3">
          Drive sync needs a <code className="text-[11px]">GOOGLE_API_KEY</code> env var in Vercel (free —
          Google Cloud Console → APIs → Drive API → Credentials → API key). Until then, add content below by
          pasting links.
        </p>
      )}

      {note && (
        <p className="text-xs mb-3" style={{ color: isError(note) ? "var(--critical)" : "var(--good-text)" }}>
          {note}
        </p>
      )}

      {/* Items */}
      {items.length === 0 ? (
        <p className="text-sm text-ink-3 mb-3">
          No content yet — sync the Drive folder or paste a link below.
        </p>
      ) : (
        <div className="overflow-x-auto mb-3">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="text-left text-xs text-ink-3">
                <th className="px-2 py-1.5 font-medium">File</th>
                <th className="px-2 py-1.5 font-medium">Creator</th>
                <th className="px-2 py-1.5 font-medium">Status</th>
                <th className="px-2 py-1.5 font-medium">Added</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const status = contentStatusMeta(i.status);
                return (
                  <tr key={i.id}>
                    <td className="px-2 py-2" style={{ borderTop: "1px solid var(--grid)" }}>
                      <a href={i.url} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:underline">
                        <ContentThumb item={i} />
                        <span className="font-medium leading-tight break-all">{i.name}</span>
                      </a>
                    </td>
                    <td className="px-2 py-2" style={{ borderTop: "1px solid var(--grid)" }}>
                      <select
                        className="input w-auto text-xs"
                        value={i.creatorId ?? ""}
                        disabled={busyId === i.id}
                        onChange={(e) => assign(i.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2" style={{ borderTop: "1px solid var(--grid)" }}>
                      <div className="flex items-center gap-1.5">
                        <span className="dot flex-none" style={{ background: status.colorVar }} />
                        <select
                          className="input w-auto text-xs"
                          value={i.status}
                          disabled={busyId === i.id}
                          onChange={(e) => setStatus(i.id, e.target.value as ContentStatus)}
                        >
                          {CONTENT_STATUSES.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-xs text-ink-3 tabular-nums" style={{ borderTop: "1px solid var(--grid)" }}>
                      {fmtDate(i.createdAt)}
                    </td>
                    <td className="px-2 py-2 text-right" style={{ borderTop: "1px solid var(--grid)" }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        title="Remove from library"
                        disabled={busyId === i.id}
                        onClick={() => remove(i.id)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual add */}
      <div className="flex flex-wrap gap-2 items-center pt-3" style={{ borderTop: "1px solid var(--grid)" }}>
        <input
          className="input flex-1 min-w-[200px]"
          placeholder="Paste a content link (Drive file, Dropbox, anything)"
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
        />
        <input
          className="input w-40"
          placeholder="Name (optional)"
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
        />
        <select className="input w-auto" value={manualCreator} onChange={(e) => setManualCreator(e.target.value)}>
          <option value="">No creator</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <button className="btn btn-sm" onClick={addManual} disabled={pending || !manualUrl.trim()}>
          + Add
        </button>
      </div>
    </Section>
  );
}

/* ---- Recent activity across the campaign's creators ---- */
function ActivitySection({ activities }: { activities: ActivityRow[] }) {
  return (
    <Section title="Recent activity">
      {activities.length === 0 ? (
        <p className="text-sm text-ink-3">Nothing yet — activity from this campaign&apos;s creators shows up here.</p>
      ) : (
        <ul className="space-y-2.5">
          {activities.map((a) => (
            <li key={a.id} className="text-[13px] leading-snug">
              <span className="text-xs text-ink-3 tabular-nums">{fmtDateTime(a.createdAt)}</span>{" "}
              <Link href={`/creators/${a.creatorId}`} className="font-medium hover:underline">
                {a.creatorName}
              </Link>{" "}
              <span className="text-ink-2">— {a.text}</span>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

// Keeps the save confirmation visible across the remount that a successful
// save triggers (the form is keyed to updatedAt so it resyncs to fresh data).
function SettingsWrapper({ campaign }: { campaign: CampaignData }) {
  const [note, setNote] = useState("");
  return <SettingsSection key={campaign.updatedAt} campaign={campaign} note={note} onNote={setNote} />;
}

function SettingsSection({
  campaign,
  note,
  onNote,
}: {
  campaign: CampaignData;
  note: string;
  onNote: (n: string) => void;
}) {
  const [name, setName] = useState(campaign.name);
  const [status, setStatus] = useState<CampaignStatus>(campaign.status);
  const [budget, setBudget] = useState(
    campaign.budgetCents != null ? String(campaign.budgetCents / 100) : ""
  );
  const [startDate, setStartDate] = useState(campaign.startDate ?? "");
  const [endDate, setEndDate] = useState(campaign.endDate ?? "");
  const [notes, setNotes] = useState(campaign.notes ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    onNote("");
    startTransition(async () => {
      const res = await updateCampaign(campaign.id, {
        name,
        status,
        budgetCents: budget.trim() === "" ? null : Math.round(Number(budget) * 100),
        startDate: startDate || null,
        endDate: endDate || null,
        notes: notes || null,
      });
      onNote(res.ok ? "Saved." : res.error);
    });
  }

  function del() {
    if (!confirm(`Delete campaign "${campaign.name}"? Creators themselves are kept.`)) return;
    startTransition(async () => {
      await deleteCampaign(campaign.id);
    });
  }

  return (
    <Section title="Campaign settings">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="field-label" htmlFor="c-name">Name</label>
          <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="c-status">Status</label>
          <select
            id="c-status"
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as CampaignStatus)}
          >
            {CAMPAIGN_STATUSES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="c-budget">Budget (USD)</label>
          <input
            id="c-budget"
            className="input"
            type="number"
            min={0}
            step="0.01"
            placeholder="e.g. 25000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="field-label" htmlFor="c-start">Start</label>
            <input id="c-start" className="input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="c-end">End</label>
            <input id="c-end" className="input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor="c-notes">Notes</label>
          <textarea
            id="c-notes"
            className="input"
            rows={2}
            placeholder="Goals, deliverables, anything worth remembering"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <button className="btn btn-danger btn-sm" onClick={del} disabled={pending}>
          Delete campaign
        </button>
        <div className="flex items-center gap-3">
          {note && (
            <span
              className="text-xs"
              style={{ color: note === "Saved." ? "var(--good-text)" : "var(--critical)" }}
            >
              {note}
            </span>
          )}
          <button className="btn btn-primary" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save campaign"}
          </button>
        </div>
      </div>
    </Section>
  );
}
