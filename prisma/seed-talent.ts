/**
 * Seeds the "FADE Top Talent" deck and its roster.
 *
 *   npm run db:seed:talent
 *
 * Safe to re-run: creators are matched by name and only fields that are still
 * empty get filled, so anything the team edits in the app wins on the next run.
 *
 * Every figure below comes from public reporting (see the `source` note on each
 * creator) and is a starting point, not a verified stat: confirm handles and
 * follower counts in the app before sending a deck to a partner. Audience
 * demographics, engagement rates and background checks are deliberately left
 * blank — those come from the talent's own insights and from FADE's vetting,
 * and must never be guessed on a page a brand reads.
 */

import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type Seed = {
  name: string;
  profile: Prisma.CreatorCreateInput;
  /** Where the public figures came from, kept with the row for the team. */
  source: string;
  /** Deck-specific "why them, for this partner" line. */
  pitch: string;
  /** Anything the team has to confirm or fill in before the deck goes out. */
  todo: string[];
};

const ROSTER: Seed[] = [
  {
    name: "Lil Baby",
    source: "HypeAuditor (Mar 2026) for IG count; Puma and Fanatics work per public reporting",
    profile: {
      name: "Lil Baby",
      instagramHandle: "lilbaby",
      youtubeHandle: "LilBabyOfficial4PF",
      primaryPlatform: "INSTAGRAM",
      instagramFollowers: 23_000_000,
      niche: "Hip-hop",
      location: "Atlanta, GA",
      tagline: "One of the biggest voices in rap — and a fixture of Atlanta sports culture",
      bio: "Grammy-winning Atlanta rapper whose releases move culture on day one. Courtside, ringside and in the tunnel as often as he is in the booth, with an audience that treats his cosigns as news.",
      pastPartnerships: "Puma — footwear and apparel partnership (reported)\nFanatics — Michael Rubin merchandise giveaway campaign, 2023",
      brandAlignment:
        "Mainstream reach far beyond the betting core, rooted in Atlanta sports fandom. A headline name that makes a roster feel major to a partner before they read a single stat.",
    },
    pitch:
      "The marquee name on the roster. Books out the top of a campaign and gives every other creator on this deck a halo.",
    todo: ["Confirm IG follower count", "Confirm X / TikTok handles", "Management contact + rate"],
  },
  {
    name: "Veeze",
    source: "Wikipedia and Complex profile (Detroit rapper, 'Ganger', Lil Yachty collab)",
    profile: {
      name: "Veeze",
      primaryPlatform: "INSTAGRAM",
      niche: "Hip-hop",
      location: "Detroit, MI",
      tagline: "Detroit's most quotable rapper — the internet's favourite deadpan",
      bio: "One of the most imitated voices out of Detroit, with a deadpan delivery that turns into captions and comment-section language within hours of a release.",
      pastPartnerships: "",
      brandAlignment:
        "Young, extremely online audience that rewards humour over hard sell — a fit for content that reads as a joke first and a bet slip second.",
    },
    pitch:
      "The internet-native pick. His lines get screenshotted, which is exactly how a betting brand gets into a group chat.",
    todo: [
      "CONFIRM THE HANDLE before sending — several accounts claim to be Veeze and I could not verify which is official",
      "Follower counts once the handle is confirmed",
      "Past brand work",
    ],
  },
  {
    name: "42 Dugg",
    profile: {
      name: "42 Dugg",
      instagramHandle: "42_dugggg",
      primaryPlatform: "INSTAGRAM",
      instagramFollowers: 2_000_000,
      niche: "Hip-hop",
      location: "Detroit, MI",
      tagline: "Detroit rap staple with a decade of charting records and a loyal core",
      bio: "Detroit rapper behind a run of platinum records and collaborations across the top of the genre, with a devoted core audience that follows him from release to release.",
      pastPartnerships: "",
      brandAlignment:
        "Deep credibility with a Midwest audience that over-indexes on NFL and NBA fandom — a strong regional anchor next to the national names on this deck.",
    },
    source: "Public IG account @42_dugggg; Wikipedia for career detail",
    pitch:
      "Regional depth. Pairs with the national names to make the roster look intentional rather than shopped.",
    todo: ["Confirm IG follower count", "Confirm X / TikTok handles", "Past brand work"],
  },
  {
    name: "Terrell Owens",
    source: "Public IG (@terrellowens) and X (@terrellowens) accounts; Pro Football Hall of Fame",
    profile: {
      name: "Terrell Owens",
      instagramHandle: "terrellowens",
      xHandle: "terrellowens",
      primaryPlatform: "INSTAGRAM",
      instagramFollowers: 616_000,
      xFollowers: 1_200_000,
      niche: "NFL / sports commentary",
      location: "United States",
      tagline: "Hall of Fame receiver, and still one of the loudest takes in football",
      bio: "Pro Football Hall of Fame wide receiver and one of the most recognisable personalities in the sport, with a take-driven feed that keeps him in NFL conversation every week of the season.",
      pastPartnerships: "",
      brandAlignment:
        "Instant NFL authority. A Hall of Famer talking odds carries a credibility no pure-play creator can buy, and his audience skews squarely into the legal betting demographic.",
    },
    pitch:
      "The credibility play. When the pick comes from a Hall of Famer, the content stops looking like an ad and starts looking like analysis.",
    todo: ["Confirm follower counts", "Confirm whether he has an active TikTok", "Agent contact + rate"],
  },
  {
    name: "Darien Rencher",
    source:
      "Clemson Athletics bio (2016–21, Disney Spirit Award 2020); Famous Birthdays for IG @d_rench",
    profile: {
      name: "Darien Rencher",
      instagramHandle: "d_rench",
      primaryPlatform: "INSTAGRAM",
      instagramFollowers: 110_000,
      niche: "College football media",
      location: "Clemson, SC",
      tagline: "Walk-on turned Clemson leader, now one of college football's best interviewers",
      bio: "Six-year Clemson running back and the program's first Disney Spirit Award winner, known nationally for his role in the player-empowerment movement. Now a media personality whose long-form interviews get college football's biggest names to talk like people instead of press conferences.",
      pastPartnerships: "",
      brandAlignment:
        "The trust pick: a former player with a clean, faith-and-community-forward public record whose audience is deep in college football — the sport with the most under-served betting content.",
    },
    pitch:
      "Owns the college football window. His interview format is the easiest place on this roster to integrate a brand without it feeling like an ad read.",
    todo: ["Confirm IG follower count", "Confirm X / TikTok / YouTube handles", "Direct contact + rate"],
  },
  {
    name: "Sincere Rhea",
    source:
      "Miami Hurricanes track & field roster (110m hurdles); Famous Birthdays for Love Island USA S8 and IG @sincere.rhea",
    profile: {
      name: "Sincere Rhea",
      instagramHandle: "sincere.rhea",
      xHandle: "RheaRheasincere",
      primaryPlatform: "INSTAGRAM",
      instagramFollowers: 600_000,
      niche: "Reality TV / track & field",
      location: "United States",
      tagline: "NCAA All-American hurdler turned Love Island USA breakout",
      bio: "Division I conference champion and NCAA All-American hurdler at Miami, then a Season 8 islander on Love Island USA — an athlete's discipline with a reality-TV audience that showed up fast and stayed.",
      pastPartnerships: "",
      brandAlignment:
        "The reach this roster does not otherwise have: a young, heavily female-skewing entertainment audience, useful for widening a sportsbook's top of funnel past the existing bettor.",
    },
    pitch:
      "Top-of-funnel. Puts the brand in front of an entertainment audience that does not follow betting accounts yet.",
    todo: [
      "Confirm IG follower count",
      "Confirm TikTok handle",
      "Check for exclusivity from the Love Island network before contracting",
    ],
  },
  {
    name: "Hercy Miller",
    source:
      "NIL deal reporting (Yahoo Sports / Sports Illustrated, 2021); Grazia (Confidential Calabasas, 2026) for IG count; public X @hercymiller15",
    profile: {
      name: "Hercy Miller",
      instagramHandle: "hercymiller",
      xHandle: "hercymiller15",
      primaryPlatform: "INSTAGRAM",
      instagramFollowers: 179_000,
      niche: "College basketball / entertainment",
      location: "New Orleans, LA",
      tagline: "College guard, NIL pioneer, and a reality-TV name in his own right",
      bio: "Guard finishing his college career at New Orleans, son of Master P, and the signer of what was reported as the largest NIL deal in the country when the rules changed in 2021. Now also a cast member on reality TV, straddling sport and entertainment.",
      pastPartnerships:
        "Web Apps America — reported $2M NIL brand-ambassador deal, 2021\nConfidential Calabasas — reality series cast member",
      brandAlignment:
        "Understands brand work from the inside — he has been a paid ambassador since college sport allowed it. Sits at the intersection of hoops and entertainment, with family ties that widen reach further.",
    },
    pitch:
      "Basketball plus entertainment in one booking, from someone who has run a major ambassador deal before and knows how compliance works.",
    todo: ["Confirm IG follower count", "Confirm current NIL / ambassador exclusivity", "Contact + rate"],
  },
];

