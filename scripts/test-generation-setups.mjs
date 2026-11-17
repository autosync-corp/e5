import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';
import { tmpdir } from 'node:os';
import { readFileSync, readdirSync } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadBundled(rel) {
  const outfile = join(tmpdir(), `e5-gen-setups-${Date.now()}-${Math.random().toString(16).slice(2)}.mjs`);
  esbuild.buildSync({
    entryPoints: [join(root, rel)],
    outfile,
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    alias: { '@': join(root, 'src') },
  });
  return import(pathToFileURL(outfile).href);
}

let failed = 0;
function assert(label, ok, extra) {
  if (!ok) {
    failed += 1;
    console.error('fail', label, extra ?? '');
  } else {
    console.log('ok  ', label);
  }
}

const { setupsForVehicle, groupSetups } = await loadBundled('src/core/utils/generationSetups.ts');

function wheel(model, finishParts, diameter, width, offset, bolt, price, pn) {
  const [Finish, Color, Accent] = finishParts;
  return {
    Accent,
    BoltCircle1: bolt,
    BoltCircle2: 0,
    Bore: 70,
    Brand: 'E5',
    Bsm: null,
    Color,
    Diameter: diameter,
    ExposedLugs: false,
    FaceStyle: '',
    Finish,
    Gtin: null,
    Id: Math.floor(Math.random() * 100000),
    Img0001: `${model}.webp`,
    Img0002: '',
    Img0003: '',
    InStock: true,
    Inventory: 1,
    LipSize: null,
    LoadRating: 1500,
    LugCount: 5,
    LugType: '',
    Material: '',
    Model: model,
    NicheTag: '',
    Offset: offset,
    Orientation: '',
    Pn: pn,
    Position: '',
    Price: price,
    SegmentTags: [],
    ShortColor: Color,
    ShortFinish: Finish,
    Structure: '',
    StyleId: 1,
    Submodel: '',
    Upc: '',
    UpdatedAt: '',
    VehicleTypeTags: [],
    Weight: null,
    Width: width,
  };
}

const catalog = {
  ImgUrlBase: 'https://img.example/',
  MoreItems: false,
  Wheels: [
    wheel('Daytona', ['Gloss', 'Black', null], 18, 10, 58, 120.65, 550, 'E5DA1810E58565BK'),
    wheel('Daytona', ['Gloss', 'Black', null], 19, 11, 59, 120.65, 700, 'E5DA1911E59565BK'),
    wheel('Sebring', [null, 'Titanium', 'Brushed'], 18, 10, 58, 120.65, 600, 'E5SE1810E58565TIU'),
    wheel('Sebring', [null, 'Titanium', 'Brushed'], 19, 11, 59, 120.65, 750, 'E5SE1911E59565TIU'),
    wheel('Talladega', [null, 'Brushed', 'Aluminum'], 20, 10, 25, 120, 2900, 'E5TA2010E25520AB'),
    wheel('Talladega', [null, 'Brushed', 'Aluminum'], 21, 13, 20, 120, 3100, 'E5TA2113E20520AB'),
    wheel('Sonoma', [null, 'Brushed', 'Aluminum'], 20, 10, 25, 120, 2900, 'E5SO2010E25520AB'),
    wheel('Sonoma', [null, 'Brushed', 'Aluminum'], 21, 13, 20, 120, 3100, 'E5SO2113E20520AB'),
    wheel('GT.01', [null, 'Brushed', 'Aluminum'], 20, 10, 25, 120, 1475, 'E5GT012010E25520AB'),
    wheel('GT.01', [null, 'Brushed', 'Aluminum'], 21, 13, 20, 120, 1675, 'E5GT012113E20520AB'),
    wheel('Sebring 2P', ['Gloss', 'Black', null], 20, 10, 25, 120, 1100, 'E5SE2P201001'),
    wheel('Sebring 2P', ['Gloss', 'Black', null], 21, 13, 20, 120, 1300, 'E5SE2P211301'),
    wheel('Laguna', [null, 'Brushed', 'Aluminum'], 20, 10, 25, 120, null, 'E5LA2010E25520AB'),
    wheel('Laguna', [null, 'Brushed', 'Aluminum'], 21, 13, 20, 120, null, 'E5LA2113E20520AB'),
  ],
};

