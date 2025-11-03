import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { generateOgSvg } from '../../../lib/og';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') return res.status(400).send('Invalid slug');
  try {
    const item = await prisma.compare.findUnique({ where: { slug } });
    if (!item) return res.status(404).send('Not found');
    const svg = generateOgSvg(item);
    res.setHeader('Content-Type', 'image/svg+xml');
    // cache for a day
    res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
    res.status(200).send(svg);
  } catch (err: any) {
    console.error(err);
    res.status(500).send('Server error');
  }
}
