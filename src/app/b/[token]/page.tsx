import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtDate, fmtMoneyCents } from "@/lib/creator-meta";
import { FadeWordmark } from "@/components/logo";

export const dynamic = "force-dynamic";

// Private-link page — keep it out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

const lines = (v: string | null) =>
  (v ?? "")
    .split("\n")
    .map((l) => l.replace(/^[-•*]\s*/, "").trim())
    .filter(Boolean);

export default async function BriefPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const brief = await prisma.creatorBrief.findUnique({
    where: { token },
    include: { creator: true, campaign: true },
  });
  if (!brief) notFound();
  const { creator, campaign } = brief;

  const deliverables = lines(brief.deliverables);
  const talkingPoints = lines(brief.talkingPoints);
  const dos = lines(brief.dos);
  const donts = lines(brief.donts);
  const window =
    campaign.startDate || campaign.endDate
      ? `${campaign.startDate ? fmtDate(campaign.startDate) : "…"} → ${campaign.endDate ? fmtDate(campaign.endDate) : "…"}`
      : null;

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <header className="px-6 py-10 text-center" style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--edge)" }}>
        <FadeWordmark className="h-6 w-auto mx-auto mb-4" />
        <h1 className="text-2xl sm:text-3xl font-bold mb-1">
          {brief.headline || `FADE × ${creator.name} — ${campaign.name}`}
        </h1>
        <p className="text-sm text-ink-3">
          Creative brief for {creator.name}
          {window ? ` · ${window}` : ""}
        </p>
      </header>

      <div className="mx-auto max-w-2xl px-5 py-8 space-y-5">
        {brief.intro && <p className="text-[15px] leading-relaxed text-ink-2">{brief.intro}</p>}

        {/* The key facts, up front */}
        <div className="grid grid-cols-2 gap-3">
          <div className="card px-4 py-3">
            <div className="text-xs text-ink-3">Content due</div>
            <div className="text-lg font-bold">{brief.dueDate ? fmtDate(brief.dueDate) : "TBD"}</div>
          </div>
          <div className="card px-4 py-3">
            <div className="text-xs text-ink-3">Compensation</div>
            <div className="text-lg font-bold tabular-nums">
              {brief.compensationCents != null ? fmtMoneyCents(brief.compensationCents) : "As agreed"}
            </div>
          </div>
        </div>

        {/* Core company profile */}
        {(brief.productDetails || brief.differentiators || brief.brandSocials) && (
          <section className="card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2 pb-2 mb-3" style={{ borderBottom: "1px solid var(--grid)" }}>
              About FADE
            </h2>
            {brief.productDetails && <p className="text-sm text-ink-2 mb-3">{brief.productDetails}</p>}
            {lines(brief.differentiators).length > 0 && (
              <ul className="space-y-1 list-disc pl-5 text-sm text-ink-2 marker:text-ink-3 mb-3">
                {lines(brief.differentiators).map((d, i) => (<li key={i}>{d}</li>))}
              </ul>
            )}
            {lines(brief.brandSocials).length > 0 && (
              <p className="text-xs text-ink-3">{lines(brief.brandSocials).join(" · ")}</p>
            )}
          </section>
        )}

        {/* Objectives & audience */}
        {(brief.mainGoal || brief.targetAudience || brief.desiredAction) && (
          <section className="card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2 pb-2 mb-3" style={{ borderBottom: "1px solid var(--grid)" }}>
              🎯 The goal
            </h2>
            <div className="space-y-2 text-sm text-ink-2">
              {brief.mainGoal && <p><b>Main goal:</b> {brief.mainGoal}</p>}
              {brief.targetAudience && <p><b>Who we&apos;re talking to:</b> {brief.targetAudience}</p>}
              {brief.desiredAction && <p><b>What viewers should do:</b> {brief.desiredAction}</p>}
            </div>
          </section>
        )}

        {brief.sourceUrl && (
          <section className="card p-5 flex flex-wrap items-center gap-3">
            <div className="mr-auto">
              <h2 className="text-sm font-bold">It starts with this post</h2>
              <p className="text-xs text-ink-3">Watch it first — everything below reacts to it.</p>
            </div>
            <a href={brief.sourceUrl} target="_blank" rel="noreferrer" className="btn btn-sm">
              View the source post ↗
            </a>
          </section>
        )}

        {brief.concept && (
          <section className="card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2 pb-2 mb-3" style={{ borderBottom: "1px solid var(--grid)" }}>
              The concept
            </h2>
            <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed text-ink-2">{brief.concept}</pre>
          </section>
        )}

        {lines(brief.referenceLinks).length > 0 && (
          <section className="card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2 pb-2 mb-3" style={{ borderBottom: "1px solid var(--grid)" }}>
              Reference content
            </h2>
            <ul className="space-y-1.5 text-sm">
              {lines(brief.referenceLinks).map((l, i) => (
                <li key={i}>
                  {/^https?:\/\//.test(l) ? (
                    <a href={l} target="_blank" rel="noreferrer" className="underline break-all text-ink-2">{l}</a>
                  ) : (
                    <span className="text-ink-2">{l}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {deliverables.length > 0 && (
          <section className="card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2 pb-2 mb-3" style={{ borderBottom: "1px solid var(--grid)" }}>
              Your deliverables
            </h2>
            <ul className="space-y-2">
              {deliverables.map((d, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[15px]">
                  <span className="mt-0.5 flex-none w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold"
                    style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
                    {i + 1}
                  </span>
                  {d}
                </li>
              ))}
            </ul>
          </section>
        )}

        {talkingPoints.length > 0 && (
          <section className="card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2 pb-2 mb-3" style={{ borderBottom: "1px solid var(--grid)" }}>
              Talking points
            </h2>
            <ul className="space-y-1.5 list-disc pl-5 text-[15px] text-ink-2 marker:text-ink-3">
              {talkingPoints.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </section>
        )}

        {(lines(brief.visualGuidelines).length > 0 || brief.tone) && (
          <section className="card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2 pb-2 mb-3" style={{ borderBottom: "1px solid var(--grid)" }}>
              🎬 Look &amp; feel
            </h2>
            {lines(brief.visualGuidelines).length > 0 && (
              <ul className="space-y-1 list-disc pl-5 text-sm text-ink-2 marker:text-ink-3 mb-2">
                {lines(brief.visualGuidelines).map((v, i) => (<li key={i}>{v}</li>))}
              </ul>
            )}
            {brief.tone && <p className="text-sm text-ink-2"><b>Tone:</b> {brief.tone}</p>}
          </section>
        )}

        {(dos.length > 0 || donts.length > 0) && (
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dos.length > 0 && (
              <div className="card p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider pb-2 mb-3" style={{ color: "var(--good-text)", borderBottom: "1px solid var(--grid)" }}>
                  Do
                </h2>
                <ul className="space-y-1.5 text-sm text-ink-2">
                  {dos.map((d, i) => (
                    <li key={i} className="flex gap-2"><span style={{ color: "var(--good-text)" }}>✓</span>{d}</li>
                  ))}
                </ul>
              </div>
            )}
            {donts.length > 0 && (
              <div className="card p-5">
                <h2 className="text-xs font-semibold uppercase tracking-wider pb-2 mb-3" style={{ color: "var(--critical)", borderBottom: "1px solid var(--grid)" }}>
                  Don&apos;t
                </h2>
                <ul className="space-y-1.5 text-sm text-ink-2">
                  {donts.map((d, i) => (
                    <li key={i} className="flex gap-2"><span style={{ color: "var(--critical)" }}>✕</span>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {lines(brief.legalDisclosure).length > 0 && (
          <section className="card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider pb-2 mb-3" style={{ color: "var(--critical)", borderBottom: "1px solid var(--grid)" }}>
              🚫 Required disclosure
            </h2>
            <ul className="space-y-1 list-disc pl-5 text-sm text-ink-2 marker:text-ink-3">
              {lines(brief.legalDisclosure).map((l, i) => (<li key={i}>{l}</li>))}
            </ul>
          </section>
        )}

        {(lines(brief.timeline).length > 0 || brief.usageRights) && (
          <section className="card p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2 pb-2 mb-3" style={{ borderBottom: "1px solid var(--grid)" }}>
              ⚙️ Timeline &amp; terms
            </h2>
            {lines(brief.timeline).length > 0 && (
              <ul className="space-y-1 list-disc pl-5 text-sm text-ink-2 marker:text-ink-3 mb-2">
                {lines(brief.timeline).map((t, i) => (<li key={i}>{t}</li>))}
              </ul>
            )}
            {brief.usageRights && <p className="text-sm text-ink-2"><b>Usage rights:</b> {brief.usageRights}</p>}
          </section>
        )}

        {/* Upload */}
        <section className="card p-6 text-center">
          <h2 className="text-base font-bold mb-1">Ready to send your content?</h2>
          {campaign.formUrl ? (
            <>
              <p className="text-sm text-ink-3 mb-4">
                Upload everything through the form — we&apos;ll review it and get back to you fast.
              </p>
              <a href={campaign.formUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                Upload your content ↗
              </a>
            </>
          ) : (
            <p className="text-sm text-ink-3">
              Send your files to your FADE contact — they&apos;ll take it from there.
            </p>
          )}
        </section>

        <p className="text-center text-xs text-ink-3 pb-6">
          Questions? Reply to your FADE contact — we&apos;re quick.
        </p>
      </div>
    </main>
  );
}
