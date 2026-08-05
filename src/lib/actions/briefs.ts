"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";

export type BriefInput = {
  headline: string;
  intro: string;
  deliverables: string;
  talkingPoints: string;
  dos: string;
  donts: string;
  dueDate: string | null; // yyyy-mm-dd
  compensationCents: number | null;
};

const clean = (v: string) => v.trim() || null;

export async function saveBrief(campaignId: string, creatorId: string, input: BriefInput) {
  const user = await requireUser();
  const data = {
    headline: clean(input.headline),
    intro: clean(input.intro),
    deliverables: clean(input.deliverables),
    talkingPoints: clean(input.talkingPoints),
    dos: clean(input.dos),
    donts: clean(input.donts),
    dueDate: input.dueDate ? new Date(`${input.dueDate}T00:00:00Z`) : null,
    compensationCents: input.compensationCents,
  };
  const existing = await prisma.creatorBrief.findUnique({
    where: { campaignId_creatorId: { campaignId, creatorId } },
  });
  if (existing) {
    await prisma.creatorBrief.update({ where: { id: existing.id }, data });
  } else {
    const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
    await prisma.creatorBrief.create({ data: { campaignId, creatorId, ...data } });
    await prisma.activity.create({
      data: { creatorId, text: `Creative brief created for campaign: ${campaign.name}`, userId: user.id },
    });
  }
  revalidatePath(`/campaigns/${campaignId}`);
  revalidatePath(`/campaigns/${campaignId}/briefs/${creatorId}`);
  return { ok: true as const };
}

export async function deleteBrief(campaignId: string, creatorId: string) {
  await requireUser();
  await prisma.creatorBrief.deleteMany({ where: { campaignId, creatorId } });
  revalidatePath(`/campaigns/${campaignId}`);
  redirect(`/campaigns/${campaignId}`);
}
