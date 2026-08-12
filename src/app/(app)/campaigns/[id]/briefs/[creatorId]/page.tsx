import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fmtDate } from "@/lib/creator-meta";
import { BriefEditor } from "./brief-editor";

export const dynamic = "force-dynamic";

export default async function BriefEditorPage({
  params,
}: {
  params: Promise<{ id: string; creatorId: string }>;
}) {
  const { id, creatorId } = await params;
  const [campaign, creator, brief] = await Promise.all([
    prisma.campaign.findUnique({ where: { id } }),
    prisma.creator.findUnique({ where: { id: creatorId } }),
    prisma.creatorBrief.findUnique({
      where: { campaignId_creatorId: { campaignId: id, creatorId } },
    }),
  ]);
  if (!campaign || !creator) notFound();

  // Sensible starting point for a fresh brief — everything is editable.
  const defaults = {
    headline: `FADE × ${creator.name} — ${campaign.name}`,
    sourceUrl: "",
    concept: "",
    referenceLinks: "",
    brandSocials: "Instagram: @Fade.bet\nX: @fade__bet\nTikTok: @fadebet",
    productDetails:
      "FADE (fade.bet) is a sports-betting entertainment platform built around one idea: fade the public — bet against what the crowd loves. [Add product specifics: how it works, promos, availability]",
    differentiators:
      "We own the fade-the-public angle — nobody else does\nEntertainment-first, not another odds screen\n[Add 1–2 more]",
    mainGoal: "Brand awareness + signups",
    targetAudience: "Sports fans 21+ who bet casually, love the sweat, and follow sports culture accounts",
    desiredAction: "Tap the [tracking link] in bio / use code [CODE]",
    visualGuidelines: "Natural lighting, shot on phone is fine\nShow the app screen when relevant\nCaptions on for sound-off viewers",
    tone: "Funny, confident, authentic — sports-bar energy, never corporate",
    legalDisclosure: "#ad visible in the caption (not buried)\n21+ only — include \"21+. Gambling problem? Call 1-800-GAMBLER\" where required",
    timeline: "Draft to us by [date]\nFeedback within 48 hours\nFinal posts live by [date]",
    usageRights: "FADE may repost and whitelist this content for 30 days from posting",

    intro:
      `Hey ${creator.name.split(" ")[0]} — welcome to the ${campaign.name} campaign! ` +
      `We're FADE (fade.bet), and this page has everything you need: what to make, ` +
      `what to say, and where to upload it. Ping your FADE contact anytime with questions.`,
    deliverables: "1× Instagram Reel (30–60 seconds)\n2× Instagram Stories with the link sticker",
    talkingPoints:
      "FADE is where you bet against the public — fade the crowd\nKeep it in your own voice; talk to your audience like you always do\nMention the campaign window so followers know it's live now",
    dos: "Post during the campaign window\nTag @fade and use your tracking link\nSend content for approval before posting",
    donts: "No guarantees of winning — keep it fun, not financial advice\nDon't read the talking points like a script\nNo posts targeting under-21 audiences",
    dueDate: campaign.endDate ? campaign.endDate.toISOString().slice(0, 10) : "",
    compensationCents: creator.agreedCostCents,
  };

  return (
    <BriefEditor
      campaignId={campaign.id}
      campaignName={campaign.name}
      campaignWindow={
        campaign.startDate || campaign.endDate
          ? `${campaign.startDate ? fmtDate(campaign.startDate) : "…"} → ${campaign.endDate ? fmtDate(campaign.endDate) : "…"}`
          : null
      }
      creatorId={creator.id}
      creatorName={creator.name}
      hasUploadForm={!!campaign.formUrl}
      aiEnabled={!!process.env.ANTHROPIC_API_KEY}
      brief={
        brief
          ? {
              token: brief.token,
              headline: brief.headline ?? "",
              sourceUrl: brief.sourceUrl ?? "",
              concept: brief.concept ?? "",
              referenceLinks: brief.referenceLinks ?? "",
              brandSocials: brief.brandSocials ?? "",
              productDetails: brief.productDetails ?? "",
              differentiators: brief.differentiators ?? "",
              mainGoal: brief.mainGoal ?? "",
              targetAudience: brief.targetAudience ?? "",
              desiredAction: brief.desiredAction ?? "",
              visualGuidelines: brief.visualGuidelines ?? "",
              tone: brief.tone ?? "",
              legalDisclosure: brief.legalDisclosure ?? "",
              timeline: brief.timeline ?? "",
              usageRights: brief.usageRights ?? "",
              intro: brief.intro ?? "",
              deliverables: brief.deliverables ?? "",
              talkingPoints: brief.talkingPoints ?? "",
              dos: brief.dos ?? "",
              donts: brief.donts ?? "",
              dueDate: brief.dueDate ? brief.dueDate.toISOString().slice(0, 10) : "",
              compensationCents: brief.compensationCents,
              updatedAt: brief.updatedAt.toISOString(),
            }
          : null
      }
      defaults={defaults}
    />
  );
}
