import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  Platform,
  PLATFORMS,
  backgroundCheckMeta,
  bulletLines,
  channels,
  fmtCompact,
  fmtDate,
  fmtNum,
  fmtPct,
  photoList,
  profileUrl,
  totalFollowers,
} from "@/lib/creator-meta";
import { FadeWordmark } from "@/components/logo";
import { TalentPortrait, TalentThumb } from "@/components/talent-photo";
import type { Creator } from "@prisma/client";

export const dynamic = "force-dynamic";

// Private-link page — keep it out of search engines.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function TalentDeckPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const deck = await prisma.talentDeck.findUnique({
    where: { token },
    include: {
      creators: {
        orderBy: [{ position: "asc" }, { addedAt: "asc" }],
        include: { creator: true },
      },
    },
  });
  if (!deck || !deck.published) notFound();

  const roster = deck.creators.map((row) => ({ ...row, creator: row.creator }));
  const reach = roster.reduce((sum, r) => sum + totalFollowers(r.creator), 0);
  const rates = roster
    .map((r) => r.creator.engagementRatePct)
    .filter((n): n is number => n != null);
  const avgRate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : null;
  const cleared = roster.filter((r) => r.creator.backgroundCheck === "CLEARED").length;
  const platformCount = new Set(
    roster.flatMap((r) =>
      channels(r.creator)
        .filter((c) => c.platform !== "EMAIL")
        .map((c) => c.platform)
    )
  ).size;

  return (
    <main className="deck min-h-screen">
      {/* Cover */}
      <header
        className="px-6 py-14 text-center"
        style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--edge)" }}
      >
        <FadeWordmark className="h-7 w-auto mx-auto mb-6" />
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-3 mb-3">
          Talent partnerships
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight max-w-3xl mx-auto text-balance">
          {deck.headline || "FADE talent roster"}
        </h1>
        <p className="text-sm text-ink-3 mt-3">
          {deck.clientName ? `Prepared for ${deck.clientName} · ` : ""}
          {fmtDate(deck.updatedAt)}
        </p>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-10 space-y-8">
        {deck.intro && (
          <p className="text-[17px] leading-relaxed text-ink-2 max-w-2xl">{deck.intro}</p>
        )}

        {/* Roster at a glance */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Talent" value={String(roster.length)} />
          <Stat label="Combined reach" value={reach > 0 ? fmtCompact(reach) : "—"} />
          <Stat label="Avg engagement" value={avgRate != null ? fmtPct(Math.round(avgRate * 10) / 10) : "—"} />
          <Stat label="Background checked" value={`${cleared}/${roster.length}`} />
        </section>
        {platformCount > 0 && (
          <p className="text-xs text-ink-3 -mt-5">
            Across {platformCount} platform{platformCount === 1 ? "" : "s"} · follower counts as last verified by FADE
          </p>
        )}

        {roster.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-3">
            This roster is being put together — check back shortly.
          </div>
        ) : (
          roster.map((row, i) => (
            <TalentCard
              key={row.creatorId}
              index={i + 1}
              pitch={row.pitch}
              clientName={deck.clientName}
              creator={row.creator}
            />
          ))
        )}

        {/* Close + contact */}
        <section className="card p-7 text-center">
          {deck.closing && (
            <p className="text-[15px] leading-relaxed text-ink-2 max-w-xl mx-auto mb-5">
              {deck.closing}
            </p>
          )}
          <h2 className="text-lg font-bold mb-1">Want to build a campaign around this roster?</h2>
          <p className="text-sm text-ink-3 mb-5">
            We handle sourcing, briefs, contracts, and reporting end to end.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {deck.contactEmail && (
              <a className="btn btn-primary" href={`mailto:${deck.contactEmail}`}>
                Email {deck.contactName || "the FADE team"}
              </a>
            )}
            {deck.ctaUrl && (
              <a className="btn" href={deck.ctaUrl} target="_blank" rel="noreferrer">
                Book a call ↗
              </a>
            )}
          </div>
        </section>

        <p className="text-center text-xs text-ink-3 pb-8">
          Confidential — shared by FADE for partnership review. Figures are self-reported by
          talent and verified by FADE at the date above.
        </p>
      </div>
    </main>
  );
}

