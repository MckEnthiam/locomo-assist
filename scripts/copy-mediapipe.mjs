import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'node_modules', '@mediapipe', 'pose');
const dest = path.join(root, 'public', 'mediapipe');

if (!fs.existsSync(src)) {
  console.warn('@mediapipe/pose not installed yet, skip mediapipe copy');
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
for (const file of fs.readdirSync(src)) {
  const from = path.join(src, file);
  const to = path.join(dest, file);
  if (fs.statSync(from).isFile()) {
    fs.copyFileSync(from, to);
  }
}
console.log('MediaPipe assets copied to public/mediapipe/');