const DECK = {
  name: "FADE Top Talent",
  headline: "FADE top talent",
  intro:
    "The creators and athletes FADE puts in front of a partner first. Music, the NFL, college football, hoops and entertainment — chosen so a campaign can reach the core bettor and the audience just outside it in the same buy.",
  closing:
    "Any of these can be booked as a single activation or a season-long run. FADE handles sourcing, briefs, contracts, content review and reporting end to end.",
  contactName: "Aaron",
  contactEmail: "aaron@fade.bet",
};

async function main() {
  const existingDeck = await prisma.talentDeck.findFirst({ where: { name: DECK.name } });
  const deck = existingDeck ?? (await prisma.talentDeck.create({ data: DECK }));

  const todos: string[] = [];

  for (const [i, seed] of ROSTER.entries()) {
    const existing = await prisma.creator.findFirst({ where: { name: seed.name } });

    let creatorId: string;
    if (existing) {
      // Only fill gaps — never overwrite what the team has already entered.
      const gaps = Object.fromEntries(
        Object.entries(seed.profile).filter(
          ([key, value]) =>
            key !== "name" &&
            value !== "" &&
            existing[key as keyof typeof existing] == null
        )
      );
      if (Object.keys(gaps).length > 0) {
        await prisma.creator.update({ where: { id: existing.id }, data: gaps });
      }
      creatorId = existing.id;
      console.log(`· ${seed.name} — already on file, filled ${Object.keys(gaps).length} empty field(s)`);
    } else {
      const created = await prisma.creator.create({
        data: {
          ...(Object.fromEntries(
            Object.entries(seed.profile).filter(([, v]) => v !== "")
          ) as Prisma.CreatorCreateInput),
          // Public research, not FADE vetting — the team runs the real check.
          backgroundCheck: "NOT_STARTED",
          notes: `Seeded from public sources: ${seed.source}`,
        },
      });
      creatorId = created.id;
      console.log(`+ ${seed.name} — created`);
    }

    await prisma.talentDeckCreator.upsert({
      where: { deckId_creatorId: { deckId: deck.id, creatorId } },
      create: { deckId: deck.id, creatorId, position: i, pitch: seed.pitch },
      update: {},
    });

    todos.push(...seed.todo.map((t) => `  ${seed.name}: ${t}`));
  }

  console.log(`\nDeck ready: /talent (open "${DECK.name}") — share link is /d/${deck.token}\n`);
  console.log("Before you send it, in the app:");
  console.log("  Every creator: photos, audience (age / gender / locations / interests),");
  console.log("  avg views, engagement rate, and the background check — all left blank on purpose.\n");
  console.log("Per creator:");
  console.log(todos.join("\n"));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
