import { readFileSync } from 'node:fs';
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

const types = read('src/core/portal/galleryTypes.ts');
const store = read('src/core/portal/galleryStore.ts');
const photos = read('src/core/portal/galleryPhotos.ts');
const sync = read('src/core/portal/gallerySync.ts');
const copy = read('src/core/portal/galleryCopy.ts');
const picker = read('src/core/portal/wheelPicker.ts');
const helper = read('src/core/portal/galleries.ts');
const listPage = read('src/pages/portal/galleries.astro');
const editPage = read('src/pages/portal/galleries/[id].astro');
const recordsApi = read('src/pages/portal/api/galleries/records.ts');
const recordApi = read('src/pages/portal/api/galleries/records/[id].ts');
const photoApi = read('src/pages/portal/api/galleries/photos.ts');
const syncApi = read('src/pages/portal/api/galleries/sync.ts');
const cron = read('src/pages/api/cron/galleries.ts');
const media = read('src/pages/gallery-media/[...path].ts');
const publicDetail = read('src/pages/gallery/[id].astro');
const publicIndex = read('src/pages/gallery/vehicles/index.astro');
const docs = read('docs/PORTAL.md');
const vercel = read('vercel.json');
const KNOWN_SLUG = '2025-c8-stingray-blue-sebring-gloss-black';

assert('store keys are first-party redis documents', types.includes("GALLERY_INDEX_KEY = 'e5:galleries:index'") && types.includes('e5:galleries:item:'));
assert('photos use gallery-media public paths', types.includes("GALLERY_PUBLIC_PREFIX = '/gallery-media'") && photos.includes('putGalleryPhoto') && media.includes('blobUrl'));
assert('client edits are not overwritten by sync', sync.includes('clientEdited') && sync.includes('if (!draft.clientEdited.title)') && sync.includes('if (!draft.clientEdited.photos)'));
assert('store wins by slug and deleted slugs drop from fallback', store.includes('mergeStoredCatalog') && store.includes('deleted.has(id)') && store.includes("catalogSource: 'store'"));
assert('sync keeps claimed slugs across batches', sync.includes('loadStoredGalleries') && sync.includes('byAutosyncId'));
assert('sync copies autosync photos to blob', sync.includes('copyRemotePhoto') && sync.includes('api.autosyncstudio.com/galleries') && sync.includes('f-imgUpdatedAfter') && !sync.includes("method: 'POST'"));
assert('cron is nightly and authed', vercel.includes('/api/cron/galleries') && vercel.includes('15 6 * * *') && cron.includes('CRON_SECRET') && cron.includes('Bearer'));
assert('add gallery form has vehicle and wheel fields', editPage.includes('Add gallery') && editPage.includes('data-drop') && editPage.includes('data-square') && editPage.includes('YouTube') && editPage.includes('data-front-pn') && editPage.includes('data-rear-pn'));
assert('list page keeps filters and add', listPage.includes('Add gallery') && listPage.includes('data-filter="generation"') && listPage.includes('data-filter="color"') && listPage.includes('data-sync') && listPage.includes('if (!list || filtersOn()) return'));
assert('write APIs are authed and same-origin', recordsApi.includes('requirePortalSession') && recordsApi.includes('requireSameOrigin') && recordApi.includes('DELETE') && photoApi.includes('MAX_GALLERY_IMAGE_BYTES') && photoApi.includes('WebP'));
assert('wheel picker uses official catalog', picker.includes('e5-official-pricing.csv') && picker.includes('FINISH_CODE_TO_SITE_NAME') && picker.includes('sizeFromPn'));
assert('copy does not invent facts', copy.includes('suggestGalleryTitle') && copy.includes('Chevrolet Corvette') && !copy.includes('openai') && !copy.includes('generateImage'));
assert('titles put paint color before generation', copy.includes('clean(input.year), clean(input.vehicleColor), clean(input.generation), clean(input.trim)') && copy.includes('with ${wheel} wheels'));
assert('sync reads wheel Color/Finish from i-specs', sync.includes("'i-specs': 'true'") && sync.includes('detail?.Color') && sync.includes('detail?.Accent'));
assert('sync copies static paint color only', sync.includes('staticItem?.vehicleColor') && !sync.includes('ImgColorId') && !sync.includes('Colors['));
const factoryHelper = read('src/core/portal/galleryFactoryPaint.ts');
const factoryMap = read('src/data/gallery-factory-color-proposals.json');
assert(
  'sync can fill reviewed factory paint without ImgColorId',
  sync.includes('proposedFactoryPaint(slug)') &&
    factoryHelper.includes("row.confidence === 'low'") &&
    factoryMap.includes('"confidence": "low"') &&
    !factoryHelper.includes('ImgColorId'),
);
const factoryProposals = JSON.parse(factoryMap);
assert('factory map covers 59 empty-color galleries', factoryProposals.items.length === 59);
assert(
  'factory map counts high 21 medium 8 low 30',
  factoryProposals.counts.high === 21 &&
    factoryProposals.counts.medium === 8 &&
    factoryProposals.counts.low === 30 &&
    factoryProposals.applyCount === 29,
);
const factoryBySlug = new Map(factoryProposals.items.map((row) => [row.slug, row]));
const factoryPaint = (slug) => {
  const row = factoryBySlug.get(slug);
  if (!row || row.confidence === 'low') return '';
  return (row.proposedColor || '').trim();
};
assert('low-confidence factory paint stays blank', factoryPaint('g-2991') === '');
assert('high-confidence factory paint fills Torch Red', factoryPaint('g-2986') === 'Torch Red');
assert('client-edited vehicle still gates paint in sync', sync.includes('if (!draft.clientEdited.vehicle)') && sync.includes('draft.vehicleColor = paintColor || draft.vehicleColor'));
assert('sync does not overwrite client-edited title', sync.includes('if (!draft.clientEdited.title) draft.title = suggestedTitle'));

