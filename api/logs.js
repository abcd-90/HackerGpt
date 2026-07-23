import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
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

    let logs = [];
    if (fs.existsSync(logPath)) {
      try {
        const fileContent = fs.readFileSync(logPath, 'utf8');
        logs = JSON.parse(fileContent);
      } catch (err) {
        logs = [];
      }
    }

    return res.status(200).json(logs);
  } catch (err) {
    return res.status(500).json({ error: 'Server Exception: ' + err.message });
  }
}
