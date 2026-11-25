import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createHmac, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
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

const auth = read('src/core/portal/auth.ts');
const host = read('src/core/portal/host.ts');
const portal = read('src/pages/portal/index.astro');
const login = read('src/core/portal/PortalLogin.astro');
const section = read('src/pages/portal/[section].astro');
const layout = read('src/layouts/PortalLayout.astro');
const logout = read('src/pages/portal/logout.ts');
const mw = read('src/middleware.ts');
const astro = read('astro.config.mjs');
const robots = read('public/robots.txt');
const vercel = read('vercel.json');
const docs = read('docs/PORTAL.md');
const staff = read('src/pages/admin/index.astro');
const staffLogout = read('src/pages/admin/logout.ts');

assert('portal docs exist', existsSync(join(root, 'docs/PORTAL.md')));
assert('hash helper exists', existsSync(join(root, 'scripts/hash-portal-password.mjs')));
assert('staff ops stays at /admin', staff.includes('Admin Panel') && staff.includes("redirect('/admin')") && staff.includes('Coupons') && !existsSync(join(root, 'src/pages/admin/ops')));
assert('staff logout is unchanged', staffLogout.includes("delete('admin_auth'") && !staffLogout.includes('e5_portal'));
assert('portal lives under /portal', portal.includes('Client Portal') && login.includes('Client Portal'));
assert('portal host is portal.e5wheels.com', host.includes("PORTAL_HOST = 'portal.e5wheels.com'") && mw.includes('isPortalHost') && mw.includes('rewrite('));
assert('www /portal redirects to portal host', mw.includes('isProductionSiteHost') && mw.includes('PORTAL_ORIGIN'));
assert('hashed password env', auth.includes('PORTAL_PASSWORD_HASH') && auth.includes('scrypt'));
assert('no ADMIN_PASSWORD login fallback', !auth.includes("env('ADMIN_PASSWORD')") && auth.includes('portalConfigError'));
assert('session cookie httpOnly signed', auth.includes("PORTAL_COOKIE = 'e5_portal'") && auth.includes('httpOnly: true') && auth.includes("createHmac('sha256'"));
assert('cookie path is host-aware', auth.includes("isPortalHost(request) ? '/' : '/portal'"));
assert('rate limit on login', auth.includes('e5:portal:login:') && auth.includes('LOGIN_MAX_ATTEMPTS'));
assert('users list is extendable', auth.includes('PORTAL_USERS') && docs.includes('e5:portal:users'));
assert('logout clears portal cookie', logout.includes('clearSessionCookie'));
assert('coming soon placeholders', portal.includes('Coming soon') && section.includes('Coming soon'));
assert('planned nav sections', layout.includes('PORTAL_SECTIONS') && read('src/core/portal/sections.ts').includes('Homepage Slides') && read('src/core/portal/sections.ts').includes('Sales & Prospects'));
assert('no price editing in portal', portal.includes('not editable'));
assert('docs forbid price editing', docs.includes('not editable') && docs.includes('AutoSync'));
assert('docs plan Upstash live publish', docs.includes('Upstash') && docs.includes('no draft') && docs.includes('e5:portal:slides'));
assert('sitemap excludes /admin and /portal', astro.includes("'/admin'") && astro.includes("'/portal'"));
assert('robots disallow /admin and /portal', robots.includes('Disallow: /admin/') && robots.includes('Disallow: /portal/'));
assert('portal host robots Disallow /', read('src/pages/portal/robots.txt.ts').includes('Disallow: /') && vercel.includes('/portal/robots.txt') && vercel.includes('portal.e5wheels.com'));
assert('vercel redirects portal host / to /login', (() => {
  const cfg = JSON.parse(vercel);
  return cfg.redirects.some((r) => r.source === '/' && r.destination === '/login' && r.statusCode === 302 && r.has?.some((h) => h.value === 'portal.e5wheels.com'));
})());
assert('vercel catch-all sends other portal-host paths to www', (() => {
  const cfg = JSON.parse(vercel);
  const catchAll = cfg.redirects.find((r) => r.statusCode === 302 && String(r.destination || '').startsWith('https://www.e5wheels.com/') && r.has?.some((h) => h.value === 'portal.e5wheels.com'));
  const src = String(catchAll?.source || '');
  return src.includes('login') && src.includes('slides') && src.includes('api/portal') && src.includes('assets') && src.includes('_astro') && (catchAll?.destination || '').includes(':path');
})());
assert('vercel dest-rewrites portal login and sections before filesystem', vercel.includes('"dest": "/portal"') && vercel.includes('/portal/$1') && vercel.includes('/portal/robots.txt'));
assert('noindex on portal pages', login.includes('noindex, nofollow') && layout.includes('noindex, nofollow'));
assert('middleware noindex for portal', mw.includes("'X-Robots-Tag'") && mw.includes('noindex, nofollow'));
assert('middleware no-store for portal and Set-Cookie', mw.includes('private, no-store') && mw.includes('portalHeaders') && mw.includes("headers.has('set-cookie')"));
assert('site fonts in shell', layout.includes('Franklin Gothic') && layout.includes('fonts.css'));
assert('portal pages are SSR', portal.includes('prerender = false') && section.includes('prerender = false'));