function suggestGalleryTitle(input) {
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const vehicle = [clean(input.year), clean(input.vehicleColor), clean(input.generation), clean(input.trim)].filter(Boolean);
  const base = vehicle.join(' ') || 'Corvette';
  const style = clean(input.style);
  const finish = clean(input.finish);
  const wheel = [style ? `E5 ${style}` : '', finish].filter(Boolean).join(' ');
  if (wheel) return `${base} with ${wheel} wheels`.slice(0, 160);
  return base.slice(0, 160);
}
assert(
  'title formula keeps paint and wheel facts',
  suggestGalleryTitle({
    year: '2025',
    vehicleColor: 'Torch Red',
    generation: 'C8',
    trim: 'Z06',
    style: 'GT.03',
    finish: 'Gloss Black',
  }) === '2025 Torch Red C8 Z06 with E5 GT.03 Gloss Black wheels',
);
assert(
  'title formula omits color when the field is empty',
  suggestGalleryTitle({ year: '2025', generation: 'C8', trim: 'Z06', style: 'Talladega', finish: 'Gloss Black' }) ===
    '2025 C8 Z06 with E5 Talladega Gloss Black wheels',
);
assert('public pages still SSR from catalog helpers', publicDetail.includes('loadGalleryBySlug') && publicIndex.includes('loadPublicGalleries') && helper.includes('mergeStoredCatalog'));
assert('existing slug matching stays', helper.includes('pickUniqueStatic') && helper.includes('g-${gallery.Id}'));
assert('docs describe store blob cron and CRON_SECRET', docs.includes('e5:galleries:index') && docs.includes('BLOB_READ_WRITE_TOKEN') && docs.includes('CRON_SECRET') && docs.includes('/gallery-media/'));
assert('public pages have no portal add form', !publicDetail.includes('data-drop') && !publicIndex.includes('Import from AutoSync'));

const password = 'portal-test-pass';
const N = 16384;
const r = 8;
const p = 1;
const keylen = 32;
const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, keylen, { N, r, p });
const hash = `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
const secret = 'portal-test-session-secret-32bytes!!';
const PORT = process.env.PORTAL_GALLERIES_STORE_TEST_PORT || '8793';
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
    'public listing still loads known slug',
    listing.status === 200 && listingHtml.includes(KNOWN_SLUG) && !listingHtml.includes('data-drop'),
  );

  const detail = await fetch(`${BASE}/gallery/${KNOWN_SLUG}`);
  const detailHtml = await detail.text();
  assert(
    'existing gallery slug still 200 with canonical and json-ld',
    detail.status === 200 &&
      detailHtml.includes('Gallery - E5 Wheels') &&
      detailHtml.includes(`rel="canonical"`) &&
      detailHtml.includes('ImageGallery') &&
      !detailHtml.includes('Not found'),
  );

  const mediaMissing = await fetch(`${BASE}/gallery-media/not-a-gallery/p1.webp`);
  assert('missing gallery-media is 404', mediaMissing.status === 404);

  const cronUnauth = await fetch(`${BASE}/api/cron/galleries`);
  assert('cron is 401 without bearer', cronUnauth.status === 401);

  const unauthPost = await fetch(`${BASE}/portal/api/galleries/records`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ title: 'Nope' }),
  });
  assert('records POST is 401 logged out', unauthPost.status === 401);

  const login = await fetch(`${BASE}/portal/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin },
    body: `password=${encodeURIComponent(password)}`,
    redirect: 'manual',
  });
  const setCookie = login.headers.getSetCookie?.() || (login.headers.get('set-cookie') ? [login.headers.get('set-cookie')] : []);
  const sessionCookie = setCookie.find((c) => c.startsWith('e5_portal=')) || '';
  const cookieValue = sessionCookie.split(';')[0].replace('e5_portal=', '');
  assert('login for first-party galleries', login.status === 302 && cookieValue);
  const cookie = `e5_portal=${cookieValue}`;

  const editor = await fetch(`${BASE}/portal/galleries`, { headers: { cookie } });
  const editorHtml = await editor.text();
  assert(
    'galleries list has add import and filters',
    editor.status === 200 &&
      editorHtml.includes('Add gallery') &&
      editorHtml.includes('Import from AutoSync') &&
      editorHtml.includes('data-filter="generation"') &&
      editorHtml.includes(KNOWN_SLUG),
  );

  const add = await fetch(`${BASE}/portal/galleries/new`, { headers: { cookie } });
  const addHtml = await add.text();
  assert(
    'add gallery form renders',
    add.status === 200 &&
      addHtml.includes('Add gallery') &&
      addHtml.includes('data-drop') &&
      addHtml.includes('Vehicle color') &&
      addHtml.includes('Square set') &&
      addHtml.includes('YouTube') &&
      addHtml.includes('Franklin Gothic'),
  );

  const hostAdd = await fetch(`${BASE}/galleries/new`, {
    headers: { cookie, 'x-forwarded-host': 'portal.e5wheels.com' },
  });
  const hostAddHtml = await hostAdd.text();
  assert('portal host add form loads', hostAdd.status === 200 && hostAddHtml.includes('Add gallery'));
} finally {
  child.kill('SIGTERM');
}

if (failed) {
  console.error(`${failed} first-party gallery checks failed`);
  process.exit(1);
}
console.log('first-party gallery checks passed');
