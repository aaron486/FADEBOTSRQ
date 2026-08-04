"use client";

import { useState } from "react";
import { ContactFields, avatarUrl, initials } from "@/lib/creator-meta";

/**
 * Round profile picture pulled live from the creator's social profile
 * (unavatar.io keyed off their handles); falls back to initials when no
 * handle resolves to an image.
 */
export function CreatorAvatar({
  creator,
  size = 32,
  className = "",
}: {
  creator: ContactFields & { name: string };
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = avatarUrl(creator);
  const style = { width: size, height: size, minWidth: size };

  if (!url || failed) {
    return (
      <div
        className={`rounded-full flex items-center justify-center font-semibold select-none ${className}`}
        style={{
          ...style,
          background: "var(--grid)",
          color: "var(--text-secondary)",
          fontSize: Math.max(10, Math.round(size * 0.38)),
        }}
        aria-hidden
      >
        {initials(creator.name)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${url}?fallback=false&size=${Math.min(400, size * 2)}`}
      alt=""
      loading="lazy"
      onError={() => setFailed(true)}
      className={`rounded-full object-cover ${className}`}
      style={{ ...style, background: "var(--grid)" }}
    />
  );
}