const c5 = setupsForVehicle(catalog, 'C5', ['Z06']);
assert('C5 includes Daytona gloss black', c5.some((s) => s.model === 'Daytona' && s.finish === 'Gloss Black'));
assert('C5 includes Sebring titanium', c5.some((s) => s.model === 'Sebring'));
assert('C5 excludes C8 Talladega', c5.every((s) => s.model !== 'Talladega'));
assert('C5 is staggered', c5.every((s) => s.staggered));
assert(
  'C5 Daytona set price is 2+2',
  c5.find((s) => s.model === 'Daytona')?.priceLabel === '$2,500.00'
);

const c8 = setupsForVehicle(catalog, 'C8', ['Z06']);
assert('C8 Z06 has Talladega', c8.some((s) => s.model === 'Talladega'));
assert('C8 Z06 has Sonoma', c8.some((s) => s.model === 'Sonoma'));
assert('C8 Z06 has GT.01', c8.some((s) => s.model === 'GT.01'));
assert('C8 Z06 has Sebring 2P', c8.some((s) => s.model === 'Sebring 2P'));
assert('C8 Z06 has Laguna CALL', c8.find((s) => s.model === 'Laguna')?.priceLabel === 'CALL');
assert('C8 Z06 excludes Daytona 18"', c8.every((s) => s.model !== 'Daytona'));
assert(
  'C8 Talladega shop URL is vehicle-preselected',
  c8.find((s) => s.model === 'Talladega')?.shopHref.includes('/shop/talladega/') &&
    c8.find((s) => s.model === 'Talladega')?.shopHref.includes('c8-z06')
);

const offsetMismatch = setupsForVehicle(
  {
    ImgUrlBase: catalog.ImgUrlBase,
    Wheels: [
      wheel('Talladega', [null, 'Brushed', 'Aluminum'], 20, 10, 35, 120, 2900, 'E5TA2010E35520AB'),
      wheel('Talladega', [null, 'Brushed', 'Aluminum'], 21, 13, 52, 120, 3100, 'E5TA2113E52520AB'),
    ],
  },
  'C8',
  ['Z06']
);
assert(
  'shop-picker diameter+width still lists a 20x10 SKU whose offset differs from curated +25',
  offsetMismatch.some((s) => s.model === 'Talladega' && s.frontLabel.includes('+25'))
);

const apiBoltMismatch = setupsForVehicle(
  {
    ImgUrlBase: catalog.ImgUrlBase,
    Wheels: [
      wheel('Sonoma', [null, 'Brushed', 'Aluminum'], 20, 10, 25, 120.65, 2900, 'E5SO2010E25520AB'),
      wheel('Sonoma', [null, 'Brushed', 'Aluminum'], 21, 13, 20, 120.65, 3100, 'E5SO2113E20520AB'),
    ],
  },
  'C8',
  ['Z06']
);
assert(
  'C8 Z06 still lists Sonoma when AutoSync bolt is 120.65',
  apiBoltMismatch.some((s) => s.model === 'Sonoma')
);

const zr1 = setupsForVehicle(catalog, 'C8', ['ZR1']);
assert('ZR1 excludes Sebring 2P', zr1.every((s) => s.model !== 'Sebring 2P'));
assert('ZR1 keeps Talladega', zr1.some((s) => s.model === 'Talladega'));

const grouped = groupSetups(c8);
assert('family order starts FORM or 2P', grouped[0].family === '2P FORGED' || grouped[0].family === 'E5 FORGED');
assert('GT group present', grouped.some((g) => g.family === 'GT FORGED'));

function astroPages(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...astroPages(full));
    else if (entry.name.endsWith('.astro')) out.push(full);
  }
  return out;
}
const genPages = astroPages(join(root, 'src/pages/generations')).filter(
  (p) => !p.endsWith('/generations/index.astro')
);
for (const page of genPages) {
  const src = readFileSync(page, 'utf8');
  const rel = page.slice(join(root, 'src/pages/generations/').length);
  assert(`${rel} loads catalog setups`, src.includes('loadGenerationSetups') && src.includes('<GenerationSetups'));
}

if (failed) {
  console.error(`${failed} generation setup checks failed`);
  process.exit(1);
}
console.log('all generation setup checks passed');
