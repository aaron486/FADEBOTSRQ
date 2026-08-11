import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut, loginRequired } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { FadeWordmark } from "@/components/logo";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (loginRequired && !session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header
        className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 px-5 py-3"
        style={{ background: "var(--surface-1)", borderBottom: "1px solid var(--edge)" }}
      >
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-baseline gap-2">
            <FadeWordmark className="h-[15px] w-auto" />
            <span className="text-xs text-ink-3">Creator Tracker</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-ink-2">
            <Link href="/" className="hover:text-ink">Dashboard</Link>
            <Link href="/campaigns" className="hover:text-ink">Campaigns</Link>
            <Link href="/content" className="hover:text-ink">Content</Link>
            <Link href="/settings" className="hover:text-ink">Settings</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {session?.user && (
            <>
              <span className="text-xs text-ink-3 hidden sm:inline">{session.user.email}</span>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/login" });
                }}
              >
                <button className="btn btn-ghost btn-sm" type="submit">
                  Sign out
                </button>
              </form>
            </>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-[1280px] p-5">{children}</main>
    </div>
  );
}
