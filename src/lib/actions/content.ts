"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";
import { ContentStatus, parseDriveFolderId } from "@/lib/creator-meta";

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

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
};

/**
 * Pull the campaign's Drive folder into ContentItem rows. Uses a plain API
 * key (GOOGLE_API_KEY), which can list folders shared "Anyone with the link".
 */
export async function syncDriveContent(campaignId: string) {
  await requireUser();
  if (!process.env.GOOGLE_API_KEY) {
    return {
      ok: false as const,
      error: "Drive sync isn't configured — add GOOGLE_API_KEY in Vercel env vars first.",
    };
  }
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  if (!campaign.driveFolderId) {
    return { ok: false as const, error: "Link a Drive folder first." };
  }

  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  try {
    do {
      const params = new URLSearchParams({
        q: `'${campaign.driveFolderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink, modifiedTime)",
        pageSize: "100",
        key: process.env.GOOGLE_API_KEY,
      });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        if (res.status === 403 || res.status === 404) {
          return {
            ok: false as const,
            error:
              "Google couldn't open that folder. In Drive, set the folder's sharing to “Anyone with the link — Viewer”, then sync again.",
          };
        }
        return { ok: false as const, error: `Google Drive error (HTTP ${res.status}) — try again in a minute.` };
      }
      const data = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string };
      files.push(...(data.files ?? []));
      pageToken = data.nextPageToken;
    } while (pageToken);
  } catch {
    return { ok: false as const, error: "Couldn't reach Google Drive — check the connection and try again." };
  }

  const uploads = files.filter((f) => f.mimeType !== "application/vnd.google-apps.folder");
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
