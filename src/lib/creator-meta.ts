// Shared metadata + pure helpers used by both server and client components.
// Kept free of Prisma imports so it can ship in the client bundle; the string
// literal types match the Prisma enums exactly.

export type Platform = "INSTAGRAM" | "X" | "TIKTOK" | "YOUTUBE" | "EMAIL";
export type Stage =
  | "TO_CONTACT"
  | "OUTREACH_SENT"
  | "RESPONDED"
  | "CONFIRMED"
  | "CONTRACTED"
  | "POSTED"
  | "DECLINED";
export type ContractStatus = "NONE" | "DRAFTING" | "SENT" | "SIGNED";

export const STAGES: { key: Stage; label: string; colorVar: string }[] = [
  { key: "TO_CONTACT", label: "To contact", colorVar: "var(--stage-1)" },
  { key: "OUTREACH_SENT", label: "Outreach sent", colorVar: "var(--stage-2)" },
  { key: "RESPONDED", label: "Responded", colorVar: "var(--stage-3)" },
  { key: "CONFIRMED", label: "Confirmed", colorVar: "var(--stage-4)" },
  { key: "CONTRACTED", label: "Contracted", colorVar: "var(--stage-5)" },
  { key: "POSTED", label: "Posted", colorVar: "var(--stage-6)" },
  { key: "DECLINED", label: "Declined", colorVar: "var(--stage-declined)" },
];

export const stageIndex = (s: Stage) => STAGES.findIndex((x) => x.key === s);
export const stageMeta = (s: Stage) => STAGES.find((x) => x.key === s) ?? STAGES[0];

export const CONTRACT_STATUSES: { key: ContractStatus; label: string }[] = [
  { key: "NONE", label: "None" },
  { key: "DRAFTING", label: "Drafting" },
  { key: "SENT", label: "Sent" },
  { key: "SIGNED", label: "Signed" },
];

export const PLATFORMS: Record<
  Platform,
  { label: string; short: string; isEmail: boolean; handlePlaceholder: string }
> = {
  INSTAGRAM: { label: "Instagram", short: "IG", isEmail: false, handlePlaceholder: "@handle" },
  X: { label: "X", short: "X", isEmail: false, handlePlaceholder: "@handle" },
  TIKTOK: { label: "TikTok", short: "TT", isEmail: false, handlePlaceholder: "@handle" },
  YOUTUBE: { label: "YouTube", short: "YT", isEmail: false, handlePlaceholder: "@channel" },
  EMAIL: { label: "Email", short: "✉", isEmail: true, handlePlaceholder: "creator@example.com" },
};

/** The contact-channel fields every serialized creator carries. */
export type ContactFields = {
  instagramHandle: string | null;
  xHandle: string | null;
  tiktokHandle: string | null;
  youtubeHandle: string | null;
  email: string | null;
  phone: string | null;
  primaryPlatform: Platform;
};

export type ChannelInfo = { platform: Platform; handle: string };

const stripAt = (h: string) => h.replace(/^@/, "").trim();
const at = (h: string) => `@${stripAt(h)}`;

/** All channels this creator has, social first, in a stable order. */
export function channels(c: ContactFields): ChannelInfo[] {
  const out: ChannelInfo[] = [];
  if (c.instagramHandle?.trim()) out.push({ platform: "INSTAGRAM", handle: at(c.instagramHandle) });
  if (c.xHandle?.trim()) out.push({ platform: "X", handle: at(c.xHandle) });
  if (c.tiktokHandle?.trim()) out.push({ platform: "TIKTOK", handle: at(c.tiktokHandle) });
  if (c.youtubeHandle?.trim()) out.push({ platform: "YOUTUBE", handle: at(c.youtubeHandle) });
  if (c.email?.trim()) out.push({ platform: "EMAIL", handle: c.email.trim() });
  return out;
}

/** The creator's primary channel — falls back to the first one on file. */
export function primaryChannel(c: ContactFields): ChannelInfo | null {
  const all = channels(c);
  return all.find((ch) => ch.platform === c.primaryPlatform) ?? all[0] ?? null;
}

export function contactLabel(c: ContactFields): string {
  return primaryChannel(c)?.handle ?? "—";
}

export function profileUrl(platform: Platform, handle: string): string {
  switch (platform) {
    case "INSTAGRAM":
      return `https://instagram.com/${stripAt(handle)}`;
    case "X":
      return `https://x.com/${stripAt(handle)}`;
    case "TIKTOK":
      return `https://www.tiktok.com/@${stripAt(handle)}`;
    case "YOUTUBE":
      return `https://www.youtube.com/@${stripAt(handle)}`;
    case "EMAIL":
      return `mailto:${handle}`;
  }
}

/** Best-effort deep link toward the DM surface for a channel. */
export function dmUrl(platform: Platform, handle: string): string {
  switch (platform) {
    case "INSTAGRAM":
      return `https://ig.me/m/${stripAt(handle)}`;
    case "X":
      return "https://x.com/messages";
    case "TIKTOK":
      // No public per-user DM deep link — land on the profile.
      return `https://www.tiktok.com/@${stripAt(handle)}`;
    case "YOUTUBE":
      // YouTube has no DMs — land on the channel.
      return `https://www.youtube.com/@${stripAt(handle)}`;
    case "EMAIL":
      return `mailto:${handle}`;
  }
}

export function fillTemplate(text: string, c: { name: string } & ContactFields): string {
  const primary = primaryChannel(c);
  return text
    .replace(/\{name\}/g, c.name || "there")
    .replace(/\{handle\}/g, primary?.handle ?? c.name ?? "")
    .replace(/\{platform\}/g, primary ? PLATFORMS[primary.platform].label : "");
}

export type FollowerFields = {
  instagramFollowers: number | null;
  xFollowers: number | null;
  tiktokFollowers: number | null;
  youtubeFollowers: number | null;
};

export const totalFollowers = (c: FollowerFields): number =>
  (c.instagramFollowers ?? 0) +
  (c.xFollowers ?? 0) +
  (c.tiktokFollowers ?? 0) +
  (c.youtubeFollowers ?? 0);

/** Compact count for tight cells: 21.4M / 48K / 950. */
export const fmtCompact = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1_000)}K`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
};

export const fmtMoneyCents = (cents: number | null | undefined) =>
  cents == null
    ? "—"
    : (cents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
      });

export const fmtNum = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US");

export const fmtDate = (d: Date | string | null | undefined) =>
  !d
    ? "—"
    : new Date(d).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

export const fmtDateTime = (d: Date | string | null | undefined) =>
  !d
    ? "—"
    : new Date(d).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });

/**
 * Live profile picture via unavatar.io, keyed off the creator's handles —
 * no API keys, no stored images. Returns null when there's nothing to key on.
 */
export function avatarUrl(c: ContactFields): string | null {
  const h = (v: string | null) => (v?.trim() ? v.trim().replace(/^@/, "") : null);
  const ig = h(c.instagramHandle);
  if (ig) return `https://unavatar.io/instagram/${ig}`;
  const tt = h(c.tiktokHandle);
  if (tt) return `https://unavatar.io/tiktok/${tt}`;
  const x = h(c.xHandle);
  if (x) return `https://unavatar.io/x/${x}`;
  const yt = h(c.youtubeHandle);
  if (yt) return `https://unavatar.io/youtube/${yt}`;
  if (c.email?.trim()) return `https://unavatar.io/${encodeURIComponent(c.email.trim())}`;
  return null;
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
