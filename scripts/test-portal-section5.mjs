import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
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

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const helper = read('src/core/portal/galleries.ts');
const media = read('src/pages/gallery/utils/galleryMedia.ts');
const page = read('src/pages/portal/galleries.astro');
const api = read('src/pages/portal/api/galleries.ts');
const publicDetail = read('src/pages/gallery/[id].astro');
const publicIndex = read('src/pages/gallery/vehicles/index.astro');
const grid = read('src/pages/gallery/components/_GalleryVehiclesGrid.vue');
const selector = read('src/pages/gallery/components/_YearMakeModelSelector.vue');
const sitemap = read('src/pages/sitemap-galleries.xml.ts');
const sections = read('src/core/portal/sections.ts');
const docs = read('docs/PORTAL.md');
const robots = read('public/robots.txt');
const vercel = read('vercel.json');
const section1 = read('scripts/test-portal-section1.mjs');

const KNOWN_SLUG = '2025-c8-stingray-blue-sebring-gloss-black';

assert('galleries section is ready', /slug: 'galleries'[\s\S]*?ready: true/.test(sections));
assert('dedicated galleries editor', existsSync(join(root, 'src/pages/portal/galleries.astro')) && page.includes('Galleries') && page.includes('data-save') && page.includes('Hidden'));
assert('no uploads or AutoSync writes', !page.includes('data-upload') && !page.includes('type="file"') && !helper.includes('method: \'POST\'') && !helper.includes('method: \'PUT\''));
assert('redis key is e5:portal:galleries', helper.includes("GALLERIES_REDIS_KEY = 'e5:portal:galleries'"));
assert('autosync fetch is cached and falls back', helper.includes('api.autosyncstudio.com/galleries') && helper.includes('GALLERY_CACHE_MS') && helper.includes('staticCatalog') && helper.includes('logGalleryFailure'));
assert('unique year and part-number matching', helper.includes('pickUniqueStatic') && helper.includes('pnHit') && helper.includes('g-${gallery.Id}'));
assert('public pages are SSR', publicDetail.includes('prerender = false') && publicIndex.includes('prerender = false') && !publicDetail.includes('getStaticPaths'));
assert('public pages use live catalog', publicDetail.includes('loadGalleryBySlug') && publicIndex.includes('loadPublicGalleries') && grid.includes('defineProps') && selector.includes('defineProps'));
assert('vue grid is not hardcoded static data', !grid.includes('corvetteGalleryData') && !selector.includes('corvetteGalleryData'));
assert('media helper keeps absolute urls', media.includes('isAbsoluteUrl') && media.includes('galleryCoverUrl') && publicDetail.includes('galleryMediaItems'));
assert('auth on portal galleries API', api.includes('requirePortalSession') && api.includes('requireSameOrigin'));
assert('sitemap-galleries is SSR', sitemap.includes('loadPublicGalleries') && sitemap.includes('s-maxage=60') && robots.includes('sitemap-galleries.xml') && vercel.includes('/sitemap-galleries.xml'));
assert('docs describe section 5', docs.includes('Section 5') && docs.includes('e5:portal:galleries') && docs.includes('PUBLIC_AUTOSYNC_API_KEY') && docs.includes('g-<id>'));
assert('editor copy is plain language', page.includes('Photos stay on AutoSync') && !page.includes('Upstash') && !page.includes('Redis'));
assert('section 1 live galleries check moved off coming soon', section1.includes('galleries editor loads') && !section1.includes('section placeholder coming soon'));

const password = 'portal-test-pass';
const N = 16384;
const r = 8;
const p = 1;
const keylen = 32;
const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, keylen, { N, r, p });
const hash = `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
const secret = 'portal-test-session-secret-32bytes!!';
const PORT = process.env.PORTAL_GALLERIES_TEST_PORT || '8785';
const BASE = `http://127.0.0.1:${PORT}`;

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`astro did not start\n${buf}`)), 120000);
    let buf = '';
    const onData = (chunk) => {
      buf += chunk.toString();
      if (buf.includes(`127.0.0.1:${PORT}`) && /ready in/i.test(buf)) {
        clearTimeout(timer);
        child.stdout?.off('data', onData);
        child.stderr?.off('data', onData);
        resolve();
      }
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', onData);
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code) {
        clearTimeout(timer);
        reject(new Error(`astro exited ${code}\n${buf}`));
      }
    });
  });
}

