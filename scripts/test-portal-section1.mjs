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
const portal = read('src/pages/admin/index.astro');
const login = read('src/core/portal/PortalLogin.astro');
const section = read('src/pages/admin/[section].astro');
const layout = read('src/layouts/PortalLayout.astro');
const logout = read('src/pages/admin/logout.ts');
const mw = read('src/middleware.ts');
const astro = read('astro.config.mjs');
const robots = read('public/robots.txt');
const docs = read('docs/PORTAL.md');
const ops = read('src/pages/admin/ops/index.astro');

assert('portal docs exist', existsSync(join(root, 'docs/PORTAL.md')));
assert('hash helper exists', existsSync(join(root, 'scripts/hash-portal-password.mjs')));
assert('staff ops moved to /admin/ops', ops.includes("redirect('/admin/ops')") && ops.includes('Coupons'));
assert('portal owns /admin', portal.includes('Client Portal') && login.includes('action="/admin"') && login.includes('Client Portal'));
assert('hashed password env', auth.includes('PORTAL_PASSWORD_HASH') && auth.includes('scrypt'));
assert('session cookie httpOnly signed', auth.includes("PORTAL_COOKIE = 'e5_portal'") && auth.includes('httpOnly: true') && auth.includes("createHmac('sha256'"));
assert('rate limit on login', auth.includes('e5:portal:login:') && auth.includes('LOGIN_MAX_ATTEMPTS'));
assert('users list is extendable', auth.includes('PORTAL_USERS') && docs.includes('e5:portal:users'));
assert('logout clears portal cookie', logout.includes('clearSessionCookie'));
assert('coming soon placeholders', portal.includes('Coming soon') && section.includes('Coming soon'));
assert('planned nav sections', layout.includes('Homepage Slides') && layout.includes('Header & Footer Links') && layout.includes('Blog Posts') && layout.includes('Galleries') && layout.includes('Site Performance') && layout.includes('Sales & Prospects'));
assert('ghl called out', portal.includes('GoHighLevel') || layout.includes('GoHighLevel') || read('src/core/portal/sections.ts').includes('GoHighLevel'));
assert('no price editing in portal', !portal.includes('price') || portal.includes('not editable'));
assert('docs forbid price editing', docs.includes('not editable') && docs.includes('AutoSync'));
assert('docs plan Upstash live publish', docs.includes('Upstash') && docs.includes('no draft') && docs.includes('e5:portal:slides'));
assert('sitemap excludes /admin', astro.includes("'/admin'"));
assert('robots disallow /admin', robots.includes('Disallow: /admin/'));
assert('noindex on portal pages', login.includes('noindex, nofollow') && layout.includes('noindex, nofollow'));
assert('middleware X-Robots-Tag for /admin', mw.includes("pathname.startsWith('/admin/')") && mw.includes("'X-Robots-Tag'") && mw.includes('noindex, nofollow'));
assert('site fonts in shell', layout.includes('Franklin Gothic') && layout.includes("fonts.css"));
assert('portal pages are SSR', portal.includes('prerender = false') && section.includes('prerender = false'));

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
  const loginPage = await fetch(`${BASE}/admin`);
  const loginHtml = await loginPage.text();
  assert('GET /admin is 200 login', loginPage.status === 200 && loginHtml.includes('Client Portal') && loginHtml.includes('name="password"'));
  assert('GET /admin noindex', loginPage.headers.get('x-robots-tag') === 'noindex, nofollow' && loginHtml.includes('noindex, nofollow'));
  assert('login does not leak hash', !loginHtml.includes('scrypt$') && !loginHtml.includes(password));

  const bad = await fetch(`${BASE}/admin`, {
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

  const good = await fetch(`${BASE}/admin`, {
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
  assert('good password redirects', good.status === 302 && (good.headers.get('location') || '').includes('/admin'));
  assert('session cookie is httpOnly', /httponly/i.test(sessionCookie) && sessionCookie.includes('e5_portal='));
  assert('session cookie is not the password', !sessionCookie.includes(password));
  const cookieValue = sessionCookie.split(';')[0].replace('e5_portal=', '');
  const [body, sig] = cookieValue.split('.');
  const expectedSig = createHmac('sha256', secret).update(body).digest('base64url');
  assert('session cookie HMAC verifies', !!body && !!sig && timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig)));

  const dash = await fetch(`${BASE}/admin`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const dashHtml = await dash.text();
  assert('dashboard renders after login', dash.status === 200 && dashHtml.includes('Dashboard') && dashHtml.includes('Coming soon') && dashHtml.includes('Homepage Slides'));
  assert('dashboard uses site type', dashHtml.includes('Franklin Gothic'));
  assert('dashboard has logout', dashHtml.includes('/admin/logout'));

  const soon = await fetch(`${BASE}/admin/slides`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const soonHtml = await soon.text();
  assert('section placeholder coming soon', soon.status === 200 && soonHtml.includes('Homepage Slides') && soonHtml.includes('Coming soon'));

  const unauth = await fetch(`${BASE}/admin/slides`, { redirect: 'manual' });
  assert('section redirects when logged out', unauth.status === 302);

  const opsPage = await fetch(`${BASE}/admin/ops`);
  assert('staff ops still served', opsPage.status === 200 && (await opsPage.text()).includes('Admin Panel'));

  const out = await fetch(`${BASE}/admin/logout`, {
    headers: { cookie: `e5_portal=${cookieValue}` },
    redirect: 'manual',
  });
  const outCookie = (out.headers.get('set-cookie') || '').toLowerCase();
  assert('logout redirects to login', out.status === 302);
  assert('logout clears cookie', outCookie.includes('e5_portal=') && (outCookie.includes('max-age=0') || outCookie.includes('expires=')));

  let locked = false;
  for (let i = 0; i < 8; i += 1) {
    await fetch(`${BASE}/admin`, {
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
  const lockRes = await fetch(`${BASE}/admin`, {
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
  locked = lockHtml.includes('Too many attempts');
  assert('login rate limit locks after 8 failures', locked);
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
