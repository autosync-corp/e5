import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/pages/index.astro'), 'utf8');
const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
const fonts = readFileSync(join(root, 'src/assets/fonts/fonts.css'), 'utf8');

let failed = 0;
function assert(label, ok) {
  if (!ok) {
    failed += 1;
    console.error('fail', label);
  } else {
    console.log('ok  ', label);
  }
}

assert('homepage is prerendered', src.includes('export const prerender = true'));
assert('mobile LCP poster is 800.webp', src.includes('src="/assets/images/hero-video-poster-800.webp"'));
assert('preload matches 800.webp on mobile', src.includes('href="/assets/images/hero-video-poster-800.webp"') && src.includes('media="(max-width: 1023px)"'));
assert('hero img is eager with fetchpriority', src.includes('fetchpriority="high"') && !/hero-video-poster[\s\S]{0,400}loading="lazy"/.test(src));
assert('explicit 800x450 on LCP img', src.includes('width="800"') && src.includes('height="450"'));
assert('play button exists', src.includes('id="e5-hero-play"') && src.includes('aria-label="Play E5 Wheels video"') && src.includes('<button type="button"'));
assert('no window pointerdown/touchstart for hero', !src.includes("addEventListener('pointerdown'") && !src.includes("addEventListener('touchstart'"));
assert('mobile tap-play uses controls=1', src.includes('autoplay=1&controls=1'));
assert('desktop still mutes and hides controls', src.includes('autoplay=1&mute=1&controls=0'));
assert('font-display swap', fonts.includes('font-display: swap'));
assert('homepage Cache-Control s-maxage', vercel.includes('"source": "/"') && vercel.includes('s-maxage=3600') && vercel.includes('stale-while-revalidate=86400'));

if (failed) {
  console.error(`${failed} home hero checks failed`);
  process.exit(1);
}
console.log('all home hero checks passed');