const child = spawn(process.execPath, [join(root, 'node_modules/astro/bin/astro.mjs'), 'dev', '--host', '127.0.0.1', '--port', PORT], {
  cwd: root,
  env: {
    ...process.env,
    PORTAL_PASSWORD_HASH: hash,
    PORTAL_SESSION_SECRET: secret,
    BROWSER: 'none',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(child);
  const origin = BASE;

  const listing = await fetch(`${BASE}/gallery/vehicles`);
  const listingHtml = await listing.text();
  assert(
    'public listing loads live galleries',
    listing.status === 200 &&
      listingHtml.includes('Corvette Gallery') &&
      listingHtml.includes(KNOWN_SLUG) &&
      listingHtml.includes('/gallery/'),
  );

  const detail = await fetch(`${BASE}/gallery/${KNOWN_SLUG}`);
  const detailHtml = await detail.text();
  assert(
    'existing gallery slug still 200',
    detail.status === 200 &&
      detailHtml.includes('Gallery - E5 Wheels') &&
      detailHtml.includes('BACK TO GALLERY') &&
      !detailHtml.includes('Not found'),
  );

  const missing = await fetch(`${BASE}/gallery/this-slug-does-not-exist`);
  assert('unknown gallery slug 404s', missing.status === 404);

  const sitemapRes = await fetch(`${BASE}/sitemap-galleries.xml`);
  const sitemapXml = await sitemapRes.text();
  assert(
    'sitemap lists vehicles and known slug',
    sitemapRes.status === 200 &&
      sitemapXml.includes('/gallery/vehicles') &&
      sitemapXml.includes(`/gallery/${KNOWN_SLUG}`),
  );
  assert('sitemap-galleries is cacheable for a minute', (sitemapRes.headers.get('cache-control') || '').includes('s-maxage=60'));

  const unauthGet = await fetch(`${BASE}/portal/api/galleries`);
  assert('portal galleries GET is 401 logged out', unauthGet.status === 401);

  const unauthPut = await fetch(`${BASE}/portal/api/galleries`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ items: [{ id: KNOWN_SLUG, hidden: true }] }),
  });
  assert('portal galleries PUT is 401 logged out', unauthPut.status === 401);

  const login = await fetch(`${BASE}/portal/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin },
    body: `password=${encodeURIComponent(password)}`,
    redirect: 'manual',
  });
  const setCookie = login.headers.getSetCookie?.() || (login.headers.get('set-cookie') ? [login.headers.get('set-cookie')] : []);
  const sessionCookie = setCookie.find((c) => c.startsWith('e5_portal=')) || '';
  const cookieValue = sessionCookie.split(';')[0].replace('e5_portal=', '');
  assert('login for galleries editor', login.status === 302 && cookieValue);

  const editor = await fetch(`${BASE}/portal/galleries`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const editorHtml = await editor.text();
  assert(
    'galleries editor lists current sets',
    editor.status === 200 &&
      editorHtml.includes('Galleries') &&
      editorHtml.includes('Save changes') &&
      editorHtml.includes(KNOWN_SLUG) &&
      !editorHtml.includes('Coming soon'),
  );
  assert('editor uses site type', editorHtml.includes('Franklin Gothic'));

  const authedGet = await fetch(`${BASE}/portal/api/galleries`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const authedJson = await authedGet.json();
  assert('authed GET returns galleries', authedGet.status === 200 && Array.isArray(authedJson.items) && authedJson.items.some((row) => row.id === KNOWN_SLUG));

  const noOrigin = await fetch(`${BASE}/portal/api/galleries`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', cookie: `e5_portal=${cookieValue}` },
    body: JSON.stringify({ items: authedJson.items }),
  });
  assert('PUT requires origin', noOrigin.status === 403);

  const unknown = await fetch(`${BASE}/portal/api/galleries`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      origin,
      cookie: `e5_portal=${cookieValue}`,
    },
    body: JSON.stringify({ items: [{ id: 'not-a-real-gallery', hidden: false }] }),
  });
  const unknownJson = await unknown.json();
  assert('PUT rejects unknown ids', unknown.status === 400 && /unknown gallery/i.test(unknownJson.error || ''));

  const empty = await fetch(`${BASE}/portal/api/galleries`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      origin,
      cookie: `e5_portal=${cookieValue}`,
    },
    body: JSON.stringify({ items: [] }),
  });
  assert('PUT rejects empty list', empty.status === 400);

  const hostApi = await fetch(`${BASE}/api/portal/galleries`, {
    headers: { cookie: `e5_portal=${cookieValue}`, 'x-forwarded-host': 'portal.e5wheels.com' },
  });
  const hostJson = await hostApi.json();
  assert('portal host API rewrite works', hostApi.status === 200 && Array.isArray(hostJson.items) && hostJson.items.length > 0);

  const hostPage = await fetch(`${BASE}/galleries`, {
    headers: { cookie: `e5_portal=${cookieValue}`, 'x-forwarded-host': 'portal.e5wheels.com' },
  });
  const hostHtml = await hostPage.text();
  assert('portal host /galleries loads editor', hostPage.status === 200 && hostHtml.includes('Save changes') && hostHtml.includes(KNOWN_SLUG));
} finally {
  child.kill('SIGTERM');
}

if (failed) {
  console.error(`${failed} portal section 5 checks failed`);
  process.exit(1);
}
console.log('portal section 5 checks passed');
