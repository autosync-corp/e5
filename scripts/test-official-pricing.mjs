/**
 * Checks for the official E5 price file and PN overlay rules.
 * Run: node scripts/test-official-pricing.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const csvPath = join(here, '../src/data/e5-official-pricing.csv');
const csv = readFileSync(csvPath, 'utf8');

const src = readFileSync(join(here, '../src/core/utils/officialPricing.ts'), 'utf8')
  .replace(
    "import officialPricingCsv from '@/data/e5-official-pricing.csv?raw';",
    'const officialPricingCsv = globalThis.__E5_OFFICIAL_CSV;'
  );
const { code } = transformSync(src, { loader: 'ts', format: 'esm' });
const moduleUrl = `data:text/javascript;base64,${Buffer.from(
  `globalThis.__E5_OFFICIAL_CSV = ${JSON.stringify(csv)};\n${code}`
).toString('base64')}`;
const {
  parseOfficialPricingCsv,
  officialPriceByPn,
  applyOfficialPrice,
  finishCodeFromPn,
} = await import(moduleUrl);

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

const parsed = parseOfficialPricingCsv(csv);
assert('csv row count', parsed.size, 286);
assert('map matches parser', officialPriceByPn.size, parsed.size);

assert('Sebring 2P BZPL 211209 is $1200 not $1050', parsed.get('E5SE2P211209'), 1200);
assert('sibling BZPL 211212 stays $1200', parsed.get('E5SE2P211212'), 1200);

assert('GT.01 AB PN is $1375', parsed.get('E5GT011910E30565AB'), 1375);
assert('GT.01 BK PN is $1325 (suffix, not Submodel AB)', parsed.get('E5GT011910E30565BK'), 1325);
assert('GT.01 SB PN is $1325', parsed.get('E5GT011910E30565SB'), 1325);
assert('GT.01 BK suffix from PN', finishCodeFromPn('E5GT011910E30565BK'), 'BK');
assert('GT.01 AB suffix from PN', finishCodeFromPn('E5GT011910E30565AB'), 'AB');

assert('Laguna gloss black front', parsed.get('E5LA2010E25520BK'), 2800);
assert('Sonoma satin black rear', parsed.get('E5SO2113E20520SB'), 3000);
assert('Talladega AB front unchanged', parsed.get('E5TA2010E25520AB'), 2900);

const overlaid = applyOfficialPrice({ Pn: 'E5GT011910E30565BK', Price: null });
assert('overlay fills CALL GT.01 BK', overlaid.Price, 1325);

const sebringFix = applyOfficialPrice({ Pn: 'E5SE2P211209', Price: 1050 });
assert('overlay raises BZPL 211209 from catalog $1050', sebringFix.Price, 1200);

const untouched = applyOfficialPrice({ Pn: 'NOT-A-SKU', Price: null });
assert('missing PN stays CALL', untouched.Price, null);

const already = applyOfficialPrice({ Pn: 'E5TA2010E25520AB', Price: 2900 });
assert('matching catalog price stays', already.Price, 2900);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall official pricing checks passed');
