import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(root, 'public');

function loadBundled(rel) {
  const outfile = join(tmpdir(), `e5-shop-wm-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`);
  esbuild.buildSync({
    entryPoints: [join(root, rel)],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    packages: 'external',
  });
  return import(pathToFileURL(outfile).href);
}

let failed = 0;
function assert(label, ok) {
  if (!ok) {
    failed += 1;
    console.error('fail', label);
  } else {
    console.log('ok  ', label);
  }
}

const {
  modelWordmarkSrc,
  seriesWordmarkForModel,
  modelWordmarkFit,
} = await loadBundled('src/core/utils/modelWordmark.ts');

const models = [
  ['Daytona', '/assets/images/logos/e5-daytona.webp', 'Form Forged'],
  ['Sebring', '/assets/images/logos/e5-sebring.webp', 'Form Forged'],
  ['Speedway', '/assets/images/logos/e5-speedway.webp', 'Form Forged'],
  ['Sebring 2P', '/assets/images/logos/e5-sebring-2p.webp', '2P Forged'],
  ['Sonoma', '/assets/images/logos/e5-sonoma.webp', 'E5 Forged'],
  ['Talladega', '/assets/images/logos/e5-talladega.webp', 'E5 Forged'],
  ['Laguna', '/assets/images/logos/e5-laguna.webp', 'E5 Forged'],
  ['GT.01', '/assets/images/logos/gt-01-wordmark.png', 'GT Forged'],
  ['GT.02', '/assets/images/logos/gt-02-wordmark.png', 'GT Forged'],
  ['GT.03', '/assets/images/logos/gt-03-wordmark.png', 'GT Forged'],
  ['GT.04', '/assets/images/logos/gt-04-wordmark.png', 'GT Forged'],
];

for (const [name, src, seriesAlt] of models) {
  assert(`${name} model wordmark`, modelWordmarkSrc(name) === src);
  assert(`${name} file exists`, existsSync(join(publicRoot, src.replace(/^\//, ''))));
  assert(`${name} series wordmark`, seriesWordmarkForModel(name)?.alt === seriesAlt);
}

assert('unknown model stays text', modelWordmarkSrc('Not A Wheel') === null);
assert('sonoma fit', modelWordmarkFit('Sonoma') === 'sonoma');
assert('gt fit', modelWordmarkFit('GT.04') === 'gt');
assert('daytona default fit', modelWordmarkFit('Daytona') === 'default');

const shop = readFileSync(join(root, 'src/pages/shop/components/_ShopPage.vue'), 'utf8');
assert('shop uses model wordmarks', shop.includes('modelWordmarkSrc') && shop.includes('wordmarkSrc'));
assert('shop keeps sr-only name', shop.includes("series.wordmarkSrc ? 'sr-only'"));
assert('shop uses series logos on headers', shop.includes('seriesLogo') && shop.includes('shop-series-logo'));
assert('height-based contain', shop.includes('object-fit: contain') && shop.includes('max-height'));
assert('uses existing logo files', shop.includes('/assets/images/logos') || shop.includes('modelWordmarkSrc'));

if (failed) {
  console.error(`${failed} shop wordmark checks failed`);
  process.exit(1);
}
console.log('all shop wordmark checks passed');
