// Shared metadata + pure helpers used by both server and client components.
// Kept free of Prisma imports so it can ship in the client bundle; the string
// literal types match the Prisma enums exactly.

export type Platform = "INSTAGRAM" | "X" | "EMAIL";
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
  { label: string; isEmail: boolean; handlePlaceholder: string }
> = {
  INSTAGRAM: { label: "Instagram", isEmail: false, handlePlaceholder: "@handle" },
  X: { label: "X", isEmail: false, handlePlaceholder: "@handle" },
  EMAIL: { label: "Email", isEmail: true, handlePlaceholder: "creator@example.com" },
};

const stripAt = (h: string) => h.replace(/^@/, "").trim();

export function contactLabel(c: { platform: Platform; handle: string }): string {
  return c.platform === "EMAIL" ? c.handle : `@${stripAt(c.handle)}`;
}

export function profileUrl(c: { platform: Platform; handle: string }): string {
  switch (c.platform) {
    case "INSTAGRAM":
      return `https://instagram.com/${stripAt(c.handle)}`;
    case "X":
      return `https://x.com/${stripAt(c.handle)}`;
    case "EMAIL":
      return `mailto:${c.handle}`;
  }
}

/** Best-effort deep link straight to the DM surface. */
export function dmUrl(c: { platform: Platform; handle: string }): string {
  switch (c.platform) {
    case "INSTAGRAM":
      return `https://ig.me/m/${stripAt(c.handle)}`;
    case "X":
      return "https://x.com/messages";
    case "EMAIL":
      return `mailto:${c.handle}`;
  }
}

export function fillTemplate(
  text: string,
  c: { name: string; platform: Platform; handle: string }
): string {
  return text
    .replace(/\{name\}/g, c.name || "there")
    .replace(/\{handle\}/g, contactLabel(c))
    .replace(/\{platform\}/g, PLATFORMS[c.platform].label);
}

/** The email address outreach goes to: the handle itself for EMAIL creators, else the backup email. */
export function outreachEmail(c: { platform: Platform; handle: string; email: string | null }) {
  return c.platform === "EMAIL" ? c.handle : c.email;
}

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
