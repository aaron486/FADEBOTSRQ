import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/auth";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
  await requireUser();
  const lists = await prisma.creatorList.findMany({
    orderBy: { createdAt: "desc" },
    include: { members: { include: { creator: { select: { email: true } } } } },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-bold">Lists</h1>
        <Link href="/creators" className="btn btn-sm">+ Build a list from Creators</Link>
      </div>
      <p className="text-sm text-ink-2 mb-4">
        Named groups of creators. Open a list to find missing emails and blast personalized outreach to everyone in it.
      </p>

      {lists.length === 0 ? (
        <div className="card p-12 text-center text-ink-2">
          <p className="font-semibold text-ink mb-1">No lists yet.</p>
          <p className="text-sm mb-4">
            Go to Creators, tick the checkboxes next to the ones you want, type a list name, and hit &quot;Save to list.&quot;
          </p>
          <Link href="/creators" className="btn btn-primary">Open Creators</Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {lists.map((l) => {
            const withEmail = l.members.filter((m) => m.creator.email?.trim()).length;
            return (
              <Link key={l.id} href={`/lists/${l.id}`} className="card p-4 hover:bg-accent/5 block">
                <div className="font-semibold mb-1">{l.name}</div>
                <div className="text-xs text-ink-3">
                  {l.members.length} creator{l.members.length === 1 ? "" : "s"} · {withEmail} with email
                  {withEmail < l.members.length ? ` · ${l.members.length - withEmail} missing email` : ""}
                </div>
                <div className="text-xs mt-2" style={{ color: "var(--accent)" }}>Open list →</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
