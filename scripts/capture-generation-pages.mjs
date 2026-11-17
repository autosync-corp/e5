import { mkdirSync, writeFileSync } from 'node:fs';
import puppeteer from 'puppeteer-core';

const OUT = '/opt/cursor/artifacts';
mkdirSync(OUT, { recursive: true });
const BASE = (process.env.BASE || 'http://127.0.0.1:8098').replace(/\/$/, '');
const PREFIX = process.env.PREFIX || 'gen';

const pages = [
  { slug: 'c8-z06', path: '/generations/c8/c8-z06', minSetups: 10 },
  { slug: 'c5', path: '/generations/c5', minSetups: 3 },
];

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: 'new',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    `--user-data-dir=/tmp/e5-gen-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  ],
});

function viewportFor(name) {
  if (name === 'mobile') return { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true };
  return { width: 1280, height: 900, deviceScaleFactor: 1, isMobile: false };
}

const metrics = [];

async function shot(pageDef, name) {
  const page = await browser.newPage();
  page.setDefaultTimeout(90000);
  await page.setViewport(viewportFor(name));
  const resp = await page.goto(`${BASE}${pageDef.path}`, { waitUntil: 'networkidle2', timeout: 90000 });
  await page.waitForSelector('[data-generation-setups]', { timeout: 45000 });
  await page.waitForFunction(
    (min) => document.querySelectorAll('[data-setup]').length >= min,
    { timeout: 45000 },
    pageDef.minSetups
  );
  await page.addStyleTag({
    content: `astro-dev-toolbar, #chat-widget-container, iframe[src*="livechat"], .lc-1x7d4y0 { display: none !important; }`,
  }).catch(() => {});
  const info = await page.evaluate(() => {
    const setups = [...document.querySelectorAll('[data-setup]')].map((el) => el.getAttribute('data-setup'));
    const section = document.querySelector('[data-generation-setups]');
    const box = section?.getBoundingClientRect();
    return {
      title: document.title,
      setups,
      setupTop: box ? Math.round(window.scrollY + box.top) : 0,
      shopHrefs: [...document.querySelectorAll('[data-generation-setups] a[href^="/shop/"]')].map((a) => a.getAttribute('href')),
    };
  });
  const file = `${OUT}/${PREFIX}-${pageDef.slug}-after-${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  // Crop the setups grid so the after state is readable without the full hero.
  const crop = `${OUT}/${PREFIX}-${pageDef.slug}-after-${name}-setups.png`;
  await page.evaluate(() => {
    document.querySelector('[data-generation-setups]')?.scrollIntoView({ block: 'start' });
  });
  await new Promise((r) => setTimeout(r, 300));
  const clip = await page.evaluate(() => {
    const section = document.querySelector('[data-generation-setups]');
    const box = section.getBoundingClientRect();
    const y = Math.max(0, Math.round(window.scrollY + box.top - 12));
    const height = Math.min(2400, Math.round(box.height + 24));
    return { x: 0, y, width: window.innerWidth, height };
  });
  await page.screenshot({ path: crop, clip });
  metrics.push({
    page: pageDef.path,
    viewport: name,
    status: resp?.status(),
    file,
    crop,
    setupCount: info.setups.length,
    setups: info.setups,
    shopHrefs: info.shopHrefs.slice(0, 8),
  });
  console.log(name, pageDef.path, 'status', resp?.status(), 'setups', info.setups.length, file);
  await page.close();
}

for (const pageDef of pages) {
  for (const vp of ['desktop', 'mobile']) {
    await shot(pageDef, vp);
  }
}

writeFileSync(`${OUT}/${PREFIX}-after-metrics.json`, JSON.stringify(metrics, null, 2));
await browser.close();
console.log('wrote', `${OUT}/${PREFIX}-after-metrics.json`);
