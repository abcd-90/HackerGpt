import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  try {
    const aHash = crypto.createHash('sha256').update(a).digest();
    const bHash = crypto.createHash('sha256').update(b).digest();
    return crypto.timingSafeEqual(aHash, bHash);
  } catch (err) {
    return false;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const authHeader = req.headers['authorization'];
  const password = authHeader ? authHeader.replace('Bearer ', '') : '';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'SamiAdmin@2026';

  if (!safeCompare(password, expectedPassword)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const url = kvUrl.endsWith('/') ? kvUrl.slice(0, -1) : kvUrl;
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(['DEL', 'hackergpt_logs'])
      });
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: 'KV DB Exception: ' + err.message });
    }
  }

  try {
    const isVercel = process.env.VERCEL || process.env.NOW_REGION;
    const logPath = isVercel 
      ? path.join('/tmp', 'queries.json') 
      : path.join(process.cwd(), 'queries.json');

    fs.writeFileSync(logPath, JSON.stringify([]), 'utf8');
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server Exception: ' + err.message });
  }
}
