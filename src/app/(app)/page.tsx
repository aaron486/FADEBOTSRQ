import Link from "next/link";

export const dynamic = "force-dynamic";

// The FADE playbook — voice, rules, and the media plan — as the team's home
// screen. The same text feeds every AI feature via Settings → Brand voice.

const RULES = [
  { title: "Troll first, inform second.", detail: "If a post could've come from ESPN's account, kill it." },
  { title: "Punch at everyone.", detail: "Public figures, fanbases, our own followers, ourselves when we're wrong." },
  { title: "Short and sendable.", detail: "Every post should be something a guy screenshots and texts his group chat with “this is you.”" },
  { title: "We keep receipts.", detail: "When someone's picks are trash, we bring the record." },
];

const FORMATS: { n: number; title: string; tag: string; desc: string }[] = [
  { n: 1, title: "Then vs. Now", tag: "nostalgia meme", desc: "“2006: you and your boy at the park throwing for 600 yards. 2026: your boy's lock of the week just cost you $400.” Built to be sent to one specific friend. Fade fonts and colors so it never reads as a clone." },
  { n: 2, title: "Fade Him", tag: "receipts series", desc: "Running records on public pickers. Lee Corso 0–8? Slap the record on his face with one word: FADE. Weekly during season — GameDay crew, talking heads, celebrity cappers. The most ownable format we have." },
  { n: 3, title: "LOSER", tag: "shock-value graphic", desc: "Clean photo, one brutal word stamped on it. Portnoy launch-video energy. Low effort, high shareability, maximum voice." },
  { n: 4, title: "Bettor Mixtapes", tag: "editorial reel", desc: "The Mattress Mack treatment — 30–45 second hype-video edits of legendary and degenerate bettors. No 10-slide carousels; attention spans are cooked." },
  { n: 5, title: "Lock of the Week", tag: "man on the street", desc: "College kid on the Tuscaloosa strip: “What's your lock this week?” Planned questions designed to produce insane answers. Branded mic flag. The format we sell to DraftKings later." },
  { n: 6, title: "Your Boy's Parlay", tag: "community roast", desc: "Followers submit their worst beats and dumbest parlays; we post the slips and roast them. Turns the audience into content and trains people to tag us when their friend loses." },
  { n: 7, title: "BAD Beats", tag: "reactive series", desc: "The worst beats of the football weekend — backdoor covers, garbage-time TDs, kneel-downs that killed the over. We win on the caption and the edit: “You had this won for 58 minutes.” Monday morning drop." },
  { n: 8, title: "The Group Chat Leak", tag: "meme series", desc: "Group-chat screenshots of the delusional friend — “hammer the under” at 12:58, “never been more sure” every single week. Everybody has this friend. Built for tagging him." },
  { n: 9, title: "Fade of the Week", tag: "creator UGC", desc: "Rotating creators give the one pick they're betting AGAINST and talk trash doing it. Collab-posted so we ride their audience. The format that scales into paid partnerships." },
  { n: 10, title: "Public Money Alert", tag: "smart-money troll", desc: "When 80%+ of the public is on one side: “88% of you are on the Chiefs. Congratulations. You're the reason the line moved.” Showcases exactly what the app does without saying “download our app.”" },
  { n: 11, title: "Career Earnings: Degenerate Edition", tag: "parody graphic", desc: "A regular guy's lifetime betting P&L: “12 years, −$34,200, 1 legendary hit in 2019 he still talks about.” Painfully relatable, evergreen, infinitely remixable per fanbase." },
  { n: 12, title: "P&L Review", tag: "street × Fade Wrapped", desc: "“Up or down all-time?” Everyone says up. Then we pull their Fade Wrapped on camera and review the damage. Nobody can recreate this without Fade — every clip is an organic product demo." },
  { n: 13, title: "Creator Troll", tag: "reaction series", desc: "Reactions to celebrity bettors losing — Portnoy torching six figures, a rapper's parlay dying on the last leg. The LOSER graphic evolved into video, and the most likely to get quote-tweeted by the target. Free reach." },
];

const LINKS = [
  { href: "/creators", title: "Creators", desc: "Outreach, deals, follower tracking" },
  { href: "/campaigns", title: "Campaigns", desc: "Budgets, rosters, creative briefs" },
  { href: "/content", title: "Content", desc: "Concepts, vault, publish pipeline" },
];

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Quick nav */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="card p-4 hover:border-accent transition-colors">
            <div className="font-bold">{l.title} →</div>
            <div className="text-xs text-ink-3 mt-0.5">{l.desc}</div>
          </Link>
        ))}
      </section>

      {/* Voice */}
      <section className="card p-6 mb-4">
        <h1 className="text-2xl font-bold mb-2">What Fade Sounds Like</h1>
        <p className="text-[15px] text-ink-2 leading-relaxed mb-3">
          Fade is the friend who bet against you and won&apos;t let you forget it. Abrasive, funny, zero
          corporate polish. We are not a news outlet and we don&apos;t pretend to be — we&apos;re a
          personality that happens to have an app.
        </p>
        <p className="text-lg font-bold" style={{ color: "var(--accent)" }}>
          We&apos;re fading you. We&apos;re betting against you. You suck.
        </p>
      </section>

      {/* Rules */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {RULES.map((r) => (
          <div key={r.title} className="card p-4">
            <div className="font-semibold text-sm mb-1">{r.title}</div>
            <div className="text-xs text-ink-2">{r.detail}</div>
          </div>
        ))}
      </section>

      {/* Media plan */}
      <section className="mb-2">
        <h2 className="text-xl font-bold mb-1">Media Plan</h2>
        <p className="text-sm text-ink-2 mb-4">
          <b>Instagram is home base</b> (acquired page, 5–10K start). A viral stream of content that brings
          Fade to the conversation around sporting events, betting, prediction markets and social.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FORMATS.map((f) => (
            <div key={f.n} className="card p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="flex-none w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                  style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
                  {f.n}
                </span>
                <span className="font-semibold text-sm">{f.title}</span>
                <span className="chip ml-auto">{f.tag}</span>
              </div>
              <p className="text-xs text-ink-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Collab strategy */}
      <section className="card p-5 mt-4 mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2 pb-2 mb-3" style={{ borderBottom: "1px solid var(--grid)" }}>
          Collab strategy
        </h2>
        <ul className="space-y-1.5 list-disc pl-5 text-sm text-ink-2 marker:text-ink-3">
          <li>
            Every subject-specific post gets collabbed with a page that owns that niche — Brady post with a
            Patriots page, Bama post with Bama pages. <b>Target one collab per day</b>; ~500 followers per
            collab compounds fast. The proven Playmaker/WalterPicks model: niche-page networks, not paid ads.
          </li>
          <li>Ask for the reshare — repost, collab tag, story share, every time.</li>
          <li>Paid collabs with top betting personalities and influencers (SteveWillDoIt, etc).</li>
        </ul>
        <p className="text-xs text-ink-3 mt-3">
          This playbook also powers every ✨ AI draft, concept, and brief — edit it in Settings → Brand voice
          &amp; content plan.
        </p>
      </section>
    </div>
  );
}
