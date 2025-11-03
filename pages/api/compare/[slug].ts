import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') return res.status(400).json({ error: 'Invalid slug' });

  try {
    const item = await prisma.compare.findUnique({ where: { slug } });
    if (!item) return res.status(404).json({ error: 'Not found' });
    return res.json(item);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'DB error' });
  }
}

