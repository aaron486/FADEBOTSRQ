"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import { CampaignStatus } from "@/lib/creator-meta";

function revalidateCampaign(id: string) {
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
}

/** Overall marketing budget (all campaigns, all creators) — stored app-wide. */
export async function setOverallBudget(cents: number | null) {
  await requireUser();
  if (cents == null) {
    await prisma.appSetting.deleteMany({ where: { key: "overallBudgetCents" } });
  } else {
    await prisma.appSetting.upsert({
      where: { key: "overallBudgetCents" },
      create: { key: "overallBudgetCents", value: String(cents) },
      update: { value: String(cents) },
    });
  }
  revalidatePath("/campaigns");
  return { ok: true as const };
}

export async function createCampaign(name: string) {
  await requireUser();
  const trimmed = name.trim();
  if (!trimmed) return { ok: false as const, error: "Give the campaign a name." };
  const campaign = await prisma.campaign.create({ data: { name: trimmed } });
  revalidatePath("/campaigns");
  redirect(`/campaigns/${campaign.id}`);
}

export type CampaignInput = {
  name: string;
  status: CampaignStatus;
  budgetCents: number | null;
  startDate: string | null; // yyyy-mm-dd from <input type="date">
  endDate: string | null;
  notes: string | null;
};

export async function updateCampaign(id: string, input: CampaignInput) {
  await requireUser();
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Give the campaign a name." };
  await prisma.campaign.update({
    where: { id },
    data: {
      name,
      status: input.status,
      budgetCents: input.budgetCents,
      startDate: input.startDate ? new Date(`${input.startDate}T00:00:00Z`) : null,
      endDate: input.endDate ? new Date(`${input.endDate}T00:00:00Z`) : null,
      notes: input.notes?.trim() || null,
    },
  });
  revalidateCampaign(id);
  return { ok: true as const };
}

export async function deleteCampaign(id: string) {
  await requireUser();
  await prisma.campaign.delete({ where: { id } });
  revalidatePath("/campaigns");
  redirect("/campaigns");
}

export async function addCreatorToCampaign(campaignId: string, creatorId: string) {
  const user = await requireUser();
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  await prisma.campaignCreator.upsert({
    where: { campaignId_creatorId: { campaignId, creatorId } },
    create: { campaignId, creatorId },
    update: {},
  });
  await prisma.activity.create({
    data: { creatorId, text: `Added to campaign: ${campaign.name}`, userId: user.id },
  });
  revalidateCampaign(campaignId);
  revalidatePath(`/creators/${creatorId}`);
  return { ok: true as const };
}

export async function removeCreatorFromCampaign(campaignId: string, creatorId: string) {
  const user = await requireUser();
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  await prisma.campaignCreator.deleteMany({ where: { campaignId, creatorId } });
  await prisma.activity.create({
    data: { creatorId, text: `Removed from campaign: ${campaign.name}`, userId: user.id },
  });
  revalidateCampaign(campaignId);
  revalidatePath(`/creators/${creatorId}`);
  return { ok: true as const };
}
