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
- Carbon Ad client-only component `components/CarbonAd.tsx` and integrated into compare page — DONE
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
- Components: `components/Avatar.tsx`, `components/CarbonAd.tsx`
- Tests: `test/*.test.ts` (vitest)

---

## Desired next actions (prioritized)

These are the recommended next items (short-term and medium-term). Pick one to start and I will implement and test it, then update this file.

1) Ad UX & resilience (high priority)
   - [ ] Add ad-block / fallback UX for `CarbonAd` (show CTA or placeholder when script is blocked).
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
   - [ ] Add Sentry/Logflare integration for server errors (optional).

---

## How I'm proceeding next
I'll pause here so you can commit the repository changes (I left the working tree with the implemented features and tests). After you commit, tell me which of the Desired next actions you'd like me to implement first and I'll pick it up, implement it, and add tests.

Please commit now and confirm when you're ready for me to continue.
