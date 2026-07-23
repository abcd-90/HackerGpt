import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  try {
    const filePath = path.join(process.cwd(), 'hackerGPT', 'lws-control-hub.html');
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Admin HTML file not found on server.');
    }
    const html = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  } catch (err) {
    return res.status(500).send('Error loading admin page: ' + err.message);
  }
}
