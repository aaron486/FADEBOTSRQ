# Postgame // Executive Dashboard

Personal "Mission Control" for the Strategic Sports Tech Executive at [pstgm.com](https://pstgm.com).

Built with Next.js 14 (App Router), Supabase, Tailwind + shadcn-style primitives, and Anthropic Claude for AI drafting.

## Features

- **Mission Control** — Long-term goals vs weekly sprints, AI milestone breakdown, progress bars.
- **Email Intelligence Hub** — Brain dump + context → executive email draft. 2026 news feed (BIMI, deliverability, AI personalization).
- **Content Idea Vault** — Capture raw NIL/sports-marketing ideas, one-click AI refine into LinkedIn posts / campaign strategy.
- **Calendar & Tasks** — Daily responsibilities panel with priority badges.

## Stack

- Next.js 14 App Router, TypeScript
- Supabase (Postgres + RLS + Auth)
- Tailwind CSS, `lucide-react`, shadcn-style components
- Anthropic Claude (`claude-opus-4-6`) for drafting / refinement
- Vercel-ready

## Getting started

```bash
cp .env.example .env.local
# fill in Supabase + ANTHROPIC_API_KEY
npm install
npm run dev
```

Then run `supabase/schema.sql` in the Supabase SQL editor.

## Aesthetic

Dark-mode "sports-tech" — charcoal base `#0B0B0F`, neon accent `#C7FB4A`, Inter font, ambient grid backdrop.
