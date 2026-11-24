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

const seed = read('src/core/portal/slides.ts');
const banner = read('src/core/components/BannerSlider.astro');
const slidesPage = read('src/pages/portal/slides.astro');
const homeApi = read('src/pages/api/home-slides.ts');
const portalApi = read('src/pages/portal/api/slides.ts');
const uploadApi = read('src/pages/portal/api/slides/upload.ts');
const sections = read('src/core/portal/sections.ts');
const mw = read('src/middleware.ts');
const vercel = read('vercel.json');
const index = read('src/pages/index.astro');
const docs = read('docs/PORTAL.md');

assert('slides section is ready', sections.includes("slug: 'slides'") && sections.includes('ready: true'));
assert('dedicated slides editor page', slidesPage.includes('Homepage Slides') && slidesPage.includes('data-save') && slidesPage.includes('data-upload'));
assert('redis key is e5:portal:slides', seed.includes("SLIDES_REDIS_KEY = 'e5:portal:slides'"));
assert('seed matches current banners', seed.includes('BLACK FRIDAY SALE') && seed.includes('E5 IMMERSIVE GALLERY') && seed.includes('IN-STOCK & READY-2-SHIP') && seed.includes('WATCH THE FILM'));
assert('seed on first redis read', seed.includes('nx: true') && seed.includes('seedHomepageSlides'));
assert('fallback when redis errors', seed.includes("source: 'seed'") && seed.includes('catch'));
assert('validation rejects javascript hrefs', seed.includes('javascript') && seed.includes('isAllowedSlideHref'));
assert('image size limit 4MB', seed.includes('MAX_IMAGE_BYTES = 4 * 1024 * 1024') && uploadApi.includes('MAX_IMAGE_BYTES'));
assert('blob upload jpeg png webp', uploadApi.includes('image/jpeg') && uploadApi.includes('image/webp') && uploadApi.includes('@vercel/blob'));
assert('auth on portal slides API', portalApi.includes('requirePortalSession') && uploadApi.includes('requirePortalSession'));
assert('origin check on writes', portalApi.includes('requireSameOrigin') && uploadApi.includes('requireSameOrigin'));
assert('public home-slides is uncached beyond 60s', homeApi.includes('s-maxage=60') && vercel.includes('/api/home-slides'));
assert('homepage stays prerendered', index.includes('export const prerender = true') && index.includes('BannerSlider'));
assert('slider hydrates from API', banner.includes('data-slides-api') && banner.includes('/api/home-slides') && banner.includes('applyLiveSlides'));
assert('film layout preserved', banner.includes('is-poster') && banner.includes('data-film-open') && banner.includes('#ff2e88') && slidesPage.includes('Film poster'));
assert('portal host allows /api/portal', mw.includes('isPortalApiPath') && vercel.includes('api/portal'));
assert('docs describe section 2', docs.includes('Section 2') && docs.includes('e5:portal:slides') && docs.includes('s-maxage=60'));
assert('blob package is a dependency', read('package.json').includes('"@vercel/blob"'));
assert('editor page exists', existsSync(join(root, 'src/pages/portal/slides.astro')));
assert('upload route exists', existsSync(join(root, 'src/pages/portal/api/slides/upload.ts')));

