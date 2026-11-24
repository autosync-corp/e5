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
assert('no YouTube iframe on first paint', !src.includes('youtube') && !src.includes('heroVideoId') && !banner.includes('<iframe'));
assert('no autoplay hero video', !banner.includes('autoplay=1') && !src.includes('e5-hero-play') && !src.includes('e5-hero-video'));
assert('film lightbox click-to-load', banner.includes('data-film-open') && banner.includes('data-film-modal') && banner.includes('youtube-nocookie.com/embed/') && banner.includes('2zk8Sdi3Yh8') && banner.includes('Escape'));
assert('Hero.vue island removed from homepage', !src.includes('Hero.vue') && src.includes('BannerSlider'));
assert('one H1 remains on the page copy', (src.match(/<h1\b/g) || []).length === 1 && !banner.includes('<h1'));
assert('slider headlines are H2', (banner.match(/<h2\b/g) || []).length === 1 && banner.includes('e5-banner-title'));
assert('BLACK FRIDAY SALE copy', banner.includes('BLACK FRIDAY SALE'));
assert('promo code is exact HTML text', banner.includes('15%OFF@E5'));
assert('shop CTA goes to /shop', banner.includes('SHOP_ROUTE') && banner.includes('SHOP WHEELS'));
assert('gallery CTA goes to /e5-visualizer', banner.includes('INTERACTIVE_GALLERY_ROUTE') && banner.includes('OPEN GALLERY'));
assert('GT.03 CTA goes to series page', banner.includes('WHEELS_GT_03_ROUTE') && banner.includes('IN-STOCK & READY-2-SHIP'));
assert('four slides', banner.includes("stem: 'bf-sale'") && banner.includes("stem: 'viz-01'") && banner.includes("stem: 'gt03-black'") && banner.includes("stem: 'film-poster'"));
assert('film slide sits after GT.03', banner.indexOf("stem: 'gt03-black'") < banner.indexOf("stem: 'film-poster'"));
assert('poster vehicle is a gallery photo', banner.includes('2018-c7-grand-sport-black-with-e5-daytona-bronze-brushed-tint-wheels') && banner.includes('generate-banner-poster.py'));
assert('NOW SHOWING / WATCH THE FILM', banner.includes('NOW SHOWING') && banner.includes('WATCH THE FILM') && banner.includes('FORGED') && banner.includes('ON BLACKTOP'));
assert('credits billing block', banner.includes('E5 WHEELS presents') && banner.includes('a Corvette motion picture'));
assert('Bebas Neue is self-hosted and poster-scoped', fonts.includes("font-family: 'Bebas Neue'") && fonts.includes('/assets/fonts/bebas-neue.woff2') && banner.includes('.e5-banner-slide.is-poster') && banner.includes("font-family: 'Bebas Neue'"));
assert('unaltered E5 wordmark on the poster', banner.includes('E5_LOGO_WHITE') && banner.includes('e5-poster-logo'));
assert('film CTA is a button not a link', banner.includes('data-film-open') && banner.includes('type="button"') && banner.includes('e5-poster-cta'));
assert('visualizer cycle uses real C8 combos', banner.includes('Torch Red') && banner.includes('Daytona Gloss Black') && banner.includes('Arctic White') && banner.includes('Sebring Titanium') && banner.includes('Rapid Blue') && banner.includes('Speedway Chrome') && banner.includes('Bronze Brushed Tint'));
assert('viz extra frames lazy data-srcset', banner.includes('data-viz-cycle') && banner.includes('data-srcset') && banner.includes('vizHoldMs') && banner.includes('3000'));
assert('viz crossfade is 0.9s', banner.includes('opacity 0.9s ease'));
assert('viz caption names the combo', banner.includes('data-viz-caption') && banner.includes('Torch Red · Daytona Gloss Black') && banner.includes('data-combo'));
assert('GT.03 laydown is transparent hi-res overlay', banner.includes('gt03LaydownPicture') && banner.includes('e5-banner-laydown') && !banner.includes('catalog-800/gt03-ab.webp') && !banner.includes('background: #0a0a0a'));
assert('banner copy sits on the right away from LiveChat', banner.includes('align-items: flex-end') && banner.includes('margin-left: auto') && banner.includes('text-align: right') && banner.includes('padding: 36px 18px 140px 56px'));
assert('mobile front-wheel crop', banner.includes('object-position: 50% 68%') && banner.includes('object-position: 62% 70%') && banner.includes('object-position: 42% 58%'));
assert('laydown does not leak into other slides', banner.includes('overflow: hidden') && banner.includes('width: 62%'));
assert('reduced motion freezes viz frames', banner.includes("prefers-reduced-motion: reduce") && banner.includes('.e5-banner-viz-frame'));
assert('LCP preload 800 on mobile', src.includes('href="/assets/images/banner/bf-sale-800.webp"') && src.includes('media="(max-width: 1023px)"'));
assert('LCP preload 1280 on desktop', src.includes('href="/assets/images/banner/bf-sale-1280.webp"') && src.includes('media="(min-width: 1024px)"'));
assert('first slide is eager high priority', banner.includes("eager ? 'high'") && banner.includes("eager ? 'eager' : 'lazy'"));
assert('fixed 1280x720 on banner imgs', banner.includes('width="1280"') && banner.includes('height="720"'));
assert('AVIF and WebP srcset', banner.includes('type="image/avif"') && banner.includes('type="image/webp"'));
assert('arrows dots swipe keyboard autoplay', banner.includes('data-prev') && banner.includes('data-next') && banner.includes('data-dot') && banner.includes('pointerdown') && banner.includes('ArrowLeft') && banner.includes('6000') && banner.includes('prefers-reduced-motion'));
assert('no Vue carousel island', !banner.includes('client:') && !src.includes('client:load'));

const stems = ['bf-sale', 'gt03-black', 'viz-01', 'viz-02', 'viz-03', 'viz-04', 'film-poster'];
const widths = [800, 1280, 1920];
for (const stem of stems) {
  for (const width of widths) {
    assert(`${stem}-${width}.webp`, existsSync(join(root, `public/assets/images/banner/${stem}-${width}.webp`)));
    assert(`${stem}-${width}.avif`, existsSync(join(root, `public/assets/images/banner/${stem}-${width}.avif`)));
  }
}
for (const width of [800, 1200, 1500]) {
  assert(`gt03-laydown-${width}.webp`, existsSync(join(root, `public/assets/images/banner/gt03-laydown-${width}.webp`)));
  assert(`gt03-laydown-${width}.avif`, existsSync(join(root, `public/assets/images/banner/gt03-laydown-${width}.avif`)));
}
assert('bebas-neue.woff2', existsSync(join(root, 'public/assets/fonts/bebas-neue.woff2')));
assert('Bebas Neue OFL', existsSync(join(root, 'public/assets/fonts/OFL-BebasNeue.txt')));
assert('film poster master', existsSync(join(root, 'scripts/assets/film-poster-master.png')));

if (failed) {
  console.error(`${failed} home hero checks failed`);
  process.exit(1);
}
console.log('all home hero checks passed');
