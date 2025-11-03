-- SQL fallback: create Compare table in Postgres if migrations are not available.
-- Run this against your production database carefully (replace schema/database as needed).

CREATE TABLE IF NOT EXISTS "Compare" (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  "nameA" TEXT NOT NULL,
  "nameB" TEXT NOT NULL,
  "annualA" DOUBLE PRECISION NOT NULL,
  "annualB" DOUBLE PRECISION NOT NULL,
  "perSecA" DOUBLE PRECISION NOT NULL,
  "perSecB" DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "accumulatedOffsetSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isPaused" BOOLEAN NOT NULL DEFAULT FALSE
);

-- Note: Prisma migration files are preferred. This SQL is a quick workaround if you need to patch the DB immediately.

