import { prisma } from "@/lib/prisma";
import { TemplatesManager } from "./templates-manager";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const templates = await prisma.template.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-1">Message templates</h1>
      <p className="text-sm text-ink-2 mb-4">
        Reusable outreach drafts. Variables: <code className="text-xs">{"{name}"}</code> creator name,{" "}
        <code className="text-xs">{"{handle}"}</code> @handle or email, <code className="text-xs">{"{platform}"}</code>{" "}
        platform name.
      </p>
      <TemplatesManager
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          platform: t.platform,
          subject: t.subject,
          body: t.body,
        }))}
      />
    </div>
  );
}
