# Vercel notes — deployment, storage, and production recommendations

This file collects Vercel-specific guidance for deploying the Salary Compare app.

Summary / quick decisions
- Local/dev: use SQLite + Prisma (already scaffolded).
- Production on Vercel: don't rely on SQLite file persistence. Use a managed Postgres (Supabase/Neon) or MySQL (PlanetScale). Use `DATABASE_URL` env var to switch Prisma datasource.
- Headshot uploads: use Supabase Storage or S3-compatible storage (not Vercel's ephemeral filesystem). Use signed upload URLs / direct client upload flow.
- DiceBear avatars: use DiceBear HTTP API (no server work required) as a fallback thumbnail when no headshot is uploaded.
- Carbon Ads: inject Carbon's script client-side in a React component. Respect ad policies and consider privacy/GDPR implications.

Environment variables (recommended)
- `DATABASE_URL` — Postgres (production). For dev you can keep SQLite in prisma/schema.prisma; we keep the code environment-driven.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`) — if using Supabase Storage for headshots.
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` — if using S3.
- `NEXT_PUBLIC_CARBON_SERVE` / `NEXT_PUBLIC_CARBON_PLACEMENT` — Carbon snippet identifiers if you want them in the client.

Prisma + DATABASE_URL on Vercel
- For local dev we use `sqlite` in `prisma/schema.prisma`. Before deploying to Vercel:
  1. Provision a Postgres database (Supabase recommended).
  2. Set `DATABASE_URL` in Vercel Environment Variables to the Postgres connection string.
  3. Run migrations against the Postgres DB. Options:
     - Locally: `npx prisma migrate deploy --preview-feature` (with `DATABASE_URL` pointed to production DB)
     - Or run migrations via a CI step (GitHub Actions) that runs `npx prisma migrate deploy` with the production `DATABASE_URL`.

Important: SQLite on Vercel
- Vercel serverless functions are ephemeral. Files written to the filesystem (including SQLite DB files) are not durable and will be lost across function invocations.
- Do not rely on `file:./dev.db` in production.

Headshot upload recommendations
- Approach (recommended): Supabase Storage (easy, integrated with Prisma/Supabase DB). Alternative: S3 with presigned POST/PUT.

Upload flow (client + server)
1. Client selects file in the create form (accept `image/*`, max size 3MB).
2. Client POSTs to an authenticated server endpoint (e.g., `/api/upload-url`) with the desired filename and mime-type.
3. Server verifies the request (rate-limit, file type allowed, size hint) and returns a signed upload URL (Supabase or S3 presigned URL).
4. Client PUTs the file to the signed URL directly (fast, offloads bandwidth to storage provider).
5. After successful upload, client POSTs to `/api/create` including the public storage URL (or a reference key) so the record stores the uploaded headshot URL.

Server-side validation & security
- Validate file type on the server when issuing signed URLs (MIME whitelist: image/jpeg, image/png, image/webp) and size limits.
- If you accept user uploads publicly, consider scanning for malware, strip EXIF data, and/or recompress images server-side.
- Set appropriate CORS on your storage bucket so the client can upload directly.
- If privacy is desired, store private objects and serve them through signed URLs for a limited time.

DB changes (optional)
- Add two new optional fields to `Compare` table: `headshotA String?`, `headshotB String?`.
- When creating a record, allow passing headshot URLs (if provided) and prefer headshot over DiceBear for display.

DiceBear avatars (auto-generated initials)
- DiceBear is perfect for initial avatars (no upload required). Use their HTTP API to generate an avatar by name/seed.
- Example endpoints (v6+ / current version may differ):
  - Initials (SVG): `https://api.dicebear.com/6.x/initials/svg?seed=Alex&backgroundColor=b6e3f4`
  - You can request PNG by using `/png` or render the SVG in an <img> tag.
- Usage notes:
  - DiceBear provides consistent avatars given the same `seed` string (great for shareable slugs).
  - You can customize style, background, and color palette via query params.
  - DiceBear servers are public; using them is free for basic use, but check their terms for commercial/production limits.
- Implementation in the app:
  - In the create form show a live preview using DiceBear URLs for both names.
  - On the compare page, show the uploaded headshot if available, otherwise show the DiceBear URL.

OG images and server-side image generation
- For share cards you want an `og:image` that shows the comparison snapshot (names + per-second values).
- Options:
  1. On-demand generation using `@vercel/og` (Edge function) or Satori + node-canvas. Pros: dynamic; Cons: potential cold-start and memory limits.
  2. Generate once at create time (background job) and store the image in Supabase/S3. Pros: fast delivery and cheap CDN caching.
- Vercel recommendation: Use an edge `GET /api/og/[slug]` for dynamic OG that can generate and then store the generated image in Supabase/S3 for caching.
- Make sure to set appropriate cache headers and to save a persisted copy to avoid regenerating the same image frequently.

Carbon Ads integration
- Add Carbon's script on the client only (React component that inserts the script in `useEffect`) — see `CARBON_README.md`.
- Avoid SSR injection of the ad script; only mount the component on the client to prevent issues during server rendering.
- Auto-refreshing ads: implement by toggling the component `key` every X seconds so the script reinitializes. Keep refresh interval reasonable (e.g., 60–120s).
- Privacy: Carbon may run trackers/requests; add a short note in your privacy policy. Test with ad blockers.
- CSP: If you use a strict CSP, you may need to allow Carbon's domains in `script-src`/`frame-src`.

Other deployment notes
- Next.js settings on Vercel:
  - Node version: use Node 20+ in project settings if you rely on modern features.
  - Set `NEXT_PUBLIC_` env vars for any client-visible keys (Carbon serve id, etc.).
- Migrations on deploy: run `npx prisma migrate deploy` after `DATABASE_URL` is set, either in a build hook or via CI.
- Storage for generated OG images: store in the same storage as headshots (Supabase or S3) and use a CDN.

Testing locally
- Keep SQLite for local testing. You can set `DATABASE_URL=file:./dev.db` locally and use the script `npm run prisma:migrate` to create the DB.
- For upload testing use a local emulator (Supabase provides a local setup) or create a temporary Supabase bucket.

Example minimal env var checklist for Vercel
- DATABASE_URL (required — point to Postgres)
- SUPABASE_URL (optional — for storage)
- SUPABASE_SERVICE_ROLE_KEY (required server-side if generating signed upload URLs securely)
- NEXT_PUBLIC_CARBON_SERVE (optional)

Troubleshooting
- If uploads fail from the browser: check CORS on storage, and confirm signed URL validity/expiration.
- If OG generation is slow: fallback to a pre-generated static image stored in storage and tied to the record.

If you want, I can now:
- Implement DiceBear avatar previews on the create page and include optional upload UI for Person A and B with a server-side `/api/upload-url` that returns signed URLs for Supabase/S3.
- Implement a `components/CarbonAd.tsx` client-only React component and hook it into the compare page.
- Add an `/api/og/[slug]` that uses `@vercel/og` and caches generated images into Supabase.

Specify which of the three you'd like me to implement next and I'll make the changes and update `progress.md` accordingly.

