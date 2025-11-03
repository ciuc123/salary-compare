# Next Actions / Progress

This file was moved from the project root `progress.md`. It tracks all tasks for the "growing salary" viral mechanic project and will be updated after each change.

## Summary of completed work (current progress)

- Project scaffold: Next.js + TypeScript, basic pages and API routes — DONE
- Prisma + SQLite dev setup and migration — DONE
- `POST /api/create` and `GET /api/compare/[slug]` implemented — DONE
- Client-side animated counters on `/compare/[slug]` — DONE (requestAnimationFrame, pause/resume, replay-local)
- Safe slug generator + salary-per-second calculation — DONE
- DiceBear avatar integration + `Avatar` component and previews on the create form — DONE
- OG generation endpoint: `GET /api/og/[slug]` (SVG) — DONE
- Server-side OG meta tags on `/compare/[slug]` (via `getServerSideProps`) — DONE
- Carbon Ad client-only component `components/CarbonAd.tsx` was implemented and is now archived to `documentation/sometimes.md`. The active ad integration has been switched to Google AdSense via `components/AdSense.tsx`.
- Progress page at `/progress` rendering `documentation/next_actions.md` — DONE
- Tests: unit + basic integration tests added (vitest):
  - salary utils, slug generator
  - dicebear url tests
  - client env guard test
  - OG generation + prisma flow
  - SSR getServerSideProps test
  - CarbonAd DOM render test
  All tests passing locally (9 tests at time of last run).

Notes
- Headshot upload feature has been moved out of the active next-actions list and documented in `documentation/sometimes.md` for a later phase.
- SQLite is used for dev. See `VERCEL_NOTES.md` for production DB guidance (use Postgres/Supabase on Vercel).

## What we implemented technically (short list)
- API routes: `pages/api/create.ts`, `pages/api/compare/[slug].ts`, `pages/api/og/[slug].ts`
- Pages: `pages/index.tsx`, `pages/compare/[slug].tsx`, `pages/progress.tsx`
- Libs: `lib/utils.ts`, `lib/og.ts`, `lib/avatar.ts`, `lib/prisma.ts`, `lib/env.ts`
- Components: `components/Avatar.tsx`, `components/AdSense.tsx`
- Tests: `test/*.test.ts` (vitest)

---

## Desired next actions (prioritized)

These are the recommended next items (short-term and medium-term). Pick one to start and I will implement and test it, then update this file.

1) Ad UX & resilience (high priority)
   - [ ] Add ad-block / fallback UX for `AdSense` (show CTA or placeholder when script is blocked or ads are not served).
   - [ ] Implement optional "ad highlight on overtake" behavior (brief visual emphasis on the ad when one counter overtakes the other). Ensure it is non-intrusive and policy-compliant.
   - [ ] Add small analytics ping when ad container mounts/unmounts (to count impressions locally).

2) OG image improvements & caching
   - [ ] Allow `generateOgSvg` to include DiceBear avatars or uploaded headshots when available.
   - [ ] Add optional caching: on first request generate & store OG image in storage (Supabase/S3) and return cached URL subsequently.
   - [ ] Add tests for OG generation with headshot/avatars.

3) Headshot upload (deferred, documented in `documentation/sometimes.md`)
   - [ ] Implement signed-upload endpoint `/api/upload-url` (Supabase or S3) and client flow to PUT files.
   - [ ] Store `headshotA` / `headshotB` on Create and use in the UI + OG.
   - Note: left in `sometimes.md` to keep current sprint simple.

4) Production readiness & infra
   - [ ] Add Prisma environment-driven datasource config (auto switch via `DATABASE_URL`) and document migration steps for Vercel.
   - [ ] Add basic rate-limiting (e.g., IP throttle) for `/api/create` to avoid abuse (simple in-process or use provider add-ons).
   - [ ] Add CI step to run `prisma migrate deploy` on production or document how to run migrations.

