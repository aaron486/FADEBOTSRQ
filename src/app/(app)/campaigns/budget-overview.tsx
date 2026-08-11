"use client";

import { useState, useTransition } from "react";
import { fmtMoneyCents } from "@/lib/creator-meta";
import { setOverallBudget } from "@/lib/actions/campaigns";

export function BudgetOverview({
  overallBudgetCents,
  campaignBudgetsCents,
  committedCents,
  spentCents,
}: {
  overallBudgetCents: number | null;
  campaignBudgetsCents: number;
  committedCents: number;
  spentCents: number;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(
    overallBudgetCents != null ? String(overallBudgetCents / 100) : ""
  );
  const [pending, startTransition] = useTransition();

  // The budget we measure against: the overall number if set, otherwise the
  // sum of per-campaign budgets.
  const budget = overallBudgetCents ?? (campaignBudgetsCents > 0 ? campaignBudgetsCents : null);
  const left = budget != null ? budget - spentCents : null;
  const spentPct = budget ? Math.min(100, (spentCents / budget) * 100) : 0;
  const committedPct = budget ? Math.min(100, (committedCents / budget) * 100) : 0;

  function save() {
    startTransition(async () => {
      await setOverallBudget(draft.trim() === "" ? null : Math.round(Number(draft) * 100));
      setEditing(false);
    });
  }

  return (
    <section className="card p-4 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2">Budget & spend — all campaigns</h2>
        {editing ? (
          <div className="flex items-center gap-2">
            <input
              className="input w-36"
              type="number"
              min={0}
              step="0.01"
              placeholder="overall budget"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Overall budget (USD)"
              autoFocus
            />
            <button className="btn btn-primary btn-sm" onClick={save} disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        ) : (
          <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>
            {overallBudgetCents != null ? "Edit overall budget" : "Set overall budget"}
          </button>
        )}
      </div>

      <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
        <Tile
          label="Total budget"
          value={budget != null ? fmtMoneyCents(budget) : "—"}
          sub={
            overallBudgetCents != null
              ? `overall · campaigns total ${fmtMoneyCents(campaignBudgetsCents)}`
              : campaignBudgetsCents > 0
                ? "sum of campaign budgets"
                : "set one to track spend against it"
          }
        />
        <Tile label="Committed" value={fmtMoneyCents(committedCents)} sub="agreed rates, all creators" />
        <Tile
          label="Total spend"
          value={fmtMoneyCents(spentCents)}
          sub={budget ? `${Math.round((spentCents / budget) * 100)}% of budget` : "paid out so far"}
          good
        />
        <Tile
          label="Left to spend"
          value={left != null ? fmtMoneyCents(Math.max(0, left)) : "—"}
          sub={left != null && left < 0 ? `over budget by ${fmtMoneyCents(-left)}` : "budget − spend"}
          bad={left != null && left < 0}
        />
      </div>

      {budget != null && (
        <div>
          <div className="h-2.5 rounded-full overflow-hidden relative" style={{ background: "var(--grid)" }}>
            <div className="h-full absolute left-0 top-0 rounded-full" style={{ width: `${committedPct}%`, background: "var(--accent)", opacity: 0.35 }} />
            <div className="h-full absolute left-0 top-0 rounded-full" style={{ width: `${spentPct}%`, background: "var(--good-text)" }} />
          </div>
          <div className="flex justify-between text-[11px] text-ink-3 mt-1">
            <span>
              <span className="dot mr-1" style={{ background: "var(--good-text)" }} />
              spent {fmtMoneyCents(spentCents)}
              <span className="dot ml-3 mr-1" style={{ background: "var(--accent)", opacity: 0.5 }} />
              committed {fmtMoneyCents(committedCents)}
            </span>
            <span>{fmtMoneyCents(budget)} budget</span>
          </div>
        </div>
      )}
    </section>
  );
}

function Tile({ label, value, sub, good, bad }: { label: string; value: string; sub: string; good?: boolean; bad?: boolean }) {
  return (
    <div>
      <div className="text-xs text-ink-3">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs" style={{ color: bad ? "var(--critical)" : good ? "var(--good-text)" : "var(--text-secondary)" }}>
        {sub}
      </div>
    </div>
  );
}
