import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'src/pages/index.astro'), 'utf8');
const banner = readFileSync(join(root, 'src/core/components/BannerSlider.astro'), 'utf8');
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
assert('homepage Cache-Control s-maxage', vercel.includes('"source": "/"') && vercel.includes('s-maxage=3600') && vercel.includes('stale-while-revalidate=86400'));
assert('font-display swap', fonts.includes('font-display: swap'));
assert('no YouTube hero', !src.includes('youtube') && !src.includes('heroVideoId') && !banner.includes('youtube'));
assert('no hero video play button', !src.includes('e5-hero-play') && !src.includes('e5-hero-video'));
assert('Hero.vue island removed from homepage', !src.includes('Hero.vue') && src.includes('BannerSlider'));
assert('one H1 remains on the page copy', (src.match(/<h1\b/g) || []).length === 1 && !banner.includes('<h1'));
assert('slider headlines are H2', (banner.match(/<h2\b/g) || []).length === 1 && banner.includes('e5-banner-title'));
assert('BLACK FRIDAY SALE copy', banner.includes('BLACK FRIDAY SALE'));
assert('promo code is exact HTML text', banner.includes('15%OFF@E5'));
assert('shop CTA goes to /shop', banner.includes('SHOP_ROUTE') && banner.includes('SHOP WHEELS'));
assert('gallery CTA goes to /e5-visualizer', banner.includes('INTERACTIVE_GALLERY_ROUTE') && banner.includes('OPEN GALLERY'));
assert('GT.03 CTA goes to series page', banner.includes('WHEELS_GT_03_ROUTE') && banner.includes('IN-STOCK & READY-2-SHIP'));
assert('three slides', banner.includes("stem: 'bf-sale'") && banner.includes("stem: 'immersive-gallery'") && banner.includes("stem: 'gt03-black'"));
assert('LCP preload 800 on mobile', src.includes('href="/assets/images/banner/bf-sale-800.webp"') && src.includes('media="(max-width: 1023px)"'));
assert('LCP preload 1280 on desktop', src.includes('href="/assets/images/banner/bf-sale-1280.webp"') && src.includes('media="(min-width: 1024px)"'));
assert('first slide is eager high priority', banner.includes("eager ? 'high'") && banner.includes("eager ? 'eager' : 'lazy'"));
assert('fixed 1280x720 on banner imgs', banner.includes('width="1280"') && banner.includes('height="720"'));
assert('AVIF and WebP srcset', banner.includes('type="image/avif"') && banner.includes('type="image/webp"'));
assert('arrows dots swipe keyboard autoplay', banner.includes('data-prev') && banner.includes('data-next') && banner.includes('data-dot') && banner.includes('pointerdown') && banner.includes('ArrowLeft') && banner.includes('6000') && banner.includes('prefers-reduced-motion'));
assert('no Vue carousel island', !banner.includes('client:') && !src.includes('client:load'));

const stems = ['bf-sale', 'immersive-gallery', 'gt03-black'];
const widths = [800, 1280, 1920];
for (const stem of stems) {
  for (const width of widths) {
    assert(`${stem}-${width}.webp`, existsSync(join(root, `public/assets/images/banner/${stem}-${width}.webp`)));
    assert(`${stem}-${width}.avif`, existsSync(join(root, `public/assets/images/banner/${stem}-${width}.avif`)));
  }
}

if (failed) {
  console.error(`${failed} home hero checks failed`);
  process.exit(1);
}
console.log('all home hero checks passed');
