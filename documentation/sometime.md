# Sometime — Headshots, Ads, and Deployment Notes

This single document collects the deferred/occasional features, ad-network notes (Carbon archived), Google AdSense configuration, and a concrete Vercel deployment checklist so you can deploy the current progress now.

Contents
- Headshot feature spec (upload + storage)
- Carbon Ads (archived notes)
- Google AdSense quick integration & config (active)
- Vercel deployment checklist and deploy-now steps

---

## Headshot Feature — spec and implementation notes (archive)

This describes the optional headshot feature: allow users to upload a headshot for Person A and/or Person B, fall back to DiceBear-generated initials avatars, and include uploaded images in OG generation.

Goals
- Let users optionally upload a headshot for Person A / Person B in the create flow.
- Store a secure reference (URL or key) in the `Compare` record so the compare page shows the headshot instead of the DiceBear avatar.
- Use uploaded headshots in OG image generation when available.
- Keep the upload flow scalable and production-ready (use Supabase Storage or S3 presigned uploads).

Design decisions
- Storage: Supabase Storage is recommended for speed of integration and simplicity (also aligns with recommended Vercel setup). S3-compatible storage (min.io / AWS S3) is an alternative.
- Upload pattern: signed uploads (server issues a signed URL); client PUTs file directly to the storage provider.
- DB: add optional `headshotA` and `headshotB` fields to the `Compare` model (string, URL or storage key).
- Validation: maximum file size 3MB, allowed MIME types: image/jpeg, image/png, image/webp. Recompress to webp server-side optionally.
- Security: use service role keys on the server to generate signed URLs. Don't expose secret keys to the client.

Schema changes (Prisma)

Add optional fields to `prisma/schema.prisma`:

model Compare {
  id                       Int     @id @default(autoincrement())
  slug                     String  @unique
  nameA                    String
  nameB                    String
  annualA                  Float
  annualB                  Float
  perSecA                  Float
  perSecB                  Float
  currency                 String  @default("EUR")
  createdAt                DateTime @default(now())
  accumulatedOffsetSeconds Float   @default(0)
  isPaused                 Boolean @default(false)
  headshotA                String? 
  headshotB                String?
}

Implementation roadmap (summary)
- Backend: signed upload URL endpoint `/api/upload-url`
- Frontend: file inputs on create form -> request signed URL -> PUT file -> include returned public URL in `/api/create`
- Store headshot URLs in DB and prefer headshot over DiceBear when rendering
- Use headshots in OG generation when available (fetch and embed)

Supabase/S3 examples and validation notes are documented in the project `documentation/sometimes.md` archive and earlier notes.

---

## Carbon Ads notes (archived)

The project previously included Carbon integration notes. Carbon is a curated ad network and requires a dashboard placement/serve id and approval; those instructions were moved from the repo root into this doc when we pivoted to AdSense. The important points:

- Carbon requires obtaining a placement/serve id from carbonads.net.
- You must inject Carbon's script client-side and provide the expected container markup.
- Ad blockers and domain/approval issues can prevent ads from serving.

(If you want Carbon later, the original snippet and example component exist earlier in repo history and in the archive section.)

---

## Google AdSense — quick integration & config

We're moving to Google AdSense as the active ad integration (simpler approval and broad coverage).

How AdSense works (short)
- Create an AdSense publisher account and verify your site.
- Obtain your publisher id (format `ca-pub-xxxxxxxxxxxxxxxx`).
- Optionally create ad units (slot ids) in AdSense; for responsive auto ads you may only need the publisher id.

What the project includes
- `components/AdSense.tsx` is a client-only React component that:
  - injects the AdSense script tag with `data-ads-client` (publisher id),
  - inserts an `ins.adsbygoogle` element with optional slot id and responsive attributes,
  - calls `(adsbygoogle = window.adsbygoogle || []).push({})` to request ad rendering.

Local dev notes
- AdSense often does not serve real ads on `localhost`. Use a public preview URL (Vercel preview deploy) and add that domain to your AdSense account if necessary.
- For development you can temporarily set the ins attribute `data-adtest="on"` (test mode) to see placeholder ads. Don't leave test mode in production.

