import fs from 'node:fs';
import path from 'node:path';

const src = path.resolve('src/worker/encode.worker.js');
const destDir = path.resolve('public/dist');
const dest = path.join(destDir, 'encode.worker.js');

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(src, dest);
console.log('Copied worker to', dest);
