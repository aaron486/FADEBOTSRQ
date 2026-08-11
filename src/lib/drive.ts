// Server-side Google Drive helpers shared by the campaign content library
// and the content studio vault. Uses a plain API key (GOOGLE_API_KEY), which
// can list folders shared "Anyone with the link — Viewer".

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
};

export type DriveListResult =
  | { ok: true; files: DriveFile[]; folders: DriveFile[] }
  | { ok: false; error: string };

/** Turn a Drive API error response into a plain-language fix. */
async function driveErrorMessage(res: Response): Promise<string> {
  let message = "";
  let reasons = "";
  try {
    const body = (await res.json()) as {
      error?: { message?: string; status?: string; errors?: { reason?: string }[] };
    };
    message = body.error?.message ?? "";
    reasons = [body.error?.status ?? "", ...(body.error?.errors?.map((e) => e.reason ?? "") ?? [])]
      .join(" ")
      .toLowerCase();
  } catch {
    // Non-JSON body — fall through to the generic message.
  }
  const all = `${message} ${reasons}`.toLowerCase();

  if (all.includes("api key not valid") || all.includes("api_key_invalid") || all.includes("keyinvalid")) {
    return "Google says the API key isn't valid. In Vercel, check GOOGLE_API_KEY for typos or missing characters — re-copy it from Google Cloud Console → Credentials — then redeploy and sync again.";
  }
  if (all.includes("api key expired")) {
    return "Google says the API key has expired — create a fresh key in Google Cloud Console → Credentials and update GOOGLE_API_KEY in Vercel.";
  }
  if (
    all.includes("accessnotconfigured") ||
    all.includes("service_disabled") ||
    all.includes("has not been used in project") ||
    all.includes("is disabled")
  ) {
    return "The Google Drive API isn't turned on for that key's project. In Google Cloud Console, search “Google Drive API” → Enable, wait 2–3 minutes, then sync again.";
  }
  if (all.includes("blocked") || all.includes("referer") || all.includes("api_key_service_blocked")) {
    return "The API key has restrictions that block the Drive API. In Google Cloud Console → Credentials → your key, set Application restrictions to “None” and API restrictions to allow the Google Drive API.";
  }
  if (res.status === 403 || res.status === 404) {
    return "Google couldn't open that folder. In Drive, set the folder's sharing to “Anyone with the link — Viewer”, then sync again.";
  }
  return message
    ? `Google Drive error: ${message}`
    : `Google Drive error (HTTP ${res.status}) — try again in a minute.`;
}

/** List a Drive folder's direct children (files and subfolders), following pagination. */
export async function listDriveFolder(folderId: string): Promise<DriveListResult> {
  if (!process.env.GOOGLE_API_KEY) {
    return { ok: false, error: "Drive sync isn't configured — add GOOGLE_API_KEY in Vercel env vars first." };
  }
  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  try {
    do {
      const params = new URLSearchParams({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink, modifiedTime)",
        pageSize: "100",
        // Shared-drive folders need these two to list at all.
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
        key: process.env.GOOGLE_API_KEY.trim(),
      });
      if (pageToken) params.set("pageToken", pageToken);
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params}`, { cache: "no-store" });
      if (!res.ok) return { ok: false, error: await driveErrorMessage(res) };
      const data = (await res.json()) as { files?: DriveFile[]; nextPageToken?: string };
      files.push(...(data.files ?? []));
      pageToken = data.nextPageToken;
    } while (pageToken);
  } catch {
    return { ok: false, error: "Couldn't reach Google Drive — check the connection and try again." };
  }
  const isFolder = (f: DriveFile) => f.mimeType === "application/vnd.google-apps.folder";
  return { ok: true, files: files.filter((f) => !isFolder(f)), folders: files.filter(isFolder) };
}
