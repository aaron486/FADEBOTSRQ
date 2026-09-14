"use client";

import { useState } from "react";
import { ContactFields } from "@/lib/creator-meta";
import { CreatorAvatar } from "@/components/creator-avatar";

/**
 * Deck photography. Photo URLs are typed by hand (and Drive links expire), so
 * a dead image must never reach a partner: the portrait falls back to the
 * creator's live social avatar, and a dead gallery shot just disappears.
 */
export function TalentPortrait({
  src,
  creator,
}: {
  src: string | undefined;
  creator: ContactFields & { name: string };
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) return <CreatorAvatar creator={creator} size={120} />;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={creator.name}
      onError={() => setFailed(true)}
      className="w-full max-w-[184px] aspect-[4/5] object-cover rounded-xl"
      style={{ background: "var(--baseline)" }}
    />
  );
}

export function TalentThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className="w-24 h-24 rounded-lg object-cover flex-none"
      style={{ background: "var(--grid)", border: "1px solid var(--edge)" }}
    />
  );
}
