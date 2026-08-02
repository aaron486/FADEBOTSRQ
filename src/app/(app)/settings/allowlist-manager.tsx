"use client";

import { useState, useTransition } from "react";
import { fmtDate } from "@/lib/creator-meta";
import { addAllowedEmail, removeAllowedEmail } from "@/lib/actions/settings";

type Entry = { id: string; email: string; addedBy: string | null; createdAt: string };

export function AllowlistManager({ emails, currentEmail }: { emails: Entry[]; currentEmail: string }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await addAllowedEmail(email);
      if (!res.ok) setError(res.error);
      else setEmail("");
    });
  }

  return (
    <div className="card p-4">
      <form onSubmit={submit} className="flex gap-2 mb-4">
        <input
          className="input flex-1"
          type="email"
          placeholder="teammate@fade.bet"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={pending || !email}>
          {pending ? "Adding…" : "Invite"}
        </button>
      </form>
      {error && <p className="text-xs mb-3" style={{ color: "var(--critical)" }}>{error}</p>}
      <ul>
        {emails.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-3 py-2 text-sm"
            style={{ borderBottom: "1px solid var(--grid)" }}
          >
            <span className="font-medium">{e.email}</span>
            {e.email === currentEmail.toLowerCase() && <span className="chip">you</span>}
            <span className="text-xs text-ink-3 ml-auto">
              added {fmtDate(e.createdAt)}
              {e.addedBy ? ` by ${e.addedBy}` : ""}
            </span>
            {e.email !== currentEmail.toLowerCase() && (
              <button
                className="btn btn-sm btn-ghost"
                style={{ color: "var(--critical)" }}
                disabled={pending}
                title="Remove access"
                onClick={() => {
                  if (confirm(`Remove ${e.email}'s access?`)) {
                    startTransition(() => void removeAllowedEmail(e.id));
                  }
                }}
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
