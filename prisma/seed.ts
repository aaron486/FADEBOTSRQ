import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.SEED_ADMIN_EMAIL || "aaron@fade.bet").toLowerCase();

const DEFAULT_TEMPLATES = [
  {
    name: "IG intro DM",
    platform: "INSTAGRAM" as const,
    subject: null,
    body: `Hey {name}! Love your content — especially the recent stuff. I'm with FADE and we're partnering with a small group of creators this month. We'd love to have you on board (paid, of course). Interested in the details?`,
  },
  {
    name: "X intro DM",
    platform: "X" as const,
    subject: null,
    body: `Hey {name} — big fan of your posts. I'm reaching out from FADE about a paid creator partnership. Quick and simple terms, you keep full creative control. Want me to send over the details?`,
  },
  {
    name: "Email intro",
    platform: "EMAIL" as const,
    subject: "FADE x {name} — paid creator partnership",
    body: `Hi {name},

I'm reaching out from FADE. We've been following your content and think you'd be a great fit for a paid partnership we're running this month.

The short version:
- Paid, flat rate agreed up front
- You keep full creative control
- Simple one-page agreement

If you're interested, reply here and I'll send over the details.

Best,
FADE Team`,
  },
  {
    name: "Follow-up (any platform)",
    platform: null,
    subject: "Quick follow-up — FADE partnership",
    body: `Hey {name}, just floating this back to the top of your inbox. Still have a couple of creator slots open this month — would love to get you in. Any interest?`,
  },
];

async function main() {
  // Sign-in allowlist
  await prisma.allowedEmail.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: { email: ADMIN_EMAIL, addedBy: "seed" },
  });
  console.log(`Allowlisted: ${ADMIN_EMAIL}`);

  // Default outreach templates (only if none exist yet)
  const templateCount = await prisma.template.count();
  if (templateCount === 0) {
    await prisma.template.createMany({ data: DEFAULT_TEMPLATES });
    console.log(`Seeded ${DEFAULT_TEMPLATES.length} templates`);
  }

  // Sample creators so the dashboard isn't empty on first run (dev only)
  if (process.env.SEED_SAMPLE_DATA === "true") {
    const count = await prisma.creator.count();
    if (count === 0) {
      await prisma.creator.create({
        data: {
          name: "Jake Parlay",
          platform: "INSTAGRAM",
          handle: "@jakeparlay",
          followers: 48000,
          niche: "Sports betting picks",
          stage: "OUTREACH_SENT",
          notes: "Big engagement on story polls.",
          activities: { create: [{ text: "Creator added" }, { text: "Outreach DM sent on Instagram" }] },
          messages: {
            create: {
              channel: "INSTAGRAM",
              body: "Hey Jake! Love your content…",
              status: "SENT",
              sentAt: new Date(),
            },
          },
        },
      });
      await prisma.creator.create({
        data: {
          name: "Sasha Odds",
          platform: "X",
          handle: "@sashaodds",
          followers: 120000,
          niche: "NFL analysis",
          stage: "CONFIRMED",
          agreedCostCents: 150000,
          activities: { create: [{ text: "Creator added" }, { text: "Confirmed interest" }] },
        },
      });
      await prisma.creator.create({
        data: {
          name: "Miles Green",
          platform: "EMAIL",
          handle: "miles@example.com",
          followers: 30000,
          niche: "Fantasy football newsletter",
          stage: "POSTED",
          agreedCostCents: 80000,
          paidCents: 80000,
          paidAt: new Date(),
          contractStatus: "SIGNED",
          contractSignedAt: new Date(),
          posts: { create: { url: "https://example.com/newsletter/fade-feature", views: 22000, likes: 340 } },
          activities: { create: [{ text: "Creator added" }, { text: "Post added" }] },
        },
      });
      console.log("Seeded 3 sample creators");
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
