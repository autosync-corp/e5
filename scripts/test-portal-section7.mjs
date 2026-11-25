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

const sections = read('src/core/portal/sections.ts');
const page = read('src/pages/portal/sales.astro');
const helper = read('src/core/portal/sales.ts');
const docs = read('docs/PORTAL.md');
const layout = read('src/layouts/PortalLayout.astro');
const soon = read('src/pages/portal/[section].astro');
const section1 = read('scripts/test-portal-section1.mjs');
const webhook = read('src/pages/api/send-order-webhook.ts');
const mw = read('src/middleware.ts');

assert('sales section is ready', /slug: 'sales'[\s\S]*?ready: true/.test(sections));
assert('sales summary has no CRM jargon', /slug: 'sales'[\s\S]*?summary: 'New prospects, pipelines, and lead sources. View only.'/.test(sections));
assert('dedicated sales page', existsSync(join(root, 'src/pages/portal/sales.astro')) && page.includes('Sales & Prospects') && page.includes('Last {range} days'));
assert('range default 30 with 7 and 90', helper.includes('SALES_RANGES = [7, 30, 90]') && helper.includes('return 30'));
assert('read-only CRM access', !/method:\s*'PUT'|method:\s*'PATCH'|method:\s*'DELETE'/.test(helper) && helper.includes('/opportunities/pipelines') && helper.includes('/contacts/search') && helper.includes('/contacts/?'));
assert(
  'opportunities search uses location_id and page',
  helper.includes('location_id: locationId') &&
    helper.includes('page: String(page)') &&
    helper.includes('inRange(item.createdAt') &&
    !helper.includes("status: 'all'") &&
    !helper.includes('endDate') &&
    !helper.includes('mmDdYyyy') &&
    !/opportunities\/search[\s\S]{0,400}locationId,/.test(helper),
);
assert('custom-field lookup is optional', helper.includes("'custom-fields'") && helper.includes('optional: true') && helper.includes('if (optional) return skip'));
assert('five minute cache', helper.includes('CACHE_TTL_MS = 5 * 60 * 1000') && helper.includes('ex: CACHE_TTL_SEC') && helper.includes('e5:portal:sales:v1:'));
assert('pagination limit 100', helper.includes('PAGE_LIMIT = 100') && helper.includes('searchAfter') && helper.includes('startAfterId'));
assert('prospects omit phone and email columns', page.includes('Names only') && !page.includes('row.phone') && !page.includes('row.email') && helper.includes('name: displayName(contact)') && !helper.includes('contact.email') && !helper.includes('contact.phone'));
assert('hear-about is detected not invented', helper.includes('HOW_DID_YOU_HEAR_OPTIONS') && helper.includes('hearAbout') && page.includes('snapshot.hearAbout') && docs.includes('not** a contact custom field'));
assert(
  'portal-host rewrites keep the query string',
  mw.includes('`/portal/api${rest}${url.search}`') &&
    mw.includes('`${internalPortalPath(pathname)}${url.search}`'),
);
assert(
  'pipeline cards wrap wide enough for money',
  page.includes('minmax(320px, 1fr)') &&
    page.includes('white-space: nowrap') &&
    page.includes('.table-wrap { overflow-x: auto; }'),
);
assert('friendly error copy', page.includes("Couldn't load sales data right now.") && page.includes('Try again in a few minutes.'));
assert('page copy has no jargon', !page.includes('GHL') && !page.includes('GoHighLevel') && !page.includes('Redis') && !page.includes('API') && !page.includes('token') && !page.includes('LeadConnector'));
assert('token stays server-side', helper.includes('GHL_PRIVATE_TOKEN') && helper.includes('Authorization') && !helper.includes('console.log') && !page.includes('GHL_PRIVATE_TOKEN') && !page.includes('GHL_LOCATION_ID'));
assert('crm fetch sends a named user-agent', helper.includes("GHL_USER_AGENT = 'E5Portal/1.0'") && helper.includes("headers.set('User-Agent', GHL_USER_AGENT)"));
assert(
  'failed crm calls log a safe diagnostic',
  helper.includes('portal-sales failed step=') &&
    helper.includes('missing-env token=') &&
    helper.includes('console.error') &&
    !/console\.error\([^)]*Authorization/.test(helper) &&
    !helper.includes('res.headers') &&
    !helper.includes('getSetCookie'),
);
assert('errors are not cached', helper.includes('if (!isSnapshot(snapshot)) return') && helper.includes('await writeCache(days, snapshot)') && helper.includes('throw err'));
assert('docs cover section 7', docs.includes('Section 7') && docs.includes('/sales') && docs.includes('GHL_PRIVATE_TOKEN') && docs.includes('Read-only') && docs.includes('how_did_you_hear'));
assert('docs mention user-agent and diagnostics', docs.includes('E5Portal/1.0') && docs.includes('never logged') && docs.includes('not written to the 5-minute cache'));
assert('docs cover snake_case search and optional custom fields', docs.includes('location_id') && docs.includes('createdAt') && docs.includes('optional'));
assert('checkout still sends hear-about on the webhook', webhook.includes('how_did_you_hear') && webhook.includes('applyHowDidYouHear'));
assert('coming soon placeholder page still exists', soon.includes('Coming soon') && section1.includes('/portal/galleries'));
assert('shell still noindex', layout.includes('noindex, nofollow'));
assert('sales is not listed as a later section', docs.includes('Later sections') && !docs.includes('| Sales & Prospects (GoHighLevel)'));

