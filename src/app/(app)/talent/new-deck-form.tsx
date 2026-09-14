"use client";

import { useState, useTransition } from "react";
import { createDeck } from "@/lib/actions/talent";

export function NewDeckForm() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || pending) return;
    setError("");
    startTransition(async () => {
      // createDeck redirects to the new deck's editor on success
      const res = await createDeck(name);
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="flex items-start gap-2">
      <div>
        <input
          className="input w-56"
          placeholder={`e.g. "Top talent — Q1"`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Deck name"
        />
        {error && (
          <p className="text-xs mt-1" style={{ color: "var(--critical)" }}>{error}</p>
        )}
      </div>
      <button className="btn btn-primary" type="submit" disabled={pending || !name.trim()}>
        {pending ? "Creating…" : "+ New deck"}
      </button>
    </form>
  );
}
