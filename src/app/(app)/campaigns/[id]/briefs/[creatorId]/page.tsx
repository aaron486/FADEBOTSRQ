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
    brandSocials: "",
    productDetails: "",
    differentiators: "",
    mainGoal: "Brand awareness + signups",
    targetAudience: "Sports fans 21+ who bet casually, love the sweat, and follow sports culture accounts",
    desiredAction: "Tap the [tracking link] in bio / use code [CODE]",
    visualGuidelines: "",
    tone: "",
    legalDisclosure: "",
    timeline: "Draft to us by [date]\nFeedback within 48 hours\nFinal posts live by [date]",
    usageRights: "",

    intro:
      `Hey ${creator.name.split(" ")[0]} — welcome to the ${campaign.name} campaign! ` +
      `We're FADE (fade.bet), and this page has everything you need: what to make, ` +
      `what to say, and where to upload it. Ping your FADE contact anytime with questions.`,
    deliverables: "1× Instagram Reel (30–60 seconds)\n2× Instagram Stories with the link sticker",
    talkingPoints:
      "FADE is where you bet against the public — fade the crowd\nKeep it in your own voice; talk to your audience like you always do\nMention the campaign window so followers know it's live now",
    dos: "",
    donts: "",
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
