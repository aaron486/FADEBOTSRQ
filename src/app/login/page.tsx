import { redirect } from "next/navigation";
import { auth, loginRequired } from "@/auth";
import { LoginForm } from "./login-form";
import { FadeWordmark } from "@/components/logo";

export default async function LoginPage() {
  if (!loginRequired) redirect("/");
  const session = await auth();
  if (session?.user) redirect("/");

  const devLoginEnabled =
    process.env.AUTH_DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";
  const passwordLoginEnabled = !!process.env.APP_PASSWORD;
  // Magic links need Resend in production; in dev they log to the console.
  const magicLinkEnabled =
    !!process.env.RESEND_API_KEY || process.env.NODE_ENV !== "production";

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <FadeWordmark className="h-7 w-auto mx-auto mb-1" />
          <div className="text-sm text-ink-3">Creator Tracker</div>
        </div>
        <LoginForm
          devLoginEnabled={devLoginEnabled}
          passwordLoginEnabled={passwordLoginEnabled}
          magicLinkEnabled={magicLinkEnabled}
        />
        <p className="mt-5 text-xs text-ink-3 text-center">
          Access is invite-only. Ask a teammate to add your email in Settings.
        </p>
      </div>
    </main>
  );
}
