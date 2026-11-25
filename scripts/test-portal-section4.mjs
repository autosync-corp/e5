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

const posts = read('src/core/portal/posts.ts');
const html = read('src/core/portal/html.ts');
const listPage = read('src/pages/portal/blog.astro');
const editorPage = read('src/pages/portal/blog/[slug].astro');
const publicIndex = read('src/pages/blog/index.astro');
const publicPost = read('src/pages/blog/[slug].astro');
const listApi = read('src/pages/portal/api/posts/index.ts');
const itemApi = read('src/pages/portal/api/posts/[slug].ts');
const uploadApi = read('src/pages/portal/api/posts/upload.ts');
const sitemap = read('src/pages/sitemap-blog.xml.ts');
const sections = read('src/core/portal/sections.ts');
const host = read('src/core/portal/host.ts');
const layout = read('src/layouts/PortalLayout.astro');
const vercel = read('vercel.json');
const robots = read('public/robots.txt');
const docs = read('docs/PORTAL.md');
const staff = read('src/pages/admin/index.astro');
const section1 = read('scripts/test-portal-section1.mjs');

assert('blog section is ready', sections.includes("slug: 'blog'") && /slug: 'blog'[\s\S]*?ready: true/.test(sections));
assert('blog soon badge removed', /slug: 'blog'[\s\S]*?ready: true[\s\S]*?slug: 'galleries'/.test(sections));
assert('portal list page exists', existsSync(join(root, 'src/pages/portal/blog.astro')) && listPage.includes('Blog Posts') && listPage.includes('New post'));
assert('portal editor exists', existsSync(join(root, 'src/pages/portal/blog/[slug].astro')) && editorPage.includes('Show on the live blog') && editorPage.includes('data-save'));
assert('delete confirm on list and editor', listPage.includes('window.confirm') && editorPage.includes('window.confirm'));
assert('redis keys', posts.includes("POSTS_INDEX_KEY = 'e5:portal:posts:index'") && posts.includes('e5:portal:posts:${slug}'));
assert('wordpress is the unedited source', posts.includes("WP_API = 'https://post.e5wheels.com/wp-json/wp/v2'") && publicIndex.includes('loadPublicPosts') && publicPost.includes('loadPublicPost'));
assert('public pages are SSR', publicIndex.includes('prerender = false') && publicPost.includes('prerender = false') && publicIndex.includes('set:html={post.titleHtml}') && publicPost.includes('set:html={post.bodyHtml}'));
assert('unpublished 404 and deleted 410', publicPost.includes("status === 'unpublished'") && publicPost.includes('Astro.response.status = 404') && publicPost.includes("status === 'gone'") && publicPost.includes('Astro.response.status = 410'));
assert('unknown slug still redirects to /blog', publicPost.includes("status === 'missing'") && publicPost.includes("redirect('/blog')"));
assert('sanitizer strips script iframe on*', html.includes("'script'") && html.includes("'iframe'") && html.includes("key.startsWith('on')") && html.includes('mailto:'));
assert('markdown headings bold lists images', html.includes('markdownToHtml') && html.includes('<strong>') && html.includes('<ul>') && html.includes('<img'));
assert('auth on portal post APIs', listApi.includes('requirePortalSession') && itemApi.includes('requirePortalSession') && itemApi.includes('requireSameOrigin') && uploadApi.includes('requireSameOrigin'));
assert('blob upload jpeg png webp 4mb', uploadApi.includes('@vercel/blob') && uploadApi.includes('image/webp') && uploadApi.includes('MAX_IMAGE_BYTES') && uploadApi.includes('portal/blog/'));
assert('sitemap-blog is SSR', sitemap.includes('loadPublicPosts') && sitemap.includes('s-maxage=60') && robots.includes('sitemap-blog.xml'));
assert('robots still lists main sitemap', robots.includes('sitemap-index.xml'));
assert('portal host allows nested blog paths', host.includes("pathname.startsWith('/blog/')") && vercel.includes('/portal/blog/$1') && vercel.includes('blog(?:/.*)?'));
assert('editor copy is plain language', !listPage.includes('Upstash') && !listPage.includes('Redis') && !listPage.includes('Vercel Blob') && !editorPage.includes('Upstash') && !editorPage.includes('markdown') && !editorPage.includes('JSON-LD'));
assert('no jargon on public blog copy', !publicIndex.includes('Upstash') && !publicIndex.includes('Redis') && !publicPost.includes('Upstash'));
assert('staff admin is unchanged', staff.includes('Admin Panel') && staff.includes('Coupons'));
assert('docs describe section 4', docs.includes('Section 4') && docs.includes('e5:portal:posts') && docs.includes('post.e5wheels.com') && docs.includes('sitemap-blog.xml'));
assert('section 1 coming-soon moved off blog', section1.includes('/portal/galleries') && !section1.includes("fetch(`${BASE}/portal/blog`"));
assert('layout nested blog is active', layout.includes('currentInternal.startsWith'));
assert('editor excerpt decoder exists', html.includes('export function cleanEditorExcerpt') && html.includes('&hellip;') && html.includes('&#8230;'));
assert('editor excerpt decoder strips trailing ellipsis marker', /\[\s*(?:\\u2026|\\.{3}|hellip)/.test(html) || html.includes('[...]') || html.includes('hellip'));
assert('public mapWp excerpt is not cleaned', /excerpt: stripTags\(excerptHtml\)/.test(posts) && /cleanEditorExcerpt\(post\.excerpt\)/.test(posts));
assert('cover placeholder when empty', editorPage.includes('No cover photo') && editorPage.includes('data-cover-empty') && editorPage.includes('referrerpolicy="no-referrer"'));
const mainLayout = read('src/layouts/MainLayout.astro');
const banner = read('src/core/components/BannerSlider.astro');
assert('header offset is in first-paint CSS', mainLayout.includes('main.mt-107') && mainLayout.includes('margin-top: 107px') && mainLayout.includes('nav.fixed.top-0') && mainLayout.includes('height: 107px') && mainLayout.includes('.mobile-nav { display: none; }'));
assert('banner does not add a second 107px offset', /\\.e5-banner \\{[^}]*margin-top:\\s*107px/.test(banner) === false);

const password = 'portal-test-pass';
const N = 16384;
const r = 8;
const p = 1;
const keylen = 32;
const salt = randomBytes(16);
const derived = await scryptAsync(password, salt, keylen, { N, r, p });
const hash = `scrypt$${N}$${r}$${p}$${salt.toString('base64url')}$${derived.toString('base64url')}`;
const secret = 'portal-test-session-secret-32bytes!!';
const PORT = process.env.PORTAL_BLOG_TEST_PORT || '8795';
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
  const origin = BASE;

  const index = await fetch(`${BASE}/blog`);
  const indexHtml = await index.text();
  assert('public blog index is SSR html', index.status === 200 && indexHtml.includes('<h1') && indexHtml.includes('Blog') && indexHtml.includes('Tips, guides, and insights'));
  assert('public blog index is crawlable cards or empty', indexHtml.includes('No posts yet.') || indexHtml.includes('Read More'));

  const known = await fetch(`${BASE}/blog/cracked-oem-c7-corvette-wheels`);
  const knownHtml = await known.text();
  if (known.status === 200 && knownHtml.includes('blog-content')) {
    assert('existing post keeps canonical', knownHtml.includes('rel="canonical"') && knownHtml.includes('/blog/cracked-oem-c7-corvette-wheels'));
    assert('existing post keeps json-ld', knownHtml.includes('BlogPosting') && knownHtml.includes('BreadcrumbList') && knownHtml.includes('E5 Wheels'));
    assert('existing post body is in html', knownHtml.includes('blog-content') && knownHtml.length > 2000);
  } else {
    assert('existing post reachable or redirected while WP is down', known.status === 200 || known.status === 302);
  }

  const missing = await fetch(`${BASE}/blog/this-slug-does-not-exist-e5-portal-test`, { redirect: 'manual' });
  assert('unknown slug redirects to /blog', missing.status === 302 && (missing.headers.get('location') || '').includes('/blog'));

  const sm = await fetch(`${BASE}/sitemap-blog.xml`);
  const smText = await sm.text();
  assert('sitemap-blog is xml', sm.status === 200 && smText.includes('<urlset') && smText.includes(`${'https://www.e5wheels.com'}/blog`));
  assert('sitemap-blog cache header', (sm.headers.get('cache-control') || '').includes('s-maxage=60'));
  if (smText.includes('cracked-oem-c7-corvette-wheels')) {
    assert('known live post is in sitemap', true);
  } else {
    assert('sitemap still lists the blog index', smText.includes('/blog</loc>') || smText.includes('/blog<'));
  }

  const unauthGet = await fetch(`${BASE}/portal/api/posts`);
  assert('portal posts GET is 401 logged out', unauthGet.status === 401);

  const unauthPut = await fetch(`${BASE}/portal/api/posts/test-post`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ title: 'Nope', slug: 'test-post', bodyMarkdown: 'Hi', published: true, replaceBody: true }),
  });
  assert('portal posts PUT is 401 logged out', unauthPut.status === 401);

  const unauthPage = await fetch(`${BASE}/portal/blog`, { redirect: 'manual' });
  assert('blog page redirects when logged out', unauthPage.status === 302);

  const login = await fetch(`${BASE}/portal/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', origin },
    body: `password=${encodeURIComponent(password)}`,
    redirect: 'manual',
  });
  const setCookie = login.headers.getSetCookie?.() || (login.headers.get('set-cookie') ? [login.headers.get('set-cookie')] : []);
  const sessionCookie = setCookie.find((c) => c.startsWith('e5_portal=')) || '';
  const cookieValue = sessionCookie.split(';')[0].replace('e5_portal=', '');
  assert('login for blog editor', login.status === 302 && cookieValue);

  const editor = await fetch(`${BASE}/portal/blog`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const editorHtml = await editor.text();
  assert(
    'blog list renders',
    editor.status === 200 &&
      editorHtml.includes('Blog Posts') &&
      editorHtml.includes('New post') &&
      !editorHtml.includes('Coming soon') &&
      !editorHtml.includes('Upstash') &&
      !editorHtml.includes('Redis'),
  );
  assert('editor uses site type', editorHtml.includes('Franklin Gothic'));

  const newPage = await fetch(`${BASE}/portal/blog/new`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const newHtml = await newPage.text();
  assert(
    'new post editor renders',
    newPage.status === 200 &&
      newHtml.includes('New post') &&
      newHtml.includes('Web address') &&
      newHtml.includes('Short description') &&
      newHtml.includes('Cover photo') &&
      newHtml.includes('Post text') &&
      newHtml.includes('Show on the live blog') &&
      !newHtml.includes('Upstash') &&
      !newHtml.includes('BLOB_READ_WRITE_TOKEN'),
  );

  const authedGet = await fetch(`${BASE}/portal/api/posts`, { headers: { cookie: `e5_portal=${cookieValue}` } });
  const authedJson = await authedGet.json();
  assert('authed GET lists posts array', authedGet.status === 200 && Array.isArray(authedJson.posts));

  const missingOrigin = await fetch(`${BASE}/portal/api/posts/test-post`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      cookie: `e5_portal=${cookieValue}`,
    },
    body: JSON.stringify({ title: 'Test', slug: 'test-post', bodyMarkdown: 'Hello', replaceBody: true, published: false }),
  });
  assert('PUT without Origin is 403', missingOrigin.status === 403);

  const badJs = await fetch(`${BASE}/portal/api/posts/test-post`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      origin,
      cookie: `e5_portal=${cookieValue}`,
    },
    body: JSON.stringify({
      title: 'Test',
      slug: 'test-post',
      bodyMarkdown: '[x](javascript:alert(1))',
      replaceBody: true,
      published: false,
    }),
  });
  const badJsJson = await badJs.json();
  assert('PUT rejects javascript links', badJs.status === 400 && /script|javascript/i.test(badJsJson.error || ''));

  const emptyTitle = await fetch(`${BASE}/portal/api/posts/test-post`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      origin,
      cookie: `e5_portal=${cookieValue}`,
    },
    body: JSON.stringify({ title: '  ', slug: 'test-post', bodyMarkdown: 'Hello', replaceBody: true, published: false }),
  });
  assert('PUT rejects empty title', emptyTitle.status === 400);

  const hostPage = await fetch(`${BASE}/blog`, {
    headers: { cookie: `e5_portal=${cookieValue}`, 'x-forwarded-host': 'portal.e5wheels.com' },
  });
  const hostPageHtml = await hostPage.text();
  assert('portal host /blog loads list', hostPage.status === 200 && hostPageHtml.includes('Blog Posts') && hostPageHtml.includes('New post'));

  const hostNew = await fetch(`${BASE}/blog/new`, {
    headers: { cookie: `e5_portal=${cookieValue}`, 'x-forwarded-host': 'portal.e5wheels.com' },
  });
  const hostNewHtml = await hostNew.text();
  assert('portal host /blog/new loads editor', hostNew.status === 200 && hostNewHtml.includes('New post') && hostNewHtml.includes('Post text'));

  function excerptValue(htmlText) {
    const match = htmlText.match(/data-excerpt[^>]*>([\s\S]*?)<\/textarea>/);
    return match ? match[1] : '';
  }

  const wpEditor = await fetch(`${BASE}/portal/blog/2018-corvette-c7-wheels`, {
    headers: { cookie: `e5_portal=${cookieValue}` },
  });
  const wpEditorHtml = await wpEditor.text();
  const editorExcerpt = excerptValue(wpEditorHtml);
  if (wpEditor.status === 200 && wpEditorHtml.includes('data-excerpt')) {
    assert(
      'WP excerpt is decoded in the editor',
      editorExcerpt.includes('because') &&
        !editorExcerpt.includes('&#8211;') &&
        !editorExcerpt.includes('&hellip;') &&
        !editorExcerpt.includes('[&hellip;]') &&
        !/\[\s*(?:\u2026|\.{3})\s*\]/.test(editorExcerpt),
    );
    assert(
      '2018 cover preview uses the featured image',
      wpEditorHtml.includes('corvette-c7') && wpEditorHtml.includes('data-cover-preview') && !wpEditorHtml.includes('hidden="">No cover photo'),
    );
  } else {
    assert('2018 editor reachable while WP is up', wpEditor.status === 200 || wpEditor.status === 404);
  }

  const noCoverEditor = await fetch(`${BASE}/portal/blog/best-corvette-clubs-in-california`, {
    headers: { cookie: `e5_portal=${cookieValue}` },
  });
  const noCoverHtml = await noCoverEditor.text();
  if (noCoverEditor.status === 200 && noCoverHtml.includes('Cover photo')) {
    assert('post without featured image shows No cover photo', noCoverHtml.includes('No cover photo') && !/data-cover-preview[^>]+src="https?:/.test(noCoverHtml));
  } else {
    assert('clubs editor reachable while WP is up', noCoverEditor.status === 200 || noCoverEditor.status === 404);
  }

  const public2018 = await fetch(`${BASE}/blog/2018-corvette-c7-wheels`);
  const public2018Html = await public2018.text();
  if (public2018.status === 200) {
    assert(
      'unedited public meta still has the WP excerpt',
      public2018Html.includes('&#8211;') || public2018Html.includes('&amp;#8211;') || public2018Html.includes('[&hellip;]') || public2018Html.includes('[&amp;hellip;]'),
    );
  } else {
    assert('2018 public post reachable or redirected while WP is down', public2018.status === 200 || public2018.status === 302);
  }
} finally {
  child.kill('SIGTERM');
}

if (failed) {
  console.error(`${failed} portal section 4 checks failed`);
  process.exit(1);
}
console.log('all portal section 4 checks passed');
