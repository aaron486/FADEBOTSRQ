"use client";

import { useState, useTransition } from "react";
import { createCampaign } from "@/lib/actions/campaigns";

export function NewCampaignForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || pending) return;
    setError("");
    startTransition(async () => {
      // createCampaign redirects to the new campaign's page on success
      const res = await createCampaign(name);
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex items-start gap-2">
      <div>
        <input
          className="input w-56"
          placeholder={`e.g. "NFL Kickoff"`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Campaign name"
        />
        {error && (
          <p className="text-xs mt-1" style={{ color: "var(--critical)" }}>{error}</p>
        )}
      </div>
      <button className="btn btn-primary" type="submit" disabled={pending || !name.trim()}>
        {pending ? "Creating…" : "+ New campaign"}
      </button>
    </form>
  );
}
