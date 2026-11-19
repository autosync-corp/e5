#!/usr/bin/env node
/**
 * Guards the Safari footer fix: opaque white page canvas, light color-scheme,
 * PNG footer lockup, and a lossless (not VP8+ALPH) sibling WebP.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fail = (msg) => {
  console.error(`FAIL ${msg}`);
  process.exitCode = 1;
};

const layout = fs.readFileSync(path.join(root, 'src/layouts/MainLayout.astro'), 'utf8');
for (const needle of [
  'name="color-scheme" content="light only"',
  'color-scheme: only light',
  'background-color: #ffffff',
]) {
  if (!layout.includes(needle)) fail(`MainLayout missing ${needle}`);
}

const footer = fs.readFileSync(path.join(root, 'src/core/components/Footer.astro'), 'utf8');
if (!footer.includes('E5_LOGO_BLACK_PNG')) fail('Footer must use E5_LOGO_BLACK_PNG');
if (footer.includes('E5_LOGO_BLACK,') || /:src="E5_LOGO_BLACK"/.test(footer)) {
  fail('Footer still points at the WebP constant');
}
if (!footer.includes('minmax(0, 1fr) auto minmax(0, 1fr)')) {
  fail('Footer grid must allow columns to shrink (Safari min-content)');
}
if (!footer.includes('min-width: 0')) fail('Footer logo missing min-width: 0');

const app = fs.readFileSync(path.join(root, 'src/core/constants/App.ts'), 'utf8');
if (!app.includes('e5-wheels-alt-logo-black.png')) fail('App.ts missing PNG constant');

const webp = fs.readFileSync(
  path.join(root, 'public/assets/images/e5-wheels-alt-logo-black.webp')
);
if (webp.subarray(8, 12).toString() !== 'WEBP') fail('logo webp is not a WEBP');
const chunks = [];
for (let off = 12; off + 8 <= webp.length; ) {
  const tag = webp.subarray(off, off + 4).toString('latin1');
  const len = webp.readUInt32LE(off + 4);
  chunks.push(tag);
  off += 8 + len + (len & 1);
}
if (chunks.includes('VP8 ') || chunks.includes('ALPH')) {
  fail(`logo webp is still lossy VP8+ALPH (${chunks.join(',')})`);
}
if (!chunks.includes('VP8L')) fail(`logo webp is not lossless VP8L (${chunks.join(',')})`);

if (process.exitCode) {
  console.error('footer safari fix checks failed');
  process.exit(process.exitCode);
}
console.log('ok footer safari fix', { chunks });
