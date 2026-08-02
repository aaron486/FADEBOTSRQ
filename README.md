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
- **Team access** — magic-link sign-in restricted to an allowlist you manage in Settings
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

1. **Postgres** — create a database (Supabase, Neon, Vercel Postgres, …) and note the connection string.
2. **Resend** — create an account, **verify your sending domain** (e.g. `fade.bet`) under Domains, and create an API key. This one key powers both login magic links and outreach email.
3. **Deploy** the repo to Vercel (or any Node host) with these environment variables:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | your Postgres connection string |
   | `AUTH_SECRET` | `openssl rand -base64 32` |
   | `AUTH_URL` | your deployed URL |
   | `AUTH_TRUST_HOST` | `true` |
   | `RESEND_API_KEY` | from Resend |
   | `EMAIL_FROM` | e.g. `FADE <outreach@fade.bet>` |
   | `SEED_ADMIN_EMAIL` | your email (first allowlisted account) |

   Do **not** set `AUTH_DEV_LOGIN` in production.

4. **Migrate + seed** once against the production database:

   ```bash
   DATABASE_URL=... npm run db:migrate
   DATABASE_URL=... SEED_ADMIN_EMAIL=you@fade.bet npm run db:seed
   ```

5. Sign in with your email, then invite teammates from **Settings**.

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
