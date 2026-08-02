"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Platform, PLATFORMS } from "@/lib/creator-meta";
import { createCreator } from "@/lib/actions/creators";

export function NewCreatorForm() {
  const router = useRouter();
  const [platform, setPlatform] = useState<Platform>("INSTAGRAM");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [followers, setFollowers] = useState("");
  const [niche, setNiche] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const isEmail = PLATFORMS[platform].isEmail;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      // createCreator redirects to the new creator's page on success
      const res = await createCreator({
        name,
        platform,
        handle,
        email: isEmail ? null : email || null,
        followers: followers === "" ? null : Number(followers),
        niche: niche || null,
        notes: notes || null,
      });
      if (res && !res.ok) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="field-label" htmlFor="platform">Platform</label>
          <select
            id="platform"
            className="input"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform)}
          >
            {Object.entries(PLATFORMS).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="handle">
            {isEmail ? "Email address" : "Handle"}
          </label>
          <input
            id="handle"
            className="input"
            required
            type={isEmail ? "email" : "text"}
            placeholder={PLATFORMS[platform].handlePlaceholder}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="name">Name</label>
          <input
            id="name"
            className="input"
            placeholder="Creator name (defaults to handle)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {!isEmail && (
          <div>
            <label className="field-label" htmlFor="email">Email (optional)</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="For sending outreach by email too"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        )}
        <div>
          <label className="field-label" htmlFor="followers">Followers</label>
          <input
            id="followers"
            className="input"
            type="number"
            min={0}
            placeholder="e.g. 45000"
            value={followers}
            onChange={(e) => setFollowers(e.target.value)}
          />
        </div>
        <div>
          <label className="field-label" htmlFor="niche">Niche</label>
          <input
            id="niche"
            className="input"
            placeholder="e.g. sports betting, comedy"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          className="input"
          rows={3}
          placeholder="Anything worth remembering"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      {error && <p className="text-xs" style={{ color: "var(--critical)" }}>{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "Adding…" : "Add creator"}
        </button>
      </div>
    </form>
  );
}
