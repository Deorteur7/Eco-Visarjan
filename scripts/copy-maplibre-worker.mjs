// Copies MapLibre's web-worker files into client/public so the map can load them
// from our own server (no unpkg, works with a strict Content-Security-Policy).
// Runs automatically after `npm install` and before `npm run dev` / `npm run build`.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'client', 'public');
const FILES = ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'];

try {
  const require = createRequire(path.join(root, 'client', 'package.json'));
  const distDir = path.join(path.dirname(require.resolve('maplibre-gl/package.json')), 'dist');
  mkdirSync(publicDir, { recursive: true });
  for (const file of FILES) {
    const from = path.join(distDir, file);
    if (!existsSync(from)) throw new Error(`${file} not found in ${distDir}`);
    copyFileSync(from, path.join(publicDir, file));
  }
  console.log(`MapLibre worker files copied to client/public (${FILES.join(', ')})`);
} catch (error) {
  console.error(`Could not copy the MapLibre worker files: ${error.message}`);
  console.error('Run "npm install" from the project root first.');
  process.exit(1);
}
