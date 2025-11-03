# Salary Compare — MVP

Next.js + Prisma (SQLite for dev) boilerplate for the "growing salary" viral mechanic.

Quick start

1. Install dependencies

```bash
npm install
```

2. Generate Prisma client and run migration (dev)

```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. Run the dev server

```bash
npm run dev
```

Vercel deployment notes

- SQLite is OK for local dev but not for production on Vercel. Before deployment, switch `DATABASE_URL` to a Postgres URL (Supabase / Neon / PlanetScale) and run migrations.
- Set `DATABASE_URL` in Vercel environment variables.

Carbon Ads integration

See `CARBON_README.md` for steps to add Carbon Ads to the frontend.

