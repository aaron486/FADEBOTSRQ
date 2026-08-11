"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import { ContentStatus, parseDriveFolderId } from "@/lib/creator-meta";
import { listDriveFolder } from "@/lib/drive";

function revalidateCampaign(id: string) {
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
}

/** Save the campaign's Drive folder + upload form links. */
export async function updateContentLinks(
  campaignId: string,
  input: { driveUrl: string; formUrl: string }
) {
  await requireUser();
  const driveUrl = input.driveUrl.trim();
  const formUrl = input.formUrl.trim();
  const driveFolderId = driveUrl ? parseDriveFolderId(driveUrl) : null;
  if (driveUrl && !driveFolderId) {
    return {
      ok: false as const,
      error: "That doesn't look like a Drive folder link — it should contain /folders/…",
    };
  }
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      driveFolderUrl: driveUrl || null,
      driveFolderId,
      formUrl: formUrl || null,
    },
  });
  revalidateCampaign(campaignId);
  return { ok: true as const };
}

/**
 * Pull the campaign's Drive folder into ContentItem rows. Uses a plain API
 * key (GOOGLE_API_KEY), which can list folders shared "Anyone with the link".
 */
export async function syncDriveContent(campaignId: string) {
  await requireUser();
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  if (!campaign.driveFolderId) {
    return { ok: false as const, error: "Link a Drive folder first." };
  }

  const listed = await listDriveFolder(campaign.driveFolderId);
  if (!listed.ok) return { ok: false as const, error: listed.error };
  const uploads = listed.files;
  let added = 0;
  for (const f of uploads) {
    const existing = await prisma.contentItem.findUnique({
      where: { campaignId_driveFileId: { campaignId, driveFileId: f.id } },
    });
    if (existing) {
      await prisma.contentItem.update({
        where: { id: existing.id },
        data: {
          name: f.name,
          mimeType: f.mimeType,
          url: f.webViewLink ?? existing.url,
          thumbnailUrl: f.thumbnailLink ?? null,
          driveModifiedAt: f.modifiedTime ? new Date(f.modifiedTime) : null,
        },
      });
    } else {
      added += 1;
      await prisma.contentItem.create({
        data: {
          campaignId,
          driveFileId: f.id,
          name: f.name,
          mimeType: f.mimeType,
          url: f.webViewLink ?? `https://drive.google.com/file/d/${f.id}/view`,
          thumbnailUrl: f.thumbnailLink ?? null,
          driveModifiedAt: f.modifiedTime ? new Date(f.modifiedTime) : null,
        },
      });
    }
  }

  revalidateCampaign(campaignId);
  return { ok: true as const, added, total: uploads.length };
}

/** Add a piece of content by hand — any link (Drive file, Dropbox, etc.). */
export async function addContentLink(
  campaignId: string,
  input: { url: string; name: string; creatorId: string | null }
) {
  await requireUser();
  const url = input.url.trim();
  if (!url) return { ok: false as const, error: "Paste a link to the content." };
  await prisma.contentItem.create({
    data: {
      campaignId,
      url,
      name: input.name.trim() || url.replace(/^https?:\/\//, "").slice(0, 60),
      creatorId: input.creatorId,
    },
  });
  revalidateCampaign(campaignId);
  return { ok: true as const };
}

export async function setContentStatus(itemId: string, status: ContentStatus) {
  await requireUser();
  const item = await prisma.contentItem.update({ where: { id: itemId }, data: { status } });
  revalidateCampaign(item.campaignId);
  return { ok: true as const };
}

export async function assignContentCreator(itemId: string, creatorId: string | null) {
  await requireUser();
  const item = await prisma.contentItem.update({ where: { id: itemId }, data: { creatorId } });
  revalidateCampaign(item.campaignId);
  return { ok: true as const };
}

export async function deleteContentItem(itemId: string) {
  await requireUser();
  const item = await prisma.contentItem.delete({ where: { id: itemId } });
  revalidateCampaign(item.campaignId);
  return { ok: true as const };
}