Environment variables (recommended)
- NEXT_PUBLIC_ADSENSE_CLIENT — your publisher ID, e.g. `ca-pub-xxxxxxxxxxxxxxxx` (client-visible so component can read it)
- NEXT_PUBLIC_ADSENSE_SLOT — optional slot/ad unit id

Snippet usage (example)
- The component inserts this script in the document head:

```html
<script async data-ads-client="ca-pub-XXXXXXXXXXXX" src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
```

and this block where you want the ad:

```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXX"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
```

Privacy & policy notes
- AdSense enforces strict policy: no incentivized clicks, valid content, no disallowed content.
- Update privacy policy if you enable third-party ads and cookies.

Testing & verification
- Use Vercel preview URLs for testing. After you set `NEXT_PUBLIC_ADSENSE_CLIENT` in Vercel, preview deploy the branch and check the compare page.
- Use the browser console to make sure the script loads and `adsbygoogle` is present.

---

## Vercel deployment checklist (deploy NOW)

This is a concrete checklist to deploy the current project to Vercel now, using a production Postgres (Supabase recommended). Follow the steps below, then I will provide follow up changes and instructions after you commit.

1) Choose a production database
- Supabase (recommended): quick Postgres DB + Storage for headshots (if you later enable uploads).
- Alternative: Neon, Heroku Postgres, PlanetScale (MySQL), or other managed Postgres.

2) Create the database and get `DATABASE_URL`
- For Supabase: create a project and copy the connection string (a Postgres URL).
- Set `DATABASE_URL` in your Vercel project Environment Variables (Production scope).

3) Set required Vercel env vars
- `DATABASE_URL` — Postgres connection string
- `NEXT_PUBLIC_APP_URL` — e.g. `https://your-deploy-url.vercel.app` (used for OG absolute links)
- `NEXT_PUBLIC_ADSENSE_CLIENT` — your AdSense publisher id (e.g., `ca-pub-...`) (optional until you have it)
- `NEXT_PUBLIC_ADSENSE_SLOT` — optional ad unit slot
- If you later add uploads via Supabase:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY` (client) and `SUPABASE_SERVICE_ROLE_KEY` (server-only)

4) Prepare Prisma migrations for production
- Locally: with `DATABASE_URL` set to your production DB, run:

```bash
npx prisma migrate deploy
```

- Alternatively add a CI step that runs migrations on deploy using `npx prisma migrate deploy`.

5) Build and deploy on Vercel
- Connect the repo to Vercel and configure the project.
- Ensure `NODE_VERSION` is set to 20+ if needed.
- Deploy (Vercel will run `npm install` and `npm run build`).

6) Post-deploy checks
- Run migrations if not run automatically (`npx prisma migrate deploy` with production `DATABASE_URL`).
- Visit `/compare/<some-slug>` and confirm the page loads and renders client-side counters.
- Check `/progress` to verify documentation renders.

7) Add AdSense keys in Vercel if you want ads to show
- Add `NEXT_PUBLIC_ADSENSE_CLIENT` and `NEXT_PUBLIC_ADSENSE_SLOT` in Vercel dashboard.
- Redeploy or trigger a new build to ensure those env vars are available to the client.

8) Optional: store OG images and headshots
- If you plan to persist generated OG images or headshots, create a Supabase Storage bucket or S3 bucket and set credentials in Vercel env vars.
- Update `generateOgSvg` workflow to upload generated images and store the public URL in the Compare record.

9) Monitoring and analytics
- Add simple health checks (e.g., `/api/health` returning 200) and add them to uptime monitoring.
- Add an analytics endpoint (e.g., `/api/analytics`) if you want to collect impression counts or time-on-page beacons.

---

## Quick deploy commands (local developer flow)

1. Install deps & generate prisma client (if not done):

```bash
npm install
npx prisma generate
```

2. With production `DATABASE_URL` set locally (or in CI), run:

```bash
npx prisma migrate deploy
npm run build
npm run start
```

3. For Vercel: push branch and open a Preview/Production deploy via Vercel UI. Set env vars in the Vercel dashboard.

---

## After you commit
- Tell me which Desired next action to pick up first (recommended: Ad UX & resilience).
- I'll implement ad-block detection + fallback CTA + impression beacon and add tests, then give a step-by-step Vercel deployment command list and verification steps.

---


