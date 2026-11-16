/**
 * Node checks for vehicle-first shopping + model wordmarks.
 * Run: node scripts/test-vehicle-first.mjs
 */
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { buildSync, transformSync } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));

function loadTs(rel) {
  const src = readFileSync(join(here, rel), 'utf8');
  const { code } = transformSync(src, { loader: 'ts', format: 'esm' });
  const moduleUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  return import(moduleUrl);
}

function loadBundled(rel) {
  const outfile = join(mkdtempSync(join(tmpdir(), 'e5-vf-')), 'out.mjs');
  buildSync({
    entryPoints: [join(here, rel)],
    bundle: true,
    format: 'esm',
    outfile,
    platform: 'neutral',
  });
  writeFileSync(outfile, readFileSync(outfile, 'utf8'));
  return import(pathToFileURL(outfile).href);
}

const { hasStaggeredFitment, usesStaggeredSet } = await loadTs('../src/core/services/VehicleService.ts');
const { modelWordmarkSrc, MODEL_WORDMARK_SLUGS } = await loadBundled('../src/core/utils/modelWordmark.ts');

let failed = 0;
function assert(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    failed += 1;
    console.error(`FAIL ${name}\n  expected ${JSON.stringify(expected)}\n  actual   ${JSON.stringify(actual)}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

const emptyFit = { Fitments: [], OptionalFitments: [], PlusSizes: [] };
const plusFR = {
  ...emptyFit,
  PlusSizes: [
    { Position: null, Type: 'F' },
    { Position: null, Type: 'R' },
    { Position: null, Type: 'FR' },
  ],
};

const c5 = { Year: 2001, Make: 'Chevrolet', Model: 'Corvette', Submodel: 'Z06', ...plusFR };
assert('C5 plus F/R still looks staggered to raw detector', hasStaggeredFitment(c5), true);
assert('C5 shops as a square set', usesStaggeredSet(c5), false);

const c5Base = { Year: 1997, Make: 'Chevrolet', Model: 'Corvette', Submodel: 'Coupe', ...plusFR };
assert('C5 Base shops as a square set', usesStaggeredSet(c5Base), false);

const c8 = {
  Year: 2023,
  Make: 'Chevrolet',
  Model: 'Corvette',
  Submodel: 'Z06',
  Fitments: [{ Position: 'Front', Type: null }, { Position: 'Rear', Type: null }],
  OptionalFitments: [],
  PlusSizes: [{ Position: null, Type: 'F' }, { Position: null, Type: 'R' }],
};
assert('C8 shops as a staggered set', usesStaggeredSet(c8), true);

const c7 = {
  Year: 2018,
  Make: 'Chevrolet',
  Model: 'Corvette',
  Submodel: 'Stingray',
  Fitments: [],
  OptionalFitments: [],
  PlusSizes: [{ Position: null, Type: 'F' }, { Position: null, Type: 'R' }],
};
assert('C7 plus F/R shops staggered', usesStaggeredSet(c7), true);

assert('Daytona wordmark', modelWordmarkSrc('Daytona'), '/assets/images/logos/e5-daytona.webp');
assert('Sebring 2P wordmark', modelWordmarkSrc('Sebring 2P'), '/assets/images/logos/e5-sebring-2p.webp');
assert('Talladega wordmark', modelWordmarkSrc('Talladega'), '/assets/images/logos/e5-talladega.webp');
assert('GT.01 has no wordmark file', modelWordmarkSrc('GT.01'), null);
assert('GT.04 has no wordmark file', modelWordmarkSrc('GT.04'), null);
assert('empty model has no wordmark', modelWordmarkSrc(''), null);
assert('known wordmark count', MODEL_WORDMARK_SLUGS.length, 7);

if (failed) {
  console.error(`\n${failed} failing assertion(s)`);
  process.exit(1);
}
console.log('\nall vehicle-first checks passed');
