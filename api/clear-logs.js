import fs from 'fs';
import path from 'path';

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

  if (password !== expectedPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
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
