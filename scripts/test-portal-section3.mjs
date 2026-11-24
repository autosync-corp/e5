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

const seed = read('src/core/portal/nav.ts');
const navbar = read('src/core/components/Navbar.vue');
const footer = read('src/core/components/Footer.astro');
const layout = read('src/layouts/MainLayout.astro');
const linksPage = read('src/pages/portal/links.astro');
const slidesPage = read('src/pages/portal/slides.astro');
const publicApi = read('src/pages/api/site-nav.ts');
const portalApi = read('src/pages/portal/api/nav.ts');
const sections = read('src/core/portal/sections.ts');
const vercel = read('vercel.json');
const docs = read('docs/PORTAL.md');
const staff = read('src/pages/admin/index.astro');

assert('links section is ready', sections.includes("slug: 'links'") && /slug: 'links'[\s\S]*?ready: true/.test(sections));
assert('dedicated links editor page', existsSync(join(root, 'src/pages/portal/links.astro')) && linksPage.includes('Header & Footer Links') && linksPage.includes('data-save'));
assert('redis key is e5:portal:nav', seed.includes("NAV_REDIS_KEY = 'e5:portal:nav'"));
assert('seed matches current header', seed.includes("'WHEELS'") && seed.includes("'2P FORGED'") && seed.includes("'GENERATIONS'") && seed.includes("'VISUALIZE'"));
assert('seed matches current footer', seed.includes("'OUR PROCESS'") && seed.includes("'GET IN TOUCH'") && seed.includes('SALES@E5WHEELS.COM'));
assert('seed on first redis read', seed.includes('nx: true') && seed.includes('seedSiteNav'));
assert('fallback when redis errors', seed.includes("source: 'seed'") && seed.includes('catch'));
assert('validation rejects javascript hrefs', seed.includes('javascript') && seed.includes('isAllowedNavHref'));
assert('auth on portal nav API', portalApi.includes('requirePortalSession') && portalApi.includes('requireSameOrigin'));
assert('public site-nav is cached 60s', publicApi.includes('s-maxage=60') && vercel.includes('/api/site-nav'));
assert('layout passes nav into Navbar', layout.includes('items={headerItems}') && layout.includes('loadSiteNav'));
assert('navbar renders items not hardcoded wheels routes', navbar.includes('v-for="item in leftItems"') && !navbar.includes('WHEELS_DAYTONA_ROUTE'));
assert('navbar keeps desktop dropdowns in HTML', navbar.includes('dropdown-menu') && navbar.includes('gallery-dropdown-wrapper:hover'));
assert('navbar keeps mobile hamburger', navbar.includes('hamburger-btn') && navbar.includes('isMobileMenuOpen'));
assert('footer loads nav and keeps Astro markup', footer.includes('loadSiteNav') && footer.includes('vossen-top') && !layout.includes('<Footer client:'));
assert('editor copy is plain language', linksPage.includes('within about a minute') && !linksPage.includes('Upstash') && !linksPage.includes('Redis') && !linksPage.includes('Vercel Blob'));
assert('slides copy is plain language', slidesPage.includes('within about a minute') && !slidesPage.includes('Upstash Redis') && !slidesPage.includes('Vercel Blob') && !slidesPage.includes('BLOB_READ_WRITE_TOKEN'));
assert('docs describe section 3 tradeoff', docs.includes('Section 3') && docs.includes('e5:portal:nav') && docs.includes('prerender'));
assert('staff admin is unchanged', staff.includes('Admin Panel') && staff.includes('Coupons'));

