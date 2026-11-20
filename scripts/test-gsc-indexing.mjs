import { existsSync, readFileSync } from 'node:fs';
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

const mw = readFileSync(join(root, 'src/middleware.ts'), 'utf8');
const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
const astro = readFileSync(join(root, 'astro.config.mjs'), 'utf8');
const robots = readFileSync(join(root, 'public/robots.txt'), 'utf8');
const viz = readFileSync(join(root, 'src/pages/e5-visualizer/index.astro'), 'utf8');
const shop = readFileSync(join(root, 'src/pages/shop/index.astro'), 'utf8');
const product = readFileSync(join(root, 'src/pages/shop/[series]/[finish]/[...fitment].astro'), 'utf8');
const sebring2p = readFileSync(join(root, 'src/pages/wheels/sebring-2p.astro'), 'utf8');

assert('410 for wp-admin junk', mw.includes("'/wp-admin'") && mw.includes('status: 410'));
assert('community and racing 301 to events', mw.includes("'/community': '/events/upcoming'") && vercel.includes('"/community"') && vercel.includes('/events/upcoming'));
assert('search 301 to shop', mw.includes("'/search': '/shop'") && vercel.includes('"/search"'));
assert('pending 301 home', mw.includes("'/pending': '/'"));
assert('registration 301 wheel-registration', mw.includes("'/registration': '/wheel-registration'"));
assert('single-product always redirected', mw.includes("pathname === '/shop/single-product'") && mw.includes("redirect('/shop', 301)"));
assert('shop series maps to wheels', mw.includes('SHOP_SERIES_TO_WHEELS') && mw.includes("daytona: '/wheels/daytona'"));
assert('2P black alias to gloss-black', mw.includes('black: \'gloss-black\'') && sebring2p.includes('/shop/sebring-2p/gloss-black'));
assert('request-quote kept noindex and out of sitemap', astro.includes("'/request-quote'") && readFileSync(join(root, 'src/pages/request-quote/index.astro'), 'utf8').includes('noindex={true}'));
assert('e5-visualizer is indexable and in sitemap', !viz.includes('noindex={true}') && astro.includes('/e5-visualizer') && !astro.includes("'/e5-visualizer'"));
assert('e5-visualizer has SSR H1', viz.includes('<h1>E5 Immersive Gallery</h1>'));
assert('shop listing has SSR H1', shop.includes('<h1') && shop.includes('E5 WHEELS SHOP'));
assert('shop listing has CollectionPage JSON-LD', shop.includes('CollectionPage'));
assert('product pages have SSR H1', product.includes('<h1') && product.includes('ssrHasHeading'));
assert('tag and uncategorized chains collapsed', vercel.includes('"/tag/:path*"') && vercel.includes('"/blog"') && !vercel.includes('"/tag/:path*", "destination": "/category/blog"'));
assert('robots still blocks checkout/admin/api', robots.includes('Disallow: /checkout/') && robots.includes('Disallow: /admin/') && robots.includes('Disallow: /api/'));
assert('robots does not block visualizer', !robots.includes('Disallow: /e5-visualizer') && !robots.includes('Disallow: /visualizer\n') && !robots.includes('Disallow: /visualizer/'));
assert('sitemap does not treat wheel-registration as excluded', astro.includes("'/registration'") && !/page\.includes\('\/registration'\)/.test(astro));
assert('gt shop pages in sitemap', astro.includes('/shop/gt03/brushed-aluminum') && astro.includes('/shop/laguna/brushed-aluminum'));
assert('shop hub is in customPages', astro.includes('`${SITE_URL}/shop`') || astro.includes(`${SITE_URL}/shop`) || astro.includes("'/shop'"));
assert('sitemap filter strips trailing slash', astro.includes('.replace(/\\/+$/, \'\')'));
assert('csv report exists', existsSync(join(root, 'docs/gsc-indexing-fixes.csv')));
assert('wordpress search query redirects at the edge', vercel.includes('"key": "s"') && vercel.includes('"/page/:path*"'));

if (failed) {
  console.error(`${failed} gsc indexing checks failed`);
  process.exit(1);
}
console.log('all gsc indexing checks passed');
