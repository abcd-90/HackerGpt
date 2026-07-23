import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'hackerGPT', 'lws-control-hub.html');
    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).send('Server Error: ' + err.message);
  }
}