const password = 'portal-test-pass';
const N = 16384;
const r = 8;
const p = 1;
const keylen = 32;
const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, keylen, { N, r, p });
const hash = `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
const secret = 'portal-test-session-secret-32bytes!!';
const PORT = process.env.PORTAL_NAV_TEST_PORT || '8794';
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
  assert('homepage header still has seed links', homeHtml.includes('WHEELS') && homeHtml.includes('DAYTONA') && homeHtml.includes('GENERATIONS') && homeHtml.includes('CONTACT'));
  assert('homepage footer still has seed links', homeHtml.includes('OUR PROCESS') && homeHtml.includes('GET IN TOUCH') && homeHtml.includes('SALES@E5WHEELS.COM'));
  assert('homepage header links are crawlable anchors', homeHtml.includes('href="/wheels"') && homeHtml.includes('href="/wheels/daytona"') && homeHtml.includes('href="/contact-us"'));
  assert('homepage footer links are crawlable anchors', homeHtml.includes('href="/process"') && homeHtml.includes('href="/terms-and-conditions"'));

  const about = await fetch(`${BASE}/about-us`);
  const aboutHtml = await about.text();
  assert('ssr page header is crawlable', about.status === 200 && aboutHtml.includes('href="/wheels/daytona"') && aboutHtml.includes('WHEELS'));
  assert('ssr page footer is crawlable', aboutHtml.includes('OUR PROCESS') && aboutHtml.includes('href="/privacy-policy"'));

  const siteNav = await fetch(`${BASE}/api/site-nav`);
  const siteJson = await siteNav.json();
  assert(
    'public nav API returns seed',
    siteNav.status === 200 &&
      siteJson.header?.some((item) => item.label === 'WHEELS' && item.children?.some((c) => c.label === 'DAYTONA')) &&
      siteJson.footer?.columns?.[0]?.heading === 'Explore' &&
      siteJson.footer?.cta?.label === 'GET IN TOUCH',
  );
  assert('public nav API is cacheable for a minute', (siteNav.headers.get('cache-control') || '').includes('s-maxage=60'));

  const unauthGet = await fetch(`${BASE}/portal/api/nav`);
  assert('portal nav GET is 401 logged out', unauthGet.status === 401);

  const unauthPut = await fetch(`${BASE}/portal/api/nav`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify(siteJson),
  });
  assert('portal nav PUT is 401 logged out', unauthPut.status === 401);

  const unauthPage = await fetch(`${BASE}/portal/links`, { redirect: 'manual' });
  assert('links page redirects when logged out', unauthPage.status === 302);

  const login = await fetch(`${BASE}/portal/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin },
    body: `password=${encodeURIComponent(password)}`,
    redirect: 'manual',
  });
  const setCookie = login.headers.getSetCookie?.() || (login.headers.get('set-cookie') ? [login.headers.get('set-cookie')] : []);
  const sessionCookie = setCookie.find((c) => c.startsWith('e5_portal=')) || '';
  const cookieValue = sessionCookie.split(';')[0].replace('e5_portal=', '');
  assert('login for links editor', login.status === 302 && cookieValue);

  const editor = await fetch(`${BASE}/portal/links`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const editorHtml = await editor.text();
  assert(
    'links editor lists current menus',
    editor.status === 200 &&
      editorHtml.includes('WHEELS') &&
      editorHtml.includes('FORM FORGED') &&
      editorHtml.includes('OUR PROCESS') &&
      editorHtml.includes('GET IN TOUCH') &&
      editorHtml.includes('Save changes') &&
      !/Header & Footer Links[\s\S]{0,80}Soon/.test(editorHtml),
  );
  assert('editor uses site type', editorHtml.includes('Franklin Gothic'));

  const authedGet = await fetch(`${BASE}/portal/api/nav`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const authedJson = await authedGet.json();
  assert('authed GET returns header and footer', authedGet.status === 200 && authedJson.nav?.header?.length >= 6 && authedJson.nav?.footer?.columns?.length >= 3);

  const badHref = await fetch(`${BASE}/portal/api/nav`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      origin,
      cookie: `e5_portal=${cookieValue}`,
    },
    body: JSON.stringify({
      nav: {
        ...authedJson.nav,
        header: authedJson.nav.header.map((item, i) => (i === 0 ? { ...item, href: 'javascript:alert(1)' } : item)),
      },
    }),
  });
  const badHrefJson = await badHref.json();
  assert('PUT rejects javascript href', badHref.status === 400 && /not allowed/i.test(badHrefJson.error || ''));

  const badHttp = await fetch(`${BASE}/portal/api/nav`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      origin,
      cookie: `e5_portal=${cookieValue}`,
    },
    body: JSON.stringify({
      nav: {
        ...authedJson.nav,
        footer: {
          ...authedJson.nav.footer,
          socials: [{ id: 'evil', network: 'instagram', href: 'https://evil.example', label: 'Nope', hidden: false }],
        },
      },
    }),
  });
  assert('PUT rejects off-site social url', badHttp.status === 400);

  const hostApi = await fetch(`${BASE}/api/portal/nav`, {
    headers: { cookie: `e5_portal=${cookieValue}`, 'x-forwarded-host': 'portal.e5wheels.com' },
  });
  const hostJson = await hostApi.json();
  assert('portal host API rewrite works', hostApi.status === 200 && hostJson.nav?.header?.length >= 6);

  const hostPage = await fetch(`${BASE}/links`, {
    headers: { cookie: `e5_portal=${cookieValue}`, 'x-forwarded-host': 'portal.e5wheels.com' },
  });
  const hostPageHtml = await hostPage.text();
  assert('portal host /links loads editor', hostPage.status === 200 && hostPageHtml.includes('Header & Footer Links') && hostPageHtml.includes('WHEELS'));
} finally {
  child.kill('SIGTERM');
}

if (failed) {
  console.error(`${failed} portal section 3 checks failed`);
  process.exit(1);
}
console.log('all portal section 3 checks passed');