const vercelCfg = JSON.parse(vercel);
const slashPublic = vercelCfg.headers.find(
  (h) => h.source === '/' && h.headers.some((x) => (x.value || '').includes('s-maxage=3600')),
);
assert(
  'homepage / cache excludes portal host',
  JSON.stringify(slashPublic?.missing) === JSON.stringify([{ type: 'host', value: 'portal.e5wheels.com' }]),
);
const portalRoot = vercelCfg.headers.find(
  (h) => h.source === '/' && h.has?.some((x) => x.type === 'host' && x.value === 'portal.e5wheels.com'),
);
const portalCatch = vercelCfg.headers.find(
  (h) => h.source === '/(.*)' && h.has?.some((x) => x.type === 'host' && x.value === 'portal.e5wheels.com'),
);
function headerIs(rule, key, value) {
  return !!rule?.headers?.some((x) => x.key === key && x.value === value);
}
assert(
  'portal host / is private no-store + noindex',
  headerIs(portalRoot, 'Cache-Control', 'private, no-store') && headerIs(portalRoot, 'X-Robots-Tag', 'noindex, nofollow'),
);
assert(
  'portal host /(.*) is private no-store + noindex',
  headerIs(portalCatch, 'Cache-Control', 'private, no-store') && headerIs(portalCatch, 'X-Robots-Tag', 'noindex, nofollow'),
);