function TalentCard({
  creator,
  pitch,
  clientName,
  index,
}: {
  creator: Creator;
  pitch: string | null;
  clientName: string | null;
  index: number;
}) {
  const photos = photoList(creator.photoUrls);
  const [hero, ...gallery] = photos;
  const socials = channels(creator).filter((c) => c.platform !== "EMAIL");
  const followersFor: Record<string, number | null> = {
    INSTAGRAM: creator.instagramFollowers,
    X: creator.xFollowers,
    TIKTOK: creator.tiktokFollowers,
    YOUTUBE: creator.youtubeFollowers,
  };
  const reach = totalFollowers(creator);
  const check = backgroundCheckMeta(creator.backgroundCheck);
  const partnerships = bulletLines(creator.pastPartnerships);
  const audience = [
    ["Age", creator.audienceAgeRange],
    ["Gender", creator.audienceGenderSplit],
    ["Top locations", creator.audienceTopLocations],
    ["Interests", creator.audienceInterests],
  ].filter(([, v]) => !!v) as [string, string][];

  return (
    <section className="card overflow-hidden deck-talent">
      <div className="flex flex-col sm:flex-row">
        {/* Portrait */}
        <div
          className="sm:w-56 flex-none flex items-center justify-center p-5"
          style={{ background: "var(--grid)" }}
        >
          <TalentPortrait src={hero} creator={creator} />
        </div>

        <div className="flex-1 p-6 min-w-0">
          <div className="flex items-start gap-3 mb-1">
            <span className="text-xs font-semibold text-ink-3 tabular-nums mt-1.5">
              {String(index).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold leading-tight">{creator.name}</h2>
              {creator.tagline && (
                <p className="text-sm text-ink-2 mt-0.5">{creator.tagline}</p>
              )}
            </div>
            {check.publicLabel && (
              <span className="chip ml-auto flex items-center gap-1.5 flex-none">
                <span className="dot" style={{ background: check.colorVar }} />
                {check.publicLabel}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-3">
            {creator.niche && <span className="chip">{creator.niche}</span>}
            {creator.location && <span className="chip">📍 {creator.location}</span>}
          </div>

          {creator.bio && (
            <p className="text-[15px] leading-relaxed text-ink-2 mt-3">{creator.bio}</p>
          )}

          {/* Social stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
            {socials.map((c) => (
              <a
                key={c.platform}
                href={profileUrl(c.platform, c.handle)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-lg block"
                style={{ background: "var(--page)", border: "1px solid var(--edge)" }}
              >
                <div className="text-[11px] text-ink-3">{PLATFORMS[c.platform as Platform].label}</div>
                <div className="text-base font-bold tabular-nums leading-tight">
                  {fmtCompact(followersFor[c.platform])}
                </div>
                <div className="text-[11px] text-ink-3 truncate">{c.handle}</div>
              </a>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-3 mt-3 tabular-nums">
            {reach > 0 && (
              <span>
                Total reach <b className="text-ink">{fmtNum(reach)}</b>
              </span>
            )}
            {creator.avgViews != null && (
              <span>
                Avg views <b className="text-ink">{fmtCompact(creator.avgViews)}</b>
              </span>
            )}
            {creator.engagementRatePct != null && (
              <span>
                Engagement <b className="text-ink">{fmtPct(creator.engagementRatePct)}</b>
              </span>
            )}
          </div>

          {gallery.length > 0 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {gallery.map((src, i) => (
                <TalentThumb key={i} src={src} />
              ))}
            </div>
          )}
        </div>
      </div>

      {(pitch || creator.brandAlignment || partnerships.length > 0 || audience.length > 0) && (
        <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ borderTop: "1px solid var(--grid)" }}>
          {(pitch || creator.brandAlignment) && (
            <Block title={clientName ? `Why ${creator.name} for ${clientName}` : "Brand alignment"}>
              {pitch && <p className="text-sm text-ink-2 mb-2">{pitch}</p>}
              {creator.brandAlignment && (
                <p className="text-sm text-ink-2">{creator.brandAlignment}</p>
              )}
            </Block>
          )}

          {partnerships.length > 0 && (
            <Block title="Relevant partnerships">
              <ul className="space-y-1.5 text-sm text-ink-2">
                {partnerships.map((p, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-ink-3">—</span>
                    {p}
                  </li>
                ))}
              </ul>
            </Block>
          )}

          {audience.length > 0 && (
            <Block title="Audience">
              <dl className="space-y-1.5 text-sm">
                {audience.map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <dt className="text-ink-3 w-24 flex-none">{k}</dt>
                    <dd className="text-ink-2">{v}</dd>
                  </div>
                ))}
              </dl>
            </Block>
          )}
        </div>
      )}
    </section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-5">
      <h3
        className="text-xs font-semibold uppercase tracking-wider text-ink-2 pb-2 mb-3"
        style={{ borderBottom: "1px solid var(--grid)" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-4 py-3">
      <div className="text-xs text-ink-3">{label}</div>
      <div className="text-2xl font-bold tabular-nums leading-tight">{value}</div>
    </div>
  );
}
