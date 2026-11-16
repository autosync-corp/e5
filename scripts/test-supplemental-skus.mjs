/**
 * Decode + merge checks for the 23 official-CSV PNs AutoSync omits.
 * Run: node scripts/test-supplemental-skus.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import { transformSync } from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const csv = readFileSync(join(root, 'src/data/e5-official-pricing.csv'), 'utf8');

function compile(src, replacements = []) {
  let next = src;
  for (const [from, to] of replacements) next = next.replace(from, to);
  return transformSync(next, { loader: 'ts', format: 'esm' }).code;
}

const dir = join(tmpdir(), `e5-supp-${Date.now()}`);
mkdirSync(dir, { recursive: true });

writeFileSync(
  join(dir, 'skus.js'),
  compile(readFileSync(join(root, 'src/data/e5-supplemental-skus.ts'), 'utf8'))
);

writeFileSync(
  join(dir, 'officialPricing.js'),
  compile(readFileSync(join(root, 'src/core/utils/officialPricing.ts'), 'utf8'), [
    [
      "import officialPricingCsv from '@/data/e5-official-pricing.csv?raw';",
      `const officialPricingCsv = ${JSON.stringify(csv)};`,
    ],
  ])
);

writeFileSync(
  join(dir, 'supplementalWheels.js'),
  compile(readFileSync(join(root, 'src/core/utils/supplementalWheels.ts'), 'utf8'), [
    ["from '@/data/e5-supplemental-skus'", "from './skus.js'"],
    ["from '@/core/utils/officialPricing'", "from './officialPricing.js'"],
    ["import type { WheelProduct } from '@/core/services/ProductService';", ''],
  ])
);

const { SUPPLEMENTAL_PNS } = await import(pathToFileURL(join(dir, 'skus.js')).href);
const { officialPriceForPn } = await import(pathToFileURL(join(dir, 'officialPricing.js')).href);
const { decodeE5Pn, buildSupplementalWheel, mergeSupplementalWheels } = await import(
  pathToFileURL(join(dir, 'supplementalWheels.js')).href
);

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

assert('23 supplemental PNs', SUPPLEMENTAL_PNS.length, 23);

assert('Daytona 20x12 BBT', decodeE5Pn('E5DA2012E45565BBT'), {
  modelCode: 'DA',
  model: 'Daytona',
  diameter: 20,
  width: 12,
  offset: 45,
  boltCode: '565',
  finishCode: 'BBT',
});
assert('Sebring 19x8.5 BK (width tenths)', decodeE5Pn('E5SE1985E30520BK'), {
  modelCode: 'SE',
  model: 'Sebring',
  diameter: 19,
  width: 8.5,
  offset: 30,
  boltCode: '520',
  finishCode: 'BK',
});
assert('Talladega 21x13 SB', decodeE5Pn('E5TA2113E20520SB'), {
  modelCode: 'TA',
  model: 'Talladega',
  diameter: 21,
  width: 13,
  offset: 20,
  boltCode: '520',
  finishCode: 'SB',
});
assert('rejects Sebring 2P shape', decodeE5Pn('E5SE2P211209'), null);

const sibling = {
  Accent: 'Brushed Tint',
  BoltCircle1: 120.65,
  BoltCircle2: 0,
  Bore: 70.3,
  Brand: 'E5',
  Bsm: null,
  Color: 'Bronze',
  Diameter: 19,
  ExposedLugs: false,
  FaceStyle: 'Concave',
  Finish: null,
  Gtin: null,
  Id: 1,
  Img0001: 'E5/Daytona_BBT_Bronze_Brushed_Tint_5-lug_0001.webp',
  Img0002: 'E5/Daytona_BBT_0002.webp',
  Img0003: 'E5/Daytona_BBT_0003.webp',
  InStock: true,
  Inventory: 10,
  LipSize: null,
  LoadRating: 1800,
  LugCount: 5,
  LugType: 'Conical',
  Material: 'Flow Formed',
  Model: 'Daytona',
  NicheTag: 'Daytona',
  Offset: 50,
  Orientation: 'Inset',
  Pn: 'E5DA1910E50565BBT',
  Position: 'Front',
  Price: 550,
  SegmentTags: [],
  ShortColor: 'Bronze',
  ShortFinish: null,
  Structure: '1-Piece',
  StyleId: 1,
  Submodel: 'BBT',
  Upc: '111',
  UpdatedAt: '',
  VehicleTypeTags: [],
  Weight: null,
  Width: 10,
};

const talladegaAb = {
  ...sibling,
  Id: 2,
  Model: 'Talladega',
  NicheTag: 'Talladega',
  Pn: 'E5TA2010E25520AB',
  Finish: 'Brushed',
  Color: 'Aluminum',
  Accent: null,
  ShortFinish: 'Brushed',
  ShortColor: 'Silver',
  Submodel: 'AB',
  Diameter: 20,
  Width: 10,
  Offset: 25,
  BoltCircle1: 120,
  Price: 2900,
  Img0001: 'E5/Talladega_AB_Brushed_Aluminum_5-lug_0001.webp',
  Material: 'Forged',
};

const talladegaBk = {
  ...talladegaAb,
  Id: 3,
  Pn: 'E5TA2010E25520BK',
  Finish: 'Gloss',
  Color: 'Black',
  ShortFinish: 'Gloss',
  ShortColor: 'Black',
  Submodel: 'BK',
  Price: 2900,
  Img0001: 'E5/Talladega_BK_Gloss_Black_5-lug_e5ta2010e25520bk_0001.webp',
};

const sebringBk = {
  ...sibling,
  Id: 4,
  Model: 'Sebring',
  NicheTag: 'Sebring',
  Pn: 'E5SE1910E30565BK',
  Finish: 'Gloss',
  Color: 'Black',
  Accent: null,
  ShortFinish: 'Gloss',
  ShortColor: 'Black',
  Submodel: 'BK',
  Diameter: 19,
  Width: 10,
  Offset: 30,
  Price: 600,
  Img0001: 'E5/Sebring_BK_Gloss_Black_5-lug_0001.webp',
};

const catalog = [sibling, talladegaAb, talladegaBk, sebringBk];
const extra = buildSupplementalWheel('E5DA2012E45565BBT', catalog, 0);
assert('clone keeps Daytona BBT finish fields', extra.Color, 'Bronze');
assert('clone keeps BBT accent', extra.Accent, 'Brushed Tint');
assert('new size 20x12', extra.Width, 12);
assert('new diameter 20', extra.Diameter, 20);
assert('new offset +45', extra.Offset, 45);
assert('official unit price', extra.Price, 750);
assert('keeps 5x120.65 bolt', extra.BoltCircle1, 120.65);
assert('borrows same-finish image', extra.Img0001, sibling.Img0001);
assert('synthetic id', extra.Id, 9_000_001);

const polished = buildSupplementalWheel('E5TA2010E25520PO', catalog, 19);
assert('Talladega PO finish name', polished.Finish, 'Polished');
assert('Talladega PO has no borrowed color', polished.Color, '');
assert('Talladega PO unit price', polished.Price, officialPriceForPn('E5TA2010E25520PO'));
assert('Talladega PO borrows AB image', polished.Img0001, talladegaAb.Img0001);
assert('Talladega PO bolt 5x120', polished.BoltCircle1, 120);

const satin = buildSupplementalWheel('E5TA2113E20520SB', catalog, 22);
assert('Talladega SB finish', satin.Finish, 'Satin');
assert('Talladega SB color', satin.Color, 'Black');
assert('Talladega SB size 21x13', [satin.Diameter, satin.Width], [21, 13]);
assert('Talladega SB borrows BK image', satin.Img0001, talladegaBk.Img0001);
assert('Talladega SB unit price', satin.Price, 3000);

const merged = mergeSupplementalWheels(catalog);
const added = merged.filter((wheel) => SUPPLEMENTAL_PNS.includes(wheel.Pn));
assert('merge adds every PN that has a sibling', added.length, 23);
assert('does not duplicate existing PNs', merged.filter((w) => w.Pn === sibling.Pn).length, 1);

const expected = {
  E5DA2012E45565BBT: { model: 'Daytona', finish: 'BBT', size: '20x12', unit: 750, set: 3000 },
  E5DA2090E38520BBT: { model: 'Daytona', finish: 'BBT', size: '20x9', unit: 650, set: 2600 },
  E5DA1910E50565BK: { model: 'Daytona', finish: 'BK', size: '19x10', unit: 550, set: 2200 },
  E5DA2011E73565BK: { model: 'Daytona', finish: 'BK', size: '20x11', unit: 700, set: 2800 },
  E5DA2090E38520BK: { model: 'Daytona', finish: 'BK', size: '20x9', unit: 650, set: 2600 },
  E5DA1910E50565TIU: { model: 'Daytona', finish: 'TIU', size: '19x10', unit: 550, set: 2200 },
  E5DA2011E73565TIU: { model: 'Daytona', finish: 'TIU', size: '20x11', unit: 700, set: 2800 },
  E5DA2090E38520TIU: { model: 'Daytona', finish: 'TIU', size: '20x9', unit: 650, set: 2600 },
  E5SE2012E45565BBT: { model: 'Sebring', finish: 'BBT', size: '20x12', unit: 700, set: 2800 },
  E5SE2090E38520BBT: { model: 'Sebring', finish: 'BBT', size: '20x9', unit: 650, set: 2600 },
  E5SE1985E30520BK: { model: 'Sebring', finish: 'BK', size: '19x8.5', unit: 550, set: 2200 },
  E5SE1990E50565BK: { model: 'Sebring', finish: 'BK', size: '19x9', unit: 600, set: 2400 },
  E5SE2011E73565BK: { model: 'Sebring', finish: 'BK', size: '20x11', unit: 700, set: 2800 },
  E5SE2012E45565BK: { model: 'Sebring', finish: 'BK', size: '20x12', unit: 700, set: 2800 },
  E5SE2090E38520BK: { model: 'Sebring', finish: 'BK', size: '20x9', unit: 650, set: 2600 },
  E5SE1990E50565TIU: { model: 'Sebring', finish: 'TIU', size: '19x9', unit: 600, set: 2400 },
  E5SE2011E73565TIU: { model: 'Sebring', finish: 'TIU', size: '20x11', unit: 700, set: 2800 },
  E5SE2012E45565TIU: { model: 'Sebring', finish: 'TIU', size: '20x12', unit: 700, set: 2800 },
  E5SE2090E38520TIU: { model: 'Sebring', finish: 'TIU', size: '20x9', unit: 650, set: 2600 },
  E5TA2010E25520PO: { model: 'Talladega', finish: 'PO', size: '20x10', unit: 2900, set: 11600 },
  E5TA2113E20520PO: { model: 'Talladega', finish: 'PO', size: '21x13', unit: 3100, set: 12400 },
  E5TA2010E25520SB: { model: 'Talladega', finish: 'SB', size: '20x10', unit: 2800, set: 11200 },
  E5TA2113E20520SB: { model: 'Talladega', finish: 'SB', size: '21x13', unit: 3000, set: 12000 },
};

for (const [pn, want] of Object.entries(expected)) {
  assert(`${pn} CSV unit`, officialPriceForPn(pn), want.unit);
  const decoded = decodeE5Pn(pn);
  assert(`${pn} model`, decoded.model, want.model);
  assert(`${pn} finish code`, decoded.finishCode, want.finish);
  assert(`${pn} size`, `${decoded.diameter}x${decoded.width}`, want.size);
  assert(`${pn} set x4`, officialPriceForPn(pn) * 4, want.set);
}

if (failed) {
  console.error(`\n${failed} failed`);
  process.exit(1);
}
console.log('\nall supplemental SKU checks passed');
