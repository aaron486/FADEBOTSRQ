# Life Command Center

Your personal command center for operating as a CEO/Founder. Track goals, manage your calendar, monitor KPIs, and stay organized.

## Features

- **Command Center Dashboard** — Bird's-eye view of your goals, tasks, calendar, and key metrics
- **Goals & Vision** — OKR-style goal tracking across Vision/Yearly/Quarterly/Monthly/Weekly timeframes with key results
- **Task Pipeline** — Kanban board with priority levels, energy tagging, and status flow
- **Calendar Integration** — Google Calendar OAuth2 sync with focus block time management
- **KPIs & Metrics** — Track revenue, growth, product, team, and personal metrics with health scoring
- **Daily Reflection** — End-of-day journaling with energy tracking, wins, challenges, and gratitude

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access your command center.

## Google Calendar Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project and enable the **Google Calendar API**
3. Create **OAuth 2.0 credentials** (Web Application type)
4. Set authorized redirect URI to: `http://localhost:3000/api/auth/google/callback`
5. Copy `.env.local.example` to `.env.local` and add your credentials:

```bash
cp .env.local.example .env.local
```

Then fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **Google Calendar API** for calendar sync
- **Local Storage** for data persistence
- **Lucide React** for icons
