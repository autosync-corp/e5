/**
 * Dump live catalog setups for each generation page.
 * Run: node scripts/dump-generation-setups.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import esbuild from 'esbuild';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function loadBundled(rel) {
  const dir = mkdtempSync(join(tmpdir(), 'e5-dump-'));
  const outfile = join(dir, 'out.mjs');
  await esbuild.build({
    entryPoints: [join(root, rel)],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'node',
    alias: { '@': join(root, 'src') },
    define: {
      'import.meta.env.PUBLIC_AUTOSYNC_API_KEY': JSON.stringify(process.env.PUBLIC_AUTOSYNC_API_KEY || 'efive'),
    },
    plugins: [
      {
        name: 'csv-raw',
        setup(build) {
          build.onResolve({ filter: /\.csv\?raw$/ }, (args) => ({
            path: join(root, 'src/data', args.path.replace(/^.*\//, '').replace(/\?raw$/, '')),
            namespace: 'raw-text',
          }));
          build.onLoad({ filter: /.*/, namespace: 'raw-text' }, (args) => ({
            contents: readFileSync(args.path, 'utf8'),
            loader: 'text',
          }));
        },
      },
    ],
  });
  return import(pathToFileURL(outfile).href);
}

const { fetchWheels } = await loadBundled('src/core/services/ProductService.ts');
const { setupsForVehicle } = await loadBundled('src/core/utils/generationSetups.ts');
const { getCuratedFitment } = await loadBundled('src/core/constants/CuratedFitments.ts');

const catalog = await fetchWheels();
const pages = [
  ['/generations/c5', 'C5', ['Base', 'Z06']],
  ['/generations/c5/c5-z06', 'C5', ['Z06']],
  ['/generations/c6', 'C6', ['Base']],
  ['/generations/c6/c6-grand-sport', 'C6', ['Grand Sport']],
  ['/generations/c7', 'C7', ['Stingray', 'Grand Sport', 'Z06']],
  ['/generations/c7/c7-stingray', 'C7', ['Stingray']],
  ['/generations/c7/c7-grand-sport', 'C7', ['Grand Sport']],
  ['/generations/c7/c7-z06', 'C7', ['Z06']],
  ['/generations/c8', 'C8', ['Stingray', 'Z06', 'ZR1', 'E-Ray']],
  ['/generations/c8/c8-stingray', 'C8', ['Stingray']],
  ['/generations/c8/c8-e-ray', 'C8', ['E-Ray']],
  ['/generations/c8/c8-z06', 'C8', ['Z06']],
  ['/generations/c8/c8-zr1', 'C8', ['ZR1']],
];

const missing = [
  ['C5 Base dedicated page', 'C5', 'Base'],
  ['C6 Z06 dedicated page', 'C6', 'Z06'],
  ['C6 ZR1 dedicated page', 'C6', 'ZR1'],
  ['C7 ZR1 dedicated page', 'C7', 'ZR1'],
];

const report = {};
for (const [path, gen, trims] of pages) {
  const setups = setupsForVehicle(catalog, gen, trims);
  report[path] = setups.map((s) => ({
    family: s.family,
    name: `${s.model} ${s.finish}`,
    sizes: `${s.frontLabel} / ${s.rearLabel}`,
    staggered: s.staggered,
    price: s.priceLabel,
    href: s.shopHref,
  }));
}

const missingReport = missing.map(([label, gen, trim]) => ({
  label,
  curated: getCuratedFitment(gen, trim) != null,
  setupCount: setupsForVehicle(catalog, gen, [trim]).length,
  names: setupsForVehicle(catalog, gen, [trim]).map((s) => `${s.model} ${s.finish}`),
}));

const models = [...new Set(catalog.Wheels.map((w) => w.Model))].sort();
console.log(JSON.stringify({ models, pages: report, missing: missingReport, wheelCount: catalog.Wheels.length }, null, 2));
writeFileSync('/tmp/generation-setups-dump.json', JSON.stringify({ models, pages: report, missing: missingReport, wheelCount: catalog.Wheels.length }, null, 2));
