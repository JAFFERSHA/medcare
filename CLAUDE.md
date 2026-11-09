# medcare — project guide for Claude

Medicine reminder & stock tracker. Users log in (mobile OTP or email+password), add medicines with schedules,
mark doses taken/missed, track stock, and get reminders by web push, email and SMS.

- Live: https://medcare-vert.vercel.app (Vercel project `medcare`, auto-deploys on push to `main`)
- Skills: `/implement-ticket`, `/pr-review` (in `.claude/skills/`)

## Stack
- Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind 4
- Prisma 7 with `@prisma/adapter-pg` (`prisma.config.ts`, client in `src/lib/prisma.ts`)
- PostgreSQL — **all tables live in the Postgres schema `medcare`** (`schemas = ["medcare"]`, every model has `@@schema("medcare")`). New models must add `@@schema("medcare")`.
- Auth: own JWT (`jose`) in a cookie — `src/lib/jwt.ts`, `src/lib/auth.ts` (`getCurrentUser()`), route protection in `src/middleware.ts` (public path list + `/api/cron/*` checked with `CRON_SECRET`).
- Notifications: `web-push` (VAPID), email via Gmail/nodemailer + Resend, SMS via Fast2SMS (`src/lib/email.ts`, `resend.ts`, `sms.ts`, `webpush.ts`).
- `mobile/` = separate Expo (React Native) app that calls the same `/api` routes. It has its own `package.json`/`tsconfig.json` and is excluded from the web build.

## Layout
- `src/app/(auth)` login/forgot/reset · `src/app/(main)` dashboard, medicines, history, settings
- `src/app/api/*` — auth, medicines, intake, stock, notifications, user, cron, test
- `src/lib` shared helpers · `src/components` UI · `prisma/schema.prisma`

## Auth & roles
- One role: a logged-in user. JWT payload = `{ userId, mobile? }`.
- Every data route must get the user via `getCurrentUser()` and scope queries by `userId` (users must never see each other's medicines/intakes).
- `/api/cron/*` is public in middleware but **must** check `Authorization: Bearer $CRON_SECRET`.

## Commands & local setup
- Local DB: PostgreSQL on `localhost:5432`, DB `medcare` (pgAdmin "Local PostgreSQL 18"). `.env` points there; production URLs are only in `# CLOUD` comments and `.env.vercel` — **never use them**.
- Dev server: `npx next dev -p 3001`
- Schema change (no migrations folder — this project uses push): edit `prisma/schema.prisma` → `npx prisma db push` (local) → `npx prisma generate`. Production equivalent must be listed for the owner to run.

## Gates
1. `npx tsc --noEmit` — currently clean (must stay 0 errors)
2. `npm run lint` — clean (0 errors; a few warnings). `mobile/` is excluded from lint.
3. `npm run build`
No automated test suite exists.

## Surfaces (check these in an impact sweep)
Dashboard (today's doses), medicines list/detail/add/edit, history, settings (notification prefs), stock + stock history,
API routes, cron jobs (`medicine-reminders` daily 07:00 UTC, `stock-alerts` daily 08:00 UTC via `vercel.json`;
`dose-reminders` every 5 min via GitHub Actions `.github/workflows/dose-reminders.yml`), push/email/SMS messages, the `mobile/` app.

## Smoke flows
Login (email+password) → dashboard shows today's doses → mark a dose taken → stock decreases → history shows it → settings save.

## Gotchas
- Users are in India (IST, UTC+5:30); cron schedules and "today" calculations must account for that.
- Vercel Hobby: `vercel.json` crons must run at most once per day (a 5-minute cron breaks every deploy).
- `src/middleware.ts` uses the deprecated "middleware" convention (Next 16 prefers `proxy`) — works, don't migrate unasked.

- Login/register/OTP/test endpoints are rate-limited via `lib/rate-limit.ts` (table `RateLimit`, Postgres counter, fails open). New public endpoints that cost money or guess secrets should use it.
