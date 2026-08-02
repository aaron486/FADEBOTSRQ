"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function LoginForm({
  devLoginEnabled,
  passwordLoginEnabled,
  magicLinkEnabled,
}: {
  devLoginEnabled: boolean;
  passwordLoginEnabled: boolean;
  magicLinkEnabled: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function passwordLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setStatus("sending");
    setError("");
    const res = await signIn("team-password", { email, password, redirect: false });
    if (res?.error) {
      setStatus("error");
      setError("Sign-in failed — check the password, and that your email is on the allowlist.");
    } else {
      window.location.href = "/";
    }
  }

  async function magicLink() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setStatus("sending");
    setError("");
    const res = await signIn("resend", { email, redirect: false });
    if (res?.error) {
      setStatus("error");
      setError("Could not send the link. Is this email on the allowlist?");
    } else {
      setStatus("sent");
    }
  }

  async function devLogin() {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    setStatus("sending");
    setError("");
    const res = await signIn("dev-login", { email, redirect: false });
    if (res?.error) {
      setStatus("error");
      setError("Dev login failed — email must be on the allowlist.");
    } else {
      window.location.href = "/";
    }
  }

  if (status === "sent") {
    return (
      <div className="text-center text-sm text-ink-2">
        <p className="font-semibold text-ink mb-1">Check your email</p>
        <p>
          We sent a sign-in link to <span className="font-medium">{email}</span>.
        </p>
        <button className="btn btn-ghost mt-4" onClick={() => setStatus("idle")}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={passwordLogin} className="space-y-3">
      <div>
        <label htmlFor="email" className="field-label">
          Work email
        </label>
        <input
          id="email"
          type="email"
          required
          className="input"
          placeholder="you@fade.bet"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {passwordLoginEnabled && (
        <>
          <div>
            <label htmlFor="password" className="field-label">
              Team password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full justify-center"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Signing in…" : "Sign in"}
          </button>
        </>
      )}

      {magicLinkEnabled && (
        <button
          type={passwordLoginEnabled ? "button" : "submit"}
          className={`btn w-full justify-center ${passwordLoginEnabled ? "" : "btn-primary"}`}
          onClick={magicLink}
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending…" : "Email me a sign-in link"}
        </button>
      )}

      {!passwordLoginEnabled && !magicLinkEnabled && !devLoginEnabled && (
        <p className="text-xs text-center" style={{ color: "var(--critical)" }}>
          No sign-in method is configured. Set APP_PASSWORD (team password) or RESEND_API_KEY
          (email links) in the server environment.
        </p>
      )}

      {devLoginEnabled && (
        <button
          type="button"
          className="btn w-full justify-center"
          onClick={devLogin}
          disabled={status === "sending"}
        >
          Dev login (no email)
        </button>
      )}
      {error && (
        <p className="text-xs" style={{ color: "var(--critical)" }}>
          {error}
        </p>
      )}
    </form>
  );
}
