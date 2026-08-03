import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Deployment diagnostics: reports which pieces of configuration are present
// and whether the database is reachable. Booleans and counts only — never
// values — so it is safe to expose.
export async function GET() {
  const out: Record<string, unknown> = {
    appPasswordSet: !!process.env.APP_PASSWORD,
    authSecretSet: !!process.env.AUTH_SECRET,
    seedAdminEmailSet: !!process.env.SEED_ADMIN_EMAIL,
    resendConfigured: !!process.env.RESEND_API_KEY,
    aiConfigured: !!process.env.ANTHROPIC_API_KEY,
    databaseUrlSet: !!process.env.DATABASE_URL,
  };
  try {
    out.allowlistCount = await prisma.allowedEmail.count();
    out.userCount = await prisma.user.count();
    out.database = "ok";
  } catch (e) {
    out.database = "error";
    // Error class/code only — Prisma messages can contain connection details.
    out.databaseError =
      e && typeof e === "object" && "code" in e
        ? String((e as { code: unknown }).code)
        : e instanceof Error
          ? e.constructor.name
          : "unknown";
  }
  return Response.json(out);
}
