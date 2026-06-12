# Homebase

Personal mission control: every project, task, capture, and shipped commit in one place.

**Stack:** Next.js 16 · Supabase (free tier) · Render (free tier). No other services required.

## Features

- **Today** — what's due now, this week, plus your inbox and last night's ship report
- **Capture** — type or talk (Web Speech API). With `ANTHROPIC_API_KEY` set, Claude files it into the right project and extracts tasks; without it, captures land in the inbox for one-tap filing
- **Projects** — per-project task lists with a "Now / Next" context note so you can resume after weeks away
- **Ship log** — nightly script scans every repo in `Desktop/code` and records what you actually committed
- **Canvas** — upcoming assignments sync into School automatically (daily via Supabase pg_cron)

## Setup

1. `npm install`
2. Fill in `.env.local` (gitignored). Two values need manual steps:
   - `SUPABASE_SERVICE_ROLE_KEY` — Supabase dashboard → Project Settings → API Keys → service_role (secret)
   - `CANVAS_TOKEN` — Canvas → Account → Settings → "+ New Access Token"
3. `npm run dev`

The same env vars (minus `APP_URL`) are set on the Render service for production.

## Auto-standup

`scripts/standup.mjs` runs nightly at 23:45 via Windows Task Scheduler (task name: `Homebase Standup`).
It reads `APP_URL` + `SYNC_SECRET` from `.env.local` and posts today's commits per repo.
Run it manually anytime: `node scripts/standup.mjs`

## Canvas sync

`GET /api/sync/canvas?key=<SYNC_SECRET>` upserts upcoming assignments (idempotent).
Scheduled daily at 6:00 AM Central by Supabase pg_cron → pg_net hitting the Render URL.

## Auth

Single-user password gate (`APP_PASSWORD`) via `proxy.ts`; session is an httpOnly cookie.
Machine endpoints (`/api/sync/*`, `/api/standup`) authenticate with `SYNC_SECRET` instead.
