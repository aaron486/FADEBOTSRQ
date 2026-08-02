# FADE Creator Tracker

An internal dashboard for managing creator partnerships end to end:

**add a creator (Instagram / X / email) → draft personalized outreach → send → track replies → confirm → agree cost → contract → posts & performance.**

## Features

- **Creators by IG handle, X handle, or email** — plus followers, niche, notes
- **Pipeline** — To contact → Outreach sent → Responded → Confirmed → Contracted → Posted (+ Declined), shown as a sortable/filterable **table** or a drag-and-drop **kanban board**
- **Outreach composer** — reusable templates with `{name}` / `{handle}` / `{platform}` variables:
  - **Instagram / X**: generates the DM, copy-to-clipboard, deep link to their DMs, "Mark as sent" logging (IG/X don't allow sending DMs via API)
  - **Email**: actually sends through [Resend](https://resend.com) from your domain and logs the message
- **Deal tracking** — agreed cost, amount paid, contract status (drafting → sent → signed, auto-advances the stage on signing)
- **Post tracking** — post URLs with views/likes, editable as numbers come in
- **KPIs** — committed spend, paid out, awaiting reply, total views, cost per 1k views
- **Activity log** per creator — stage changes, sends, payments, and manual notes, with who did what
- **Team access** — sign-in restricted to an allowlist you manage in Settings, via a shared team password (`APP_PASSWORD`) and/or email magic links (Resend)
- Light/dark theme

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS · Prisma + PostgreSQL · Auth.js (magic-link via Resend) · Resend for outreach email · @dnd-kit for the board.

## Local development

Requirements: Node 20+, PostgreSQL.

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL; leave RESEND_API_KEY empty for dev
npx prisma migrate dev
npm run db:seed        # allowlists SEED_ADMIN_EMAIL + default templates
npm run dev
```

Dev conveniences (no external accounts needed):

- `AUTH_DEV_LOGIN=true` adds a **"Dev login"** button on the sign-in page (allowlisted emails only, disabled in production builds).
- With no `RESEND_API_KEY`, magic links and outreach emails are **printed to the server console** instead of sending, and sends are logged as "simulated".
- `SEED_SAMPLE_DATA=true npm run db:seed` adds three sample creators.

## Deploying to production

Minimum viable deploy (no Resend needed — password sign-in, outreach emails simulated):

1. **Postgres** — create a database (Vercel Storage → Neon is the easiest, it auto-adds `DATABASE_URL`; Supabase/Neon direct also work).
2. **Deploy** the repo to Vercel (or any Node host) with these environment variables:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | your Postgres connection string (auto-added if using Vercel Storage) |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `APP_PASSWORD` | the shared team password |
   | `SEED_ADMIN_EMAIL` | your email (auto-allowlisted on first sign-in) |

   Do **not** set `AUTH_DEV_LOGIN` in production. The build runs `prisma migrate deploy`
   automatically, so the database schema is created on first deploy — no manual step.

3. Sign in with `SEED_ADMIN_EMAIL` + the team password, then invite teammates from **Settings**.

Enabling real email later (login links + actual outreach sending):

1. **Resend** — create an account, create an API key, and **verify your sending domain** (e.g. `fade.bet`) under Domains.
2. Add env vars and redeploy:

   | Variable | Value |
   |---|---|
   | `RESEND_API_KEY` | from Resend |
   | `EMAIL_FROM` | e.g. `FADE <outreach@fade.bet>` (or `FADE <onboarding@resend.dev>` before domain verification — delivers only to your own Resend signup email) |

   The login page gains "Email me a sign-in link" and the composer's **Send email** goes live.
   You can then remove `APP_PASSWORD` if you want email-link sign-in only.

## Project layout

```
prisma/schema.prisma        Data model (creators, templates, messages, posts, activity, auth)
prisma/seed.ts              Allowlist + default templates (+ optional sample data)
src/auth.ts                 Auth.js config: magic link, allowlist gate, dev login
src/lib/email.ts            Resend wrapper (console fallback without an API key)
src/lib/actions/            Server actions: creators, outreach, templates, settings
src/lib/creator-meta.ts     Stages, platforms, template variables, formatters
src/app/(app)/              Dashboard, creator detail, templates, settings (auth-guarded)
src/components/             Dashboard views, kanban, composer
```
