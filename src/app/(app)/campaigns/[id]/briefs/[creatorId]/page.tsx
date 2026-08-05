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
