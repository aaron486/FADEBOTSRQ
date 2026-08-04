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
  stageMeta,
  primaryChannel,
  totalFollowers,
  fmtCompact,
  fmtMoneyCents,
} from "@/lib/creator-meta";
import { CreatorAvatar } from "@/components/creator-avatar";
import {
  updateCampaign,
  deleteCampaign,
  addCreatorToCampaign,
  removeCreatorFromCampaign,
} from "@/lib/actions/campaigns";

export type MemberRow = ContactFields &
  FollowerFields & {
    id: string;
    name: string;
    stage: Stage;
    agreedCostCents: number | null;
    paidCents: number | null;
  };

export type CandidateRow = { id: string; name: string };

type CampaignData = {
  id: string;
  name: string;
  status: CampaignStatus;
  budgetCents: number | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  updatedAt: string;
};

export function CampaignDetail({
  campaign,
  members,
  candidates,
}: {
  campaign: CampaignData;
  members: MemberRow[];
  candidates: CandidateRow[];
}) {
  const status = campaignStatusMeta(campaign.status);
  const reach = members.reduce((sum, m) => sum + totalFollowers(m), 0);
  const committed = members.reduce((sum, m) => sum + (m.agreedCostCents ?? 0), 0);
  const paid = members.reduce((sum, m) => sum + (m.paidCents ?? 0), 0);
  const posted = members.filter((m) => m.stage === "POSTED").length;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/campaigns" className="btn btn-ghost btn-sm">← Campaigns</Link>
        <h1 className="text-xl font-bold">{campaign.name}</h1>
        <span className="chip flex items-center gap-1.5">
          <span className="dot" style={{ background: status.colorVar }} />
          {status.label}
        </span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Kpi label="Creators" value={String(members.length)} />
        <Kpi label="Total reach" value={reach > 0 ? fmtCompact(reach) : "—"} />
        <Kpi label="Committed" value={committed > 0 ? fmtMoneyCents(committed) : "—"} />
        <Kpi label="Paid" value={paid > 0 ? fmtMoneyCents(paid) : "—"} />
        <Kpi label="Posted" value={`${posted}/${members.length || 0}`} />
      </div>

      <RosterSection campaignId={campaign.id} members={members} candidates={candidates} />
      <SettingsWrapper campaign={campaign} />
    </div>
  );
}

// Keeps the save confirmation visible across the remount that a successful
// save triggers (the form is keyed to updatedAt so it resyncs to fresh data).
function SettingsWrapper({ campaign }: { campaign: CampaignData }) {
  const [note, setNote] = useState("");
  return <SettingsSection key={campaign.updatedAt} campaign={campaign} note={note} onNote={setNote} />;
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-3 py-2.5">
      <div className="text-lg font-bold tabular-nums leading-tight">{value}</div>
      <div className="text-[11px] text-ink-3">{label}</div>
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

function RosterSection({
  campaignId,
  members,
  candidates,
}: {
  campaignId: string;
  members: MemberRow[];
  candidates: CandidateRow[];
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
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="text-left text-xs text-ink-3">
                <th className="px-2 py-1.5 font-medium">Creator</th>
                <th className="px-2 py-1.5 font-medium">Stage</th>
                <th className="px-2 py-1.5 font-medium text-right">Followers</th>
                <th className="px-2 py-1.5 font-medium text-right">Agreed</th>
                <th className="px-2 py-1.5 font-medium text-right">Paid</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const primary = primaryChannel(m);
                const stage = stageMeta(m.stage);
                return (
                  <tr
                    key={m.id}
                    className="cursor-pointer hover:bg-accent/5"
                    onClick={() => router.push(`/creators/${m.id}`)}
                  >
                    <td className="px-2 py-2" style={{ borderTop: "1px solid var(--grid)" }}>
                      <div className="flex items-center gap-2">
                        <CreatorAvatar creator={m} size={28} />
                        <div>
                          <div className="font-medium leading-tight">{m.name}</div>
                          <div className="text-xs text-ink-3">{primary?.handle ?? "no contact"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2" style={{ borderTop: "1px solid var(--grid)" }}>
                      <span className="chip flex items-center gap-1.5 w-fit">
                        <span className="dot" style={{ background: stage.colorVar }} />
                        {stage.label}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ borderTop: "1px solid var(--grid)" }}>
                      {totalFollowers(m) > 0 ? fmtCompact(totalFollowers(m)) : "—"}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ borderTop: "1px solid var(--grid)" }}>
                      {fmtMoneyCents(m.agreedCostCents)}
                    </td>
                    <td className="px-2 py-2 text-right tabular-nums" style={{ borderTop: "1px solid var(--grid)" }}>
                      {fmtMoneyCents(m.paidCents)}
                    </td>
                    <td className="px-2 py-2 text-right" style={{ borderTop: "1px solid var(--grid)" }}>
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
