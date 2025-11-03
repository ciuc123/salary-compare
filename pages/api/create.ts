import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';
import { safeSlug, salaryPerSecond } from '../../lib/utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { nameA, nameB, annualA, annualB, currency } = req.body;
  if (!nameA || !nameB || !annualA || !annualB) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const a = Number(annualA);
  const b = Number(annualB);
  if (!isFinite(a) || !isFinite(b) || a <= 0 || b <= 0) {
    return res.status(400).json({ error: 'Invalid salary values' });
  }

  const perSecA = salaryPerSecond(a);
  const perSecB = salaryPerSecond(b);
  const slug = safeSlug(nameA, nameB);

  try {
    const created = await prisma.compare.create({
      data: {
        slug,
        nameA,
        nameB,
        annualA: a,
        annualB: b,
        perSecA,
        perSecB,
        currency: currency || 'EUR',
      },
    });
    return res.status(201).json({ slug: created.slug, url: `/compare/${created.slug}` });
  } catch (err: any) {
    console.error('Create error', err);
    // Prisma error when table doesn't exist in DB
    if (err?.code === 'P2021') {
      return res.status(500).json({
        error: 'Database schema mismatch: required table is missing (P2021). Run your Prisma migrations against the configured DATABASE_URL (e.g. `npx prisma migrate deploy`). See documentation.',
        hint: 'If you just deployed, run `npx prisma migrate deploy` with the production DATABASE_URL, or run `npx prisma migrate dev` locally to generate migrations.'
      });
    }
    return res.status(500).json({ error: 'Failed to create' });
  }
}