const password = 'portal-test-pass';
const N = 16384;
const r = 8;
const p = 1;
const keylen = 32;
const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, keylen, { N, r, p });
const hash = `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
const secret = 'portal-test-session-secret-32bytes!!';

const PORT = process.env.PORTAL_TEST_PORT || '8791';
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
  const isNoStore = (res) => {
    const cc = (res.headers.get('cache-control') || '').toLowerCase();
    return cc.includes('private') && cc.includes('no-store');
  };
  const loginPage = await fetch(`${BASE}/portal`);
  const loginHtml = await loginPage.text();
  assert('GET /portal is 200 login', loginPage.status === 200 && loginHtml.includes('Client Portal') && loginHtml.includes('name="password"'));
  assert('GET /portal noindex', loginPage.headers.get('x-robots-tag') === 'noindex, nofollow' && loginHtml.includes('noindex, nofollow'));
  assert('GET /portal is no-store', isNoStore(loginPage));
  assert('login does not leak hash', !loginHtml.includes('scrypt$') && !loginHtml.includes(password));

  const staffPage = await fetch(`${BASE}/admin`);
  const staffHtml = await staffPage.text();
  assert('GET /admin is staff ops', staffPage.status === 200 && staffHtml.includes('Admin Panel') && !staffHtml.includes('Client Portal'));

  const portalHostLogin = await fetch(`${BASE}/login`, { headers: { 'x-forwarded-host': 'portal.e5wheels.com' } });
  const portalHostHtml = await portalHostLogin.text();
  assert('portal host /login is login', portalHostLogin.status === 200 && portalHostHtml.includes('Client Portal') && portalHostLogin.headers.get('x-robots-tag') === 'noindex, nofollow');
  assert('portal host /login is no-store', isNoStore(portalHostLogin));

  const portalShop = await fetch(`${BASE}/shop`, { headers: { 'x-forwarded-host': 'portal.e5wheels.com' }, redirect: 'manual' });
  assert('portal host /shop redirects to www', portalShop.status === 302 && (portalShop.headers.get('location') || '') === 'https://www.e5wheels.com/shop');
  assert('portal host /shop redirect is no-store', isNoStore(portalShop));

  const portalRobots = await fetch(`${BASE}/portal/robots.txt`);
  const portalRobotsBody = await portalRobots.text();
  assert('portal robots disallow all', portalRobots.status === 200 && portalRobotsBody.includes('Disallow: /') && !portalRobotsBody.includes('Allow: /'));

  const wwwPortal = await fetch(`${BASE}/portal`, { headers: { 'x-forwarded-host': 'www.e5wheels.com' }, redirect: 'manual' });
  assert('www /portal redirects to portal /login', wwwPortal.status === 301 && (wwwPortal.headers.get('location') || '') === 'https://portal.e5wheels.com/login');
  assert('www /portal redirect is no-store', isNoStore(wwwPortal));

  const wwwPortalSlides = await fetch(`${BASE}/portal/slides`, { headers: { 'x-forwarded-host': 'www.e5wheels.com' }, redirect: 'manual' });
  assert('www /portal/slides redirects to portal /slides', wwwPortalSlides.status === 301 && (wwwPortalSlides.headers.get('location') || '') === 'https://portal.e5wheels.com/slides');

  const bad = await fetch(`${BASE}/portal/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin,
      'x-forwarded-for': '203.0.113.9',
    },
    body: 'password=wrong',
    redirect: 'manual',
  });
  const badHtml = await bad.text();
  const badCookie = bad.headers.get('set-cookie') || '';
  assert('bad password stays on login', bad.status === 200 && badHtml.includes('Invalid password'));
  assert('bad password does not set session', !badCookie.includes('e5_portal=') || /e5_portal=deleted/i.test(badCookie));

  const good = await fetch(`${BASE}/portal/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin,
      'x-forwarded-for': '203.0.113.10',
    },
    body: `password=${encodeURIComponent(password)}`,
    redirect: 'manual',
  });
  const setCookie = good.headers.getSetCookie?.() || (good.headers.get('set-cookie') ? [good.headers.get('set-cookie')] : []);
  const sessionCookie = setCookie.find((c) => c.startsWith('e5_portal=')) || '';
  assert('good password redirects', good.status === 302 && (good.headers.get('location') || '').includes('/portal'));
  assert('login Set-Cookie response is no-store', isNoStore(good) && sessionCookie.includes('e5_portal='));
  assert('session cookie is httpOnly', /httponly/i.test(sessionCookie) && sessionCookie.includes('e5_portal='));
  assert('session cookie path /portal on preview', /path=\/portal/i.test(sessionCookie));
  assert('session cookie is not the password', !sessionCookie.includes(password));
  const cookieValue = sessionCookie.split(';')[0].replace('e5_portal=', '');
  const [body, sig] = cookieValue.split('.');
  const expectedSig = createHmac('sha256', secret).update(body).digest('base64url');
  assert('session cookie HMAC verifies', !!body && !!sig && timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig)));

  const dash = await fetch(`${BASE}/portal`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const dashHtml = await dash.text();
  assert('dashboard renders after login', dash.status === 200 && dashHtml.includes('Dashboard') && dashHtml.includes('Coming soon') && dashHtml.includes('Homepage Slides'));
  assert('dashboard is no-store', isNoStore(dash));
  assert('dashboard uses site type', dashHtml.includes('Franklin Gothic'));
  assert('dashboard has logout', dashHtml.includes('/portal/logout'));

  const soon = await fetch(`${BASE}/portal/galleries`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const soonHtml = await soon.text();
  assert('section placeholder coming soon', soon.status === 200 && soonHtml.includes('Galleries') && soonHtml.includes('Coming soon'));

  const unauth = await fetch(`${BASE}/portal/galleries`, { redirect: 'manual' });
  assert('section redirects when logged out', unauth.status === 302);

  const out = await fetch(`${BASE}/portal/logout`, {
    headers: { cookie: `e5_portal=${cookieValue}` },
    redirect: 'manual',
  });
  const outCookie = (out.headers.get('set-cookie') || '').toLowerCase();
  assert('logout redirects to login', out.status === 302);
  assert('logout Set-Cookie response is no-store', isNoStore(out));
  assert('logout clears cookie', outCookie.includes('e5_portal=') && (outCookie.includes('max-age=0') || outCookie.includes('expires=')));

  const hostLogin = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin,
      'x-forwarded-host': 'portal.e5wheels.com',
      'x-forwarded-for': '203.0.113.11',
    },
    body: `password=${encodeURIComponent(password)}`,
    redirect: 'manual',
  });
  const hostCookie = (hostLogin.headers.getSetCookie?.() || []).find((c) => c.startsWith('e5_portal=')) || hostLogin.headers.get('set-cookie') || '';
  assert('portal host login sets cookie path /', hostLogin.status === 302 && /path=\/(;|$)/i.test(hostCookie));
  assert('portal host login Set-Cookie is no-store', isNoStore(hostLogin));
  assert('portal host login lands on /login', (hostLogin.headers.get('location') || '').endsWith('/login'));

  const hostDash = await fetch(`${BASE}/login`, {
    headers: { 'x-forwarded-host': 'portal.e5wheels.com', cookie: hostCookie.split(';')[0] },
  });
  const hostDashHtml = await hostDash.text();
  assert('portal host /login shows dashboard when signed in', hostDash.status === 200 && hostDashHtml.includes('Dashboard') && hostDashHtml.includes('Coming soon'));

  for (let i = 0; i < 8; i += 1) {
    await fetch(`${BASE}/portal/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        origin,
        'x-forwarded-for': '203.0.113.55',
      },
      body: 'password=wrong',
      redirect: 'manual',
    });
  }
  const lockRes = await fetch(`${BASE}/portal/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      origin,
      'x-forwarded-for': '203.0.113.55',
    },
    body: `password=${encodeURIComponent(password)}`,
    redirect: 'manual',
  });
  const lockHtml = await lockRes.text();
  assert('login rate limit locks after 8 failures', lockHtml.includes('Too many attempts'));
} catch (err) {
  failed += 1;
  console.error('fail live server', err);
} finally {
  child.kill('SIGTERM');
}

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall passed');
