/**
 * Node checks for CALL vs real-price display rules.
 * Run: node scripts/test-price-display.mjs
 */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { transformSync } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '../src/core/utils/priceDisplay.ts'), 'utf8');
const { code } = transformSync(src, { loader: 'ts', format: 'esm' });
const moduleUrl = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
const {
  hasRealPrice,
  formatPrice,
  formatPriceOrCall,
  priceRangeFromProducts,
  formatPriceRangeOrCall,
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

assert('null is not a real price', hasRealPrice(null), false);
assert('undefined is not a real price', hasRealPrice(undefined), false);
assert('0 is not a real price', hasRealPrice(0), false);
assert('NaN is not a real price', hasRealPrice(Number.NaN), false);
assert('550 is a real price', hasRealPrice(550), true);
assert('format 550', formatPrice(550), '$550.00');
assert('CALL for null', formatPriceOrCall(null), 'CALL');
assert('CALL for 0', formatPriceOrCall(0), 'CALL');
assert('keep $550.00', formatPriceOrCall(550), '$550.00');
assert('keep $2,900.00', formatPriceOrCall(2900), '$2,900.00');

assert(
  'range of priced SKUs only',
  priceRangeFromProducts([{ Price: 550 }, { Price: 850 }, { Price: null }, { Price: 0 }]),
  { min: 550, max: 850 }
);
assert(
  'null range when nothing is priced',
  priceRangeFromProducts([{ Price: null }, { Price: 0 }]),
  null
);
assert(
  'CALL when a finish has no priced SKUs',
  formatPriceRangeOrCall([{ Price: null }, { Price: null }]),
  'CALL'
);
assert(
  'single real price stays a single price',
  formatPriceRangeOrCall([{ Price: 770 }, { Price: 770 }, { Price: null }]),
  '$770.00'
);
assert(
  'priced min-max ignores nulls instead of collapsing to $0.00',
  formatPriceRangeOrCall([{ Price: 600 }, { Price: 1100 }, { Price: null }]),
  '$600.00 - $1,100.00'
);

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall price display checks passed');
