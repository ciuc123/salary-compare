# Headshot Feature — spec and implementation notes

This document describes the "headshot" optional feature: allow users to upload a headshot for Person A and/or Person B, fall back to DiceBear-generated initials avatars, and include uploaded images in OG generation.

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

Implementation roadmap

1) Backend: signed upload URL endpoint
- `POST /api/upload-url`
  - Body: { filename: string, contentType: string }
  - Server validates contentType and filename (simple sanitization) and returns signed upload URL + public URL or key to store in DB.
  - For Supabase: use the Supabase Admin SDK (service role key) to create a signed upload URL or pre-signed PUT.
  - For S3: use AWS SDK `getSignedUrl('putObject', ...)`.

2) Frontend: create form changes
- Add two file inputs (optional) to `pages/index.tsx` for headshotA and headshotB.
- When a user picks a file:
  - Validate size and type client-side.
  - Request a signed URL from `/api/upload-url`.
  - PUT the file to the signed URL.
  - Get the returned public URL or key and include it in the subsequent `/api/create` request as `headshotA` / `headshotB`.
- Provide a preview area that shows DiceBear avatar by default and replaces it with the uploaded preview when available.

3) Backend: accept headshot URL at create time
- Modify `POST /api/create` to accept optional `headshotA` and `headshotB` fields (string). Store them in the DB if provided.
- Ensure the URL is sanitized and/or limited to your storage domain(s) (e.g., supabase bucket domain) to avoid users passing arbitrary external URLs.

4) Compare page: prefer uploaded headshots
- If `headshotA` exists and is accessible, render it in an <img> (with appropriate width/height and object-fit).
- Otherwise, render the DiceBear initials URL.

5) OG generation: include headshots
- When generating OG images server-side (if you implement `/api/og/[slug]`), fetch the headshot images to rasterize them into the generated image.
- If you store OG images (generate-once), embed the headshot into the saved OG.

Supabase example (server-side)

- Install `@supabase/supabase-js` on the server and set `SUPABASE_SERVICE_ROLE_KEY` in server env.
- Example pseudo-code for `/api/upload-url` (server):

```ts
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req, res) {
  const { filename, contentType } = req.body;
  // validate contentType
  const bucket = 'headshots';
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(filename, 60);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ uploadUrl: data.signedUrl, publicUrl: `https://YOUR_SUPABASE_DOMAIN/storage/v1/object/public/${bucket}/${filename}` });
}
```

For direct uploads you may prefer `createSignedUploadUrl` or create a presigned POST policy depending on your provider.

S3 example (server-side)

```ts
import AWS from 'aws-sdk';
const s3 = new AWS.S3({ region: process.env.S3_REGION, credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! } });

export default async function handler(req, res) {
  const { filename, contentType } = req.body;
  const params = { Bucket: process.env.S3_BUCKET!, Key: filename, Expires: 60, ContentType: contentType };
  const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
  const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${encodeURIComponent(filename)}`;
  return res.json({ uploadUrl, publicUrl });
}
```

Client-side notes
- Use `fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })` for the upload.
- Show progress with `fetch` + `ReadableStream` or use XHR for progress events (optional).

Validation & tests
- Tests to add:
  - Unit tests for server-side upload URL generation (mock storage SDKs).
  - Integration test: simulate file selection and ensure the signed URL is returned, the file PUT succeeds (mocked), and `/api/create` accepts the returned publicUrl and stores it in DB.
  - Edge cases: oversized file, invalid mime-type, expired signed URL.

Vercel considerations
- Do not write files to the Next.js server or filesystem. Use storage providers.
- Keep the service-role key secret in server env vars. Use server-only endpoints to sign uploads.

Privacy & moderation
- Consider adding a manual moderation queue or anomaly detection for uploaded images if this becomes popular.
- Strip EXIF (location metadata) from images on upload to protect user privacy.

Rollout plan
- Phase 1 (MVP): DiceBear avatars only, preview on create form (fast, zero infra).
- Phase 2: Optional headshot uploads with Supabase signed-upload flow, store public URL in DB.
- Phase 3: OG generation includes headshots and stored OG images for caching.



