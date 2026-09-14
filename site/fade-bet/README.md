# fade.bet — Top Talent page

`toptalent.html` belongs to the **marketing site** (`aaron486/fadewebsitemain`), not to
this app. It is staged here only so it is versioned somewhere; it deploys like every
other fade.bet page (`/media`, `/teamfade`, …) — a static file in `public/` plus a
rewrite in `vercel.json`.

## Install

1. Copy the file into the site repo:

   ```
   cp toptalent.html <fadewebsitemain>/public/toptalent.html
   ```

2. Add these rewrites to `vercel.json`, next to the existing `/media` entry:

   ```json
   { "source": "/toptalent",  "destination": "/toptalent.html" },
   { "source": "/top-talent", "destination": "/toptalent.html" },
   { "source": "/talent",     "destination": "/toptalent.html" }
   ```

3. Commit and push — Vercel builds the site and the page is live at
   `fade.bet/toptalent`.

## Photos

Each talent has a photo slot that falls back to an initials monogram when the file is
missing, so the page never shows a broken image. Drop a portrait (roughly 4:5, JPG)
into the site repo at:

```
public/assets/talent/lil-baby.jpg
public/assets/talent/veeze.jpg
public/assets/talent/42-dugg.jpg
public/assets/talent/terrell-owens.jpg
public/assets/talent/darien-rencher.jpg
public/assets/talent/sincere-rhea.jpg
public/assets/talent/hercy-miller.jpg
```

No code change needed — the filenames are already wired up.

## Relationship to the in-app decks

This page is the **public, one-for-everyone** roster. The tracker also builds
**per-partner private decks** at `/d/[token]` (see `src/app/d/[token]/page.tsx`),
which pull live from the creator database and carry a "why them, for this partner"
pitch. Use this page for the open link; use a deck when pitching a named brand.
