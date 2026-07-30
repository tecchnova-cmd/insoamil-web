// Copies the Vite build output into ../admin (the plain static folder that
// Firebase Hosting actually serves at /admin/). Runs automatically after
// `npm run build` via the postbuild script.
import { cpSync, rmSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const targetDir = join(__dirname, '..', '..', 'admin');

if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true, force: true });
}
mkdirSync(targetDir, { recursive: true });
cpSync(distDir, targetDir, { recursive: true });

console.log(`Copied ${distDir} -> ${targetDir}`);
