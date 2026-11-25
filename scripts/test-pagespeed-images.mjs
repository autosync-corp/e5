import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;
function assert(label, ok) {
  if (!ok) {
    failed += 1;
    console.error('fail', label);
  } else {
    console.log('ok  ', label);
  }
}

const index = readFileSync(join(root, 'src/pages/index.astro'), 'utf8');
const layout = readFileSync(join(root, 'src/layouts/MainLayout.astro'), 'utf8');
const shop = readFileSync(join(root, 'src/pages/shop/index.astro'), 'utf8');
const wheels = readFileSync(join(root, 'src/pages/wheels/index.astro'), 'utf8');

assert('homepage uses ResponsiveImg for catalog wheels', index.includes('<ResponsiveImg src={wheel.src}'));
assert('homepage gallery uses ResponsiveImg not CSS background', index.includes('src={VETTE_BLACK_ON_RIVER}') && !index.includes('background-image: url(${VETTE_BLACK_ON_RIVER})'));
assert('homepage CTAs are CtaLink not Vue Button', index.includes('CtaLink') && !index.includes('Button client:'));
assert('homepage LCP banner is eager high priority', index.includes('banner/bf-sale-400.avif') && index.includes('banner/bf-sale-800.avif') && index.includes('fetchpriority="high"'));
assert('nav logo has a 280w lockup', existsSync(join(root, 'public/assets/images/opt/e5-wheels-logo-white-280.webp')));
assert('nav logo has a 560w lockup', existsSync(join(root, 'public/assets/images/opt/e5-wheels-logo-white-560.webp')));
assert('footer is Astro with no client hydrate', layout.includes("Footer.astro") && !layout.includes('<Footer client:'));
assert('shop hydrates when visible not on load', shop.includes('client:visible') && !shop.includes('client:load'));
assert('wheels uses ResponsiveImg', wheels.includes('ResponsiveImg'));
assert('catalog-200 variant exists', existsSync(join(root, 'public/assets/images/catalog-200/daytona-tiu.webp')));
assert('catalog-400 avif exists', existsSync(join(root, 'public/assets/images/catalog-400/daytona-tiu.avif')));
assert('gallery opt variant exists', existsSync(join(root, 'public/assets/images/opt/vette-black-on-river-400.webp')));
assert('logo lossless smaller png exists', existsSync(join(root, 'public/assets/images/opt/form-forged-800.png')));

if (failed) {
  console.error(`${failed} pagespeed image checks failed`);
  process.exit(1);
}
console.log('all pagespeed image checks passed');