const password = 'portal-test-pass';
const N = 16384;
const r = 8;
const p = 1;
const keylen = 32;
const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, keylen, { N, r, p });
const hash = `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
const secret = 'portal-test-session-secret-32bytes!!';
const PORT = process.env.PORTAL_SLIDES_TEST_PORT || '8793';
const BASE = `http://127.0.0.1:${PORT}`;

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('astro did not start')), 90000);
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
        reject(new Error(`astro exited ${code}`));
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

  const home = await fetch(`${BASE}/`);
  const homeHtml = await home.text();
  assert('homepage still has four seed slides', homeHtml.includes('BLACK FRIDAY SALE') && homeHtml.includes('E5 IMMERSIVE GALLERY') && homeHtml.includes('READY-2-SHIP') && homeHtml.includes('WATCH THE FILM'));
  assert('homepage still has one H1', (homeHtml.match(/<h1\b/g) || []).length === 1);
  assert('homepage still has poster lightbox', homeHtml.includes('data-film-open') && homeHtml.includes('e5-poster-grid'));

  const publicApi = await fetch(`${BASE}/api/home-slides`);
  const publicJson = await publicApi.json();
  assert(
    'public slides API returns seed',
    publicApi.status === 200 &&
      publicJson.slides?.length === 4 &&
      publicJson.slides[0].title === 'BLACK FRIDAY SALE' &&
      publicJson.slides[3].layout === 'film' &&
      publicJson.slides[3].cta === 'WATCH THE FILM',
  );
  assert('public slides API is cacheable for a minute', (publicApi.headers.get('cache-control') || '').includes('s-maxage=60'));

  const unauthGet = await fetch(`${BASE}/portal/api/slides`);
  assert('portal slides GET is 401 logged out', unauthGet.status === 401);

  const unauthPut = await fetch(`${BASE}/portal/api/slides`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ slides: publicJson.slides }),
  });
  assert('portal slides PUT is 401 logged out', unauthPut.status === 401);

  const login = await fetch(`${BASE}/portal/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin },
    body: `password=${encodeURIComponent(password)}`,
    redirect: 'manual',
  });
  const setCookie = login.headers.getSetCookie?.() || (login.headers.get('set-cookie') ? [login.headers.get('set-cookie')] : []);
  const sessionCookie = setCookie.find((c) => c.startsWith('e5_portal=')) || '';
  const cookieValue = sessionCookie.split(';')[0].replace('e5_portal=', '');
  assert('login for slides editor', login.status === 302 && cookieValue);

  const editor = await fetch(`${BASE}/portal/slides`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const editorHtml = await editor.text();
  assert(
    'slides editor lists current banners',
    editor.status === 200 &&
      editorHtml.includes('BLACK FRIDAY SALE') &&
      editorHtml.includes('E5 IMMERSIVE GALLERY') &&
      editorHtml.includes('GT.03') &&
      editorHtml.includes('WATCH THE FILM') &&
      editorHtml.includes('Film poster') &&
      editorHtml.includes('Save changes'),
  );
  assert('editor uses site type', editorHtml.includes('Franklin Gothic'));

  const authedGet = await fetch(`${BASE}/portal/api/slides`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const authedJson = await authedGet.json();
  assert('authed GET returns four slides', authedGet.status === 200 && authedJson.slides?.length === 4);

  const badHref = await fetch(`${BASE}/portal/api/slides`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      origin,
      cookie: `e5_portal=${cookieValue}`,
    },
    body: JSON.stringify({
      slides: authedJson.slides.map((s, i) => (i === 0 ? { ...s, href: 'javascript:alert(1)' } : s)),
    }),
  });
  const badHrefJson = await badHref.json();
  assert('PUT rejects javascript href', badHref.status === 400 && /not allowed/i.test(badHrefJson.error || ''));

  const empty = await fetch(`${BASE}/portal/api/slides`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      origin,
      cookie: `e5_portal=${cookieValue}`,
    },
    body: JSON.stringify({ slides: [] }),
  });
  assert('PUT rejects empty list', empty.status === 400);

  const hostApi = await fetch(`${BASE}/api/portal/slides`, {
    headers: { cookie: `e5_portal=${cookieValue}`, 'x-forwarded-host': 'portal.e5wheels.com' },
  });
  const hostJson = await hostApi.json();
  assert('portal host API rewrite works', hostApi.status === 200 && hostJson.slides?.length === 4);
} finally {
  child.kill('SIGTERM');
}

if (failed) {
  console.error(`${failed} portal section 2 checks failed`);
  process.exit(1);
}
console.log('all portal section 2 checks passed');
