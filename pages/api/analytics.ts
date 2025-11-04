import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const payload = req.body || {};
    // Simple in-memory log for now - in production push to analytics DB or provider.
    console.log('[analytics]', payload);
    // respond quickly
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: 'failed' });
  }
}