const password = 'portal-test-pass';
const N = 16384;
const r = 8;
const p = 1;
const keylen = 32;
const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, keylen, { N, r, p });
const hash = `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
const secret = 'portal-test-session-secret-32bytes!!';
const PORT = process.env.PORTAL_SALES_TEST_PORT || '8797';
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
    GHL_PRIVATE_TOKEN: '',
    GHL_LOCATION_ID: '',
    BROWSER: 'none',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(child);

  const unauth = await fetch(`${BASE}/portal/sales`, { redirect: 'manual' });
  assert('sales page redirects when logged out', unauth.status === 302);

  const login = await fetch(`${BASE}/portal/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE },
    body: `password=${encodeURIComponent(password)}`,
    redirect: 'manual',
  });
  const setCookie = login.headers.getSetCookie?.() || (login.headers.get('set-cookie') ? [login.headers.get('set-cookie')] : []);
  const sessionCookie = setCookie.find((c) => c.startsWith('e5_portal=')) || '';
  const cookieValue = sessionCookie.split(';')[0].replace('e5_portal=', '');
  assert('login for sales page', login.status === 302 && cookieValue);

  const res = await fetch(`${BASE}/portal/sales`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const html = await res.text();
  assert(
    'sales page renders error state without CRM env',
    res.status === 200 &&
      html.includes('Sales & Prospects') &&
      html.includes("Couldn't load sales data right now.") &&
      html.includes('Try again in a few minutes.') &&
      html.includes('Last 30 days') &&
      html.includes('Last 7 days') &&
      html.includes('Last 90 days') &&
      html.includes('view-only'),
  );
  assert(
    'no jargon on the rendered page',
    !html.includes('GHL') &&
      !html.includes('GoHighLevel') &&
      !html.includes('Redis') &&
      !html.includes('API') &&
      !html.includes('LeadConnector') &&
      !html.includes('GHL_PRIVATE_TOKEN') &&
      !html.includes('token'),
  );
  assert('range links stay on sales', html.includes('/portal/sales?days=7') && html.includes('/portal/sales?days=90') && html.includes('aria-current="page"'));
  assert('uses site type', html.includes('Franklin Gothic'));
  assert('no-store on sales page', (res.headers.get('cache-control') || '').includes('no-store') || html.includes('noindex'));
  assert('no soon badge on this page', !/Sales &amp; Prospects[\s\S]{0,80}Soon/.test(html) && !html.includes('Coming soon'));

  const seven = await fetch(`${BASE}/portal/sales?days=7`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const sevenHtml = await seven.text();
  assert('days=7 is the active range', seven.status === 200 && sevenHtml.includes('Last 7 days') && /href="\/portal\/sales\?days=7"[^>]*aria-current="page"/.test(sevenHtml));

  const invalid = await fetch(`${BASE}/portal/sales?days=12`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const invalidHtml = await invalid.text();
  assert('invalid days falls back to 30', invalid.status === 200 && /href="\/portal\/sales\?days=30"[^>]*aria-current="page"/.test(invalidHtml));

  const dash = await fetch(`${BASE}/portal`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const dashHtml = await dash.text();
  assert('dashboard lists sales as open', /Sales &amp; Prospects<\/strong><span[^>]*>Open<\/span>/.test(dashHtml));
  assert('dashboard sales summary is plain English', dashHtml.includes('New prospects, pipelines, and lead sources. View only.') && !dashHtml.includes('GoHighLevel') && !dashHtml.includes('GHL'));

  const hostHeaders = { cookie: `e5_portal=${cookieValue}`, 'x-forwarded-host': 'portal.e5wheels.com' };
  const hostPage = await fetch(`${BASE}/sales`, { headers: hostHeaders });
  const hostHtml = await hostPage.text();
  assert('portal host /sales loads', hostPage.status === 200 && hostHtml.includes('Sales & Prospects') && hostHtml.includes("Couldn't load sales data right now."));
  assert(
    'portal host range links stay on /sales',
    hostHtml.includes('/sales?days=7') && hostHtml.includes('/sales?days=90') && /href="\/sales\?days=30"[^>]*aria-current="page"/.test(hostHtml),
  );

  const hostSeven = await fetch(`${BASE}/sales?days=7`, { headers: hostHeaders });
  const hostSevenHtml = await hostSeven.text();
  assert(
    'portal host /sales?days=7 is the active range',
    hostSeven.status === 200 && /href="\/sales\?days=7"[^>]*aria-current="page"/.test(hostSevenHtml),
  );

  const hostNinety = await fetch(`${BASE}/sales?days=90`, { headers: hostHeaders });
  const hostNinetyHtml = await hostNinety.text();
  assert(
    'portal host /sales?days=90 is the active range',
    hostNinety.status === 200 && /href="\/sales\?days=90"[^>]*aria-current="page"/.test(hostNinetyHtml),
  );

  const hostSlides = await fetch(`${BASE}/slides`, { headers: hostHeaders });
  const hostSlidesHtml = await hostSlides.text();
  assert('portal host /slides still loads', hostSlides.status === 200 && hostSlidesHtml.includes('Homepage Slides'));

  const hostLinks = await fetch(`${BASE}/links`, { headers: hostHeaders });
  const hostLinksHtml = await hostLinks.text();
  assert('portal host /links still loads', hostLinks.status === 200 && hostLinksHtml.includes('Header & Footer Links'));

  const hostBlog = await fetch(`${BASE}/blog`, { headers: hostHeaders });
  const hostBlogHtml = await hostBlog.text();
  assert('portal host /blog still loads', hostBlog.status === 200 && hostBlogHtml.includes('Blog Posts'));

  const hostUnauth = await fetch(`${BASE}/sales`, {
    headers: { 'x-forwarded-host': 'portal.e5wheels.com' },
    redirect: 'manual',
  });
  assert('portal host /sales redirects logged out', hostUnauth.status === 302);

  const galleries = await fetch(`${BASE}/portal/galleries`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const galleriesHtml = await galleries.text();
  assert('galleries editor is live', galleries.status === 200 && galleriesHtml.includes('Galleries') && galleriesHtml.includes('Save changes') && !galleriesHtml.includes('Coming soon'));
} finally {
  child.kill('SIGTERM');
}

if (failed) {
  console.error(`${failed} portal section 7 checks failed`);
  process.exit(1);
}
console.log('all portal section 7 checks passed');
