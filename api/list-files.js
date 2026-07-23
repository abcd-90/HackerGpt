import fs from 'fs';
import path from 'path';

function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (file === 'node_modules' || file === '.git') continue;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, fileList);
    } else {
      fileList.push(path.relative(process.cwd(), name));
    }
  }
  return fileList;
}

export default async function handler(req, res) {
  try {
    const files = getFiles(process.cwd());
    return res.status(200).json({ cwd: process.cwd(), files });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