5) Polishing & instrumentation
   - [ ] Improve mobile styling and accessibility (a11y) of compare page and form.
   - [ ] Add time-on-page beacon POST `/api/analytics` for simple session length metric.
   - [ ] Add unit/integration tests for API + slug uniqueness.

6) Deploy & monitoring
   - [ ] Prepare Vercel deployment instructions (env vars: DATABASE_URL, SUPABASE keys, NEXT_PUBLIC_CARBON_*), add health check and migrate plan.
   - [ ] Add Sentry/Logflare integration server errors (optional).

---

### Vercel deployment — deploy NOW (detailed)

This is a prescriptive, minimal-safe flow to deploy the current project to Vercel right away and validate it.

1) Provision a production Postgres DB (Supabase recommended)
   - Create a Supabase project (or other Postgres host) and copy the Postgres connection string.

2) Add environment variables in Vercel (Project → Settings → Environment Variables)
   - `DATABASE_URL` = your Postgres connection string (production)
   - `NEXT_PUBLIC_APP_URL` = https://<your-vercel-deploy-url>.vercel.app
   - `NEXT_PUBLIC_ADSENSE_CLIENT` = ca-pub-XXXXXXXXXXXX (optional until you obtain it)
   - `NEXT_PUBLIC_ADSENSE_SLOT` = <your-slot-id> (optional)
   - If using Supabase storage: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (service role only for server)
   - Any other secrets your app needs (do NOT expose server secrets as NEXT_PUBLIC_*)

Notes:
- Put variables in the Production scope (and Preview if you want them available in preview deployments).
- For `NEXT_PUBLIC_APP_URL`, set the final production URL you get from Vercel (you can update it after the first deploy if unsure).

3) Prepare Prisma migrations
   Option A — run migrations locally against the production DB (recommended first-run if you control DB):

```bash
# set DATABASE_URL locally to the production DB or use an env file
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
npx prisma migrate deploy
```

   Option B — run migrations from CI or a one-off job on a machine that has access to the production `DATABASE_URL`:

```bash
# in CI or locally with env configured
npx prisma migrate deploy
```

4) Hook up the repo to Vercel and deploy
   - Import your Git repository into Vercel. Vercel will build on push.
   - Ensure the Build command (`npm run build`) and Output Directory are default for Next.js.
   - Deploy the main branch or create a Preview deployment for verification.

5) Post-deploy verification (smoke tests)
   - Visit: `https://<your-deploy>.vercel.app/progress` — your progress doc should render.
   - Create a comparison via `/` and follow the redirect to `/compare/<slug>` — counters should render and animate client-side.
   - Check server logs in Vercel for any runtime errors (Vercel UI → Functions / Logs).

6) AdSense & ads testing
   - AdSense often needs site verification and is unlikely to show ads on `localhost`. Use a Vercel preview URL and add that site in your AdSense dashboard for testing.
   - Add `NEXT_PUBLIC_ADSENSE_CLIENT` and `NEXT_PUBLIC_ADSENSE_SLOT` to Vercel envs and re-deploy to enable AdSense in the client.

7) Optional: run a quick health check endpoint
   - Create `/api/health` that returns 200 OK. Add a simple uptime monitor if desired.

8) Troubleshooting tips
   - If `npx prisma migrate deploy` errors on Vercel: run it locally (Option A) with the production DATABASE_URL. It's often easier to run migrations from a trusted machine.
   - If the Compare page shows 'Loading...' indefinitely, check that `/api/compare/<slug>` returns 200 on production and that the `dev.db` is not being used (ensure `DATABASE_URL` points to Postgres and not SQLite).
   - Use `vercel logs <deployment-url>` or the Vercel UI logs for function errors.

9) Post-deploy housekeeping
   - After successful deploy and verification, add monitoring (Sentry/Logflare) and set up a migration/backup schedule for your production DB.

---

## How I'm proceeding next
I'll pause here so you can commit the repository changes (I left the working tree with the implemented features and tests). After you commit, tell me which of the Desired next actions you'd like me to implement first and I'll pick it up, implement it, and add tests.

Please commit now and confirm when you're ready for me to continue.
