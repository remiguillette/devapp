import { build } from 'esbuild';
import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const sourceDir = path.join(projectRoot, 'src', 'frontend', 'react');
const outDir = path.join(projectRoot, 'dist', 'web');

async function copyHtml() {
  const src = path.join(sourceDir, 'index.html');
  const dest = path.join(outDir, 'index.html');
  await fs.copyFile(src, dest);
}

async function ensureOutDir() {
  await fs.rm(outDir, { force: true, recursive: true });
  await fs.mkdir(outDir, { recursive: true });
}

async function buildReact() {
  await ensureOutDir();

  await build({
    entryPoints: [path.join(sourceDir, 'index.tsx')],
    bundle: true,
    outfile: path.join(outDir, 'bundle.js'),
    sourcemap: true,
    minify: process.env.NODE_ENV === 'production',
    loader: {
      '.ts': 'ts',
      '.tsx': 'tsx',
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
    },
    jsx: 'automatic',
    target: 'es2020',
  });

  await copyHtml();
}

buildReact().catch((error) => {
  console.error('Failed to build React dashboard', error);
  process.exitCode = 1;
});
