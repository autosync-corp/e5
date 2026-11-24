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
const page = read('src/pages/portal/performance.astro');
const helper = read('src/core/portal/performance.ts');
const docs = read('docs/PORTAL.md');
const compare = JSON.parse(read('src/data/performance/compare.json'));
const history = JSON.parse(read('src/data/performance/history.json'));
const latest = JSON.parse(read('src/data/performance/latest.json'));
const layout = read('src/layouts/PortalLayout.astro');
const soon = read('src/pages/portal/[section].astro');
const section1 = read('scripts/test-portal-section1.mjs');

assert('performance section is ready', /slug: 'performance'[\s\S]*?ready: true/.test(sections));
assert('soon badge removed from performance', /slug: 'performance'[\s\S]*?ready: true[\s\S]*?slug: 'sales'/.test(sections));
assert('dedicated performance page', existsSync(join(root, 'src/pages/portal/performance.astro')) && page.includes('Site Performance') && page.includes('data-tab="mobile"'));
assert('snapshot files exist', existsSync(join(root, 'src/data/performance/compare.json')) && existsSync(join(root, 'src/data/performance/latest.json')) && existsSync(join(root, 'src/data/performance/history.json')));
assert('latest score cards exist', existsSync(join(root, 'src/data/performance/runs/2026-11-24/mobile.png')) && existsSync(join(root, 'src/data/performance/runs/2026-11-24/desktop.png')) && existsSync(join(root, 'src/data/performance/runs/2026-11-24/compare.png')));
assert('uses compare direction not a local recompute', helper.includes("direction === 'better'") && page.includes('cell.direction') && !page.includes('latest > baseline') && !page.includes('latest < baseline'));
assert('formats seconds cls and bytes', helper.includes('(value / 1000).toFixed(1)') && helper.includes('value.toFixed(3)') && helper.includes('1024 * 1024'));
assert('caveats stay in client language', page.includes('clientCaveats') && helper.includes('lab test results') && helper.includes('testing tool version') && !page.includes('Lighthouse') && !page.includes('CRUX') && !page.includes('PageSpeed') && !page.includes('Upstash'));
assert('docs describe monthly refresh', docs.includes('Section 6') && docs.includes('src/data/performance/') && docs.includes('Monthly refresh') && docs.includes('runs/<YYYY-MM-DD>'));
assert('coming soon still on galleries', soon.includes('Coming soon') && section1.includes('/portal/galleries'));
assert('shell still noindex', layout.includes('noindex, nofollow'));
assert('compare snapshot is v2 homepage', compare.schema_version === 2 && compare.baseline_date === '2026-11-01' && compare.latest_date === latest.latest_date && compare.urls.includes('https://www.e5wheels.com/'));
assert('history has more than one run', history.months.length >= 2);

const password = 'portal-test-pass';
const N = 16384;
const r = 8;
const p = 1;
const keylen = 32;
const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, keylen, { N, r, p });
const hash = `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
const secret = 'portal-test-session-secret-32bytes!!';
const PORT = process.env.PORTAL_PERF_TEST_PORT || '8796';
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
    BROWSER: 'none',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

try {
  await waitForServer(child);

  const unauth = await fetch(`${BASE}/portal/performance`, { redirect: 'manual' });
  assert('performance page redirects when logged out', unauth.status === 302);

  const login = await fetch(`${BASE}/portal/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin: BASE },
    body: `password=${encodeURIComponent(password)}`,
    redirect: 'manual',
  });
  const setCookie = login.headers.getSetCookie?.() || (login.headers.get('set-cookie') ? [login.headers.get('set-cookie')] : []);
  const sessionCookie = setCookie.find((c) => c.startsWith('e5_portal=')) || '';
  const cookieValue = sessionCookie.split(';')[0].replace('e5_portal=', '');
  assert('login for performance page', login.status === 302 && cookieValue);

  const res = await fetch(`${BASE}/portal/performance`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const html = await res.text();
  assert(
    'performance page renders comparison',
    res.status === 200 &&
      html.includes('Site Performance') &&
      html.includes('November 1, 2026') &&
      html.includes('November 24, 2026') &&
      html.includes('https://www.e5wheels.com/') &&
      html.includes('Performance score') &&
      html.includes('Largest content (LCP)') &&
      html.includes('Layout shift (CLS)') &&
      html.includes('Page weight') &&
      html.includes('Better') &&
      html.includes('Worse'),
  );
  assert('lab caveats in client language', html.includes('lab test results, not real-visitor data') && html.includes('varied from 56 to 79') && html.includes('testing tool version changed'));
  assert('no lab jargon on the page copy', !html.includes('Lighthouse') && !html.includes('CRUX') && !html.includes('PageSpeed') && !html.includes('Upstash') && !html.includes('Redis'));
  assert('score cards are in the page', html.includes('Mobile score card') && html.includes('Desktop score card') && html.includes('Baseline vs latest'));
  assert('history lists earlier tests', html.includes('Earlier tests') && html.includes('October 27, 2026'));
  assert('uses site type', html.includes('Franklin Gothic'));
  assert('no-store on performance page', (res.headers.get('cache-control') || '').includes('no-store') || html.includes('noindex'));
  assert('no soon badge on this page', !/Site Performance[\s\S]{0,40}Soon/.test(html) && !html.includes('Coming soon'));

  const dash = await fetch(`${BASE}/portal`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const dashHtml = await dash.text();
  assert('dashboard lists performance as open', /Site Performance<\/strong><span[^>]*>Open<\/span>/.test(dashHtml));

  const hostPage = await fetch(`${BASE}/performance`, {
    headers: { cookie: `e5_portal=${cookieValue}`, 'x-forwarded-host': 'portal.e5wheels.com' },
  });
  const hostHtml = await hostPage.text();
  assert('portal host /performance loads', hostPage.status === 200 && hostHtml.includes('Site Performance') && hostHtml.includes('November 1, 2026'));

  const hostUnauth = await fetch(`${BASE}/performance`, {
    headers: { 'x-forwarded-host': 'portal.e5wheels.com' },
    redirect: 'manual',
  });
  assert('portal host /performance redirects logged out', hostUnauth.status === 302);
} finally {
  child.kill('SIGTERM');
}

if (failed) {
  console.error(`${failed} portal section 6 checks failed`);
  process.exit(1);
}
console.log('all portal section 6 checks passed');
