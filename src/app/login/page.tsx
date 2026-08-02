import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  const devLoginEnabled =
    process.env.AUTH_DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <div className="text-2xl font-extrabold tracking-[0.14em]">FADE</div>
          <div className="text-sm text-ink-3">Creator Tracker</div>
        </div>
        <LoginForm devLoginEnabled={devLoginEnabled} />
        <p className="mt-5 text-xs text-ink-3 text-center">
          Access is invite-only. Ask a teammate to add your email in Settings.
        </p>
      </div>
    </main>
  );
}
