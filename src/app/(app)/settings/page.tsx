import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AllowlistManager } from "./allowlist-manager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [session, emails] = await Promise.all([
    auth(),
    prisma.allowedEmail.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-1">Settings</h1>
      <p className="text-sm text-ink-2 mb-4">
        Team access. Only allowlisted emails can sign in — everyone on the list shares the same creator pipeline.
      </p>
      <AllowlistManager
        currentEmail={session?.user?.email ?? ""}
        emails={emails.map((e) => ({
          id: e.id,
          email: e.email,
          addedBy: e.addedBy,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
