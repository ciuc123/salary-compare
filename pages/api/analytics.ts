import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'ad_analytics.json');

async function ensureDataFile() {
  try {
    await fs.promises.access(DATA_FILE, fs.constants.F_OK);
  } catch (e) {
    await fs.promises.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.promises.writeFile(DATA_FILE, JSON.stringify({ events: [] }, null, 2));
  }
}

async function appendEvent(evt: any) {
  await ensureDataFile();
  const raw = await fs.promises.readFile(DATA_FILE, 'utf8');
  let obj = { events: [] as any[] };
  try {
    obj = JSON.parse(raw);
    if (!Array.isArray(obj.events)) obj.events = [];
  } catch (e) {
    obj = { events: [] };
  }
  obj.events.push(evt);
  // keep only last 200 events to avoid unbounded growth
  if (obj.events.length > 200) obj.events = obj.events.slice(-200);
  await fs.promises.writeFile(DATA_FILE, JSON.stringify(obj, null, 2));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const payload = req.body || {};
      // enrich event
      const evt = {
        ts: new Date().toISOString(),
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || null,
        ua: req.headers['user-agent'] || null,
        ...payload,
      };
      // append to file (best-effort)
      try {
        await appendEvent(evt);
      } catch (e) {
        console.error('analytics append failed', e);
      }
      console.log('[analytics]', evt);
      return res.status(204).end();
    } catch (e) {
      console.error('analytics error', e);
      return res.status(500).json({ error: 'failed' });
    }
  }

  if (req.method === 'GET') {
    // protected summary — require token
    const adminToken = process.env.ANALYTICS_ADMIN_TOKEN;
    const provided = req.headers['x-admin-token'] || req.query?.token;
    if (!adminToken || !provided || provided !== adminToken) {
      return res.status(403).json({ error: 'forbidden' });
    }
    try {
      await ensureDataFile();
      const raw = await fs.promises.readFile(DATA_FILE, 'utf8');
      const obj = JSON.parse(raw || '{"events":[]}');
      const events = Array.isArray(obj.events) ? obj.events : [];
      // produce simple summary
      const summary: Record<string, number> = {};
      for (const e of events) {
        const t = e.type || 'unknown';
        summary[t] = (summary[t] || 0) + 1;
      }
      return res.status(200).json({ summary, latest: events.slice(-50) });
    } catch (e) {
      console.error('analytics read failed', e);
      return res.status(500).json({ error: 'failed' });
    }
  }

  return res.status(405).end();
}
