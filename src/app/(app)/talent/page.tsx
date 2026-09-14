import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { fmtCompact, fmtDate, totalFollowers } from "@/lib/creator-meta";
import { NewDeckForm } from "./new-deck-form";

export const dynamic = "force-dynamic";

export default async function TalentDecksPage() {
  const [decks, rosterReady] = await Promise.all([
    prisma.talentDeck.findMany({
      orderBy: { createdAt: "desc" },
      include: { creators: { include: { creator: true } } },
    }),
    prisma.creator.count({ where: { backgroundCheck: "CLEARED" } }),
  ]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold mb-1">Talent decks</h1>
          <p className="text-sm text-ink-2">
            Curate a roster of FADE talent and share it as a branded partnership page — stats,
            photos, past partnerships, brand fit, vetting, and audience.
          </p>
        </div>
        <NewDeckForm />
      </div>

      {decks.length === 0 ? (
        <div className="card p-8 text-center text-sm text-ink-3">
          No decks yet — name your first one above, then add talent to it.
          {rosterReady > 0 && ` ${rosterReady} creator${rosterReady === 1 ? " is" : "s are"} background-checked and ready to showcase.`}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {decks.map((d) => {
            const talent = d.creators.map((r) => r.creator);
            const reach = talent.reduce((sum, c) => sum + totalFollowers(c), 0);
            const cleared = talent.filter((c) => c.backgroundCheck === "CLEARED").length;
            return (
              <Link
                key={d.id}
                href={`/talent/${d.id}`}
                className="card p-4 block hover:border-accent transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-[15px]">{d.name}</span>
                  <span className="chip ml-auto flex items-center gap-1.5">
                    <span
                      className="dot"
                      style={{ background: d.published ? "var(--good)" : "var(--text-muted)" }}
                    />
                    {d.published ? "Live" : "Unpublished"}
                  </span>
                </div>
                <div className="text-xs text-ink-3 mb-3">
                  {d.clientName ? `For ${d.clientName} · ` : ""}
                  Updated {fmtDate(d.updatedAt)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="Talent" value={String(talent.length)} />
                  <Stat label="Reach" value={reach > 0 ? fmtCompact(reach) : "—"} />
                  <Stat label="Vetted" value={`${cleared}/${talent.length}`} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-ink-3">{label}</div>
    </div>
  );
}
