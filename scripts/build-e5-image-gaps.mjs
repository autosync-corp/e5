/**
 * Catalog image-gap + square-fitment audit.
 * Writes artifacts/e5-image-gaps.csv and artifacts/e5-square-fitments.csv
 *
 * Run: node scripts/build-e5-image-gaps.mjs
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

const dir = join(tmpdir(), `e5-gaps-${Date.now()}`);
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
  join(dir, 'catalogFinish.js'),
  compile(readFileSync(join(root, 'src/core/utils/catalogFinish.ts'), 'utf8'), [
    ["from '@/core/utils/wheelUrl'", "from './wheelUrl.js'"],
    ["from '@/core/utils/priceDisplay'", "from './priceDisplay.js'"],
  ])
);
writeFileSync(
  join(dir, 'wheelUrl.js'),
  compile(readFileSync(join(root, 'src/core/utils/wheelUrl.ts'), 'utf8'))
);
writeFileSync(
  join(dir, 'priceDisplay.js'),
  compile(readFileSync(join(root, 'src/core/utils/priceDisplay.ts'), 'utf8'))
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
const { finishCodeFromPn, applyOfficialPrices } = await import(
  pathToFileURL(join(dir, 'officialPricing.js')).href
);
const { catalogFinishName } = await import(pathToFileURL(join(dir, 'catalogFinish.js')).href);
const { mergeSupplementalWheels } = await import(
  pathToFileURL(join(dir, 'supplementalWheels.js')).href
);

async function fetchAllWheels() {
  const wheels = [];
  let imgUrlBase = '';
  for (let page = 1; page <= 20; page += 1) {
    const url = new URL('https://api.autosyncstudio.com/wheels');
    url.searchParams.set('key', 'efive');
    url.searchParams.set('p-number', String(page));
    url.searchParams.set('p-size', '100');
    url.searchParams.set('i-img0001', 'true');
    url.searchParams.set('i-img0002', 'true');
    url.searchParams.set('i-img0003', 'true');
    url.searchParams.set('i-inStock', 'true');
    url.searchParams.set('i-inventory', 'true');
    url.searchParams.set('i-price', 'true');
    url.searchParams.set('i-specs', 'true');
    url.searchParams.set('i-tags', 'true');
    url.searchParams.set('f-imgFormat', 'webp');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`wheels ${response.status}`);
    const data = await response.json();
    imgUrlBase = data.ImgUrlBase;
    wheels.push(...data.Wheels);
    if (!data.MoreItems) break;
  }
  return { wheels, imgUrlBase };
}

async function fetchAllVehicles() {
  const vehicles = [];
  for (let year = 1997; year <= 2026; year += 1) {
    const url = new URL('https://api.autosyncstudio.com/vehicles');
    url.searchParams.set('key', 'efive');
    url.searchParams.set('f-make', 'Chevrolet');
    url.searchParams.set('f-model', 'Corvette');
    url.searchParams.set('f-year', String(year));
    url.searchParams.set('p-number', '1');
    url.searchParams.set('p-size', '500');
    url.searchParams.set('i-fitments', 'true');
    url.searchParams.set('i-optionalFitments', 'true');
    url.searchParams.set('i-plusSizes', 'true');
    url.searchParams.set('i-tags', 'true');
    const response = await fetch(url);
    if (!response.ok) continue;
    const data = await response.json();
    vehicles.push(...(data.Vehicles || []));
  }
  return vehicles;
}

function finishTokenFromPath(path) {
  if (!path) return null;
  const base = path.split('/').pop() || '';
  const match = base.match(/^(?:GT\.\d+|[A-Za-z0-9]+)[_-]([A-Z]{2,4})_/i);
  return match ? match[1].toUpperCase() : null;
}

function isPlaceholderPath(path) {
  if (!path) return true;
  return /placeholder|default|coming[-_]?soon|no[-_]?image/i.test(path);
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function sizeKey(fitment) {
  const diameter = fitment.RimDiameter ?? '';
  const width = fitment.RimWidth ?? (fitment.RimWidthMin != null && fitment.RimWidthMax != null
    ? `${fitment.RimWidthMin}-${fitment.RimWidthMax}`
    : '');
  return `${diameter}x${width}`;
}

const { wheels: rawWheels, imgUrlBase } = await fetchAllWheels();
const merged = applyOfficialPrices(mergeSupplementalWheels(rawWheels));
const supplementalSet = new Set(SUPPLEMENTAL_PNS);

const groups = new Map();
for (const wheel of merged) {
  const finish = catalogFinishName(wheel);
  const key = `${wheel.Model}||${finish}`;
  if (!groups.has(key)) {
    groups.set(key, {
      model: wheel.Model,
      finish,
      wheels: [],
    });
  }
  groups.get(key).wheels.push(wheel);
}

const uniquePaths = [...new Set(merged.map((wheel) => wheel.Img0001).filter(Boolean))];
const pathStatus = new Map();
await Promise.all(
  uniquePaths.map(async (path) => {
    const url = `${imgUrlBase}${path}`;
    try {
      const response = await fetch(url, { method: 'HEAD' });
      pathStatus.set(path, response.status);
    } catch {
      pathStatus.set(path, 0);
    }
  })
);

const gapRows = [];
for (const group of [...groups.values()].sort((a, b) => {
  const model = a.model.localeCompare(b.model);
  return model !== 0 ? model : a.finish.localeCompare(b.finish);
})) {
  const pns = group.wheels.map((wheel) => wheel.Pn);
  const codes = [...new Set(pns.map((pn) => finishCodeFromPn(pn)).filter(Boolean))];
  const images = [...new Set(group.wheels.map((wheel) => wheel.Img0001).filter(Boolean))];
  const states = [];

  if (images.length === 0) {
    states.push('missing Img0001');
  }

  for (const path of images) {
    const status = pathStatus.get(path);
    const token = finishTokenFromPath(path);
    const otherFinishUses = merged.some(
      (wheel) =>
        wheel.Model === group.model &&
        catalogFinishName(wheel) !== group.finish &&
        wheel.Img0001 === path
    );

    if (isPlaceholderPath(path)) {
      states.push(`placeholder (${path})`);
    }
    if (status && status >= 400) {
      states.push(`CDN ${status}: ${path}`);
    } else if (status === 0) {
      states.push(`CDN unreachable: ${path}`);
    }
    const ownsFilename = Boolean(token && codes.includes(token));
    if (token && codes.length > 0 && !ownsFilename) {
      states.push(`filename finish code is ${token} (PNs are ${codes.join('/')}; ${path})`);
    }
    if (otherFinishUses && !ownsFilename) {
      const borrowedFrom = [
        ...new Set(
          merged
            .filter(
              (wheel) =>
                wheel.Model === group.model &&
                catalogFinishName(wheel) !== group.finish &&
                wheel.Img0001 === path
            )
            .map((wheel) => catalogFinishName(wheel))
        ),
      ];
      states.push(`borrows ${borrowedFrom.join(' / ')} image (${path})`);
    }
  }

  const uniqueStates = [...new Set(states)];
  if (uniqueStates.length === 0) continue;
  gapRows.push({
    Model: group.model,
    Finish: group.finish,
    PNs: pns.join(' '),
    'Current image state': uniqueStates.join('; '),
  });
}

const artifactsDir = join(root, 'artifacts');
mkdirSync(artifactsDir, { recursive: true });
const gapCsv = [
  'Model,Finish,PNs,Current image state',
  ...gapRows.map((row) =>
    [row.Model, row.Finish, row.PNs, row['Current image state']].map(csvEscape).join(',')
  ),
].join('\n');
writeFileSync(join(artifactsDir, 'e5-image-gaps.csv'), `${gapCsv}\n`);
writeFileSync('/opt/cursor/artifacts/e5-image-gaps.csv', `${gapCsv}\n`);

const vehicles = await fetchAllVehicles();
const squareRows = [];

// No-vehicle product/listing path: every SKU is sold as 4 of one size.
squareRows.push({
  Source: 'site listing (no vehicle selected)',
  Vehicle: 'none — default Complete Set',
  Size: '4 of the selected size (square pack)',
  Notes: 'Production product page uses qty 4 / (Complete Set) until a staggered vehicle is chosen. Kept as-is. Not converted to F/R.',
});

squareRows.push({
  Source: 'curated fitments (C5–C8)',
  Vehicle: 'all curated generations/trims',
  Size: 'none — every curated option is staggered F/R',
  Notes: 'C5 stays 18x10 / 19x11 staggered. Did not force older cars onto Type-FR square plus-sizes.',
});

const seenVehicleSquare = new Set();
for (const vehicle of vehicles) {
  const label = `${vehicle.Year} ${vehicle.Make} ${vehicle.Model} ${vehicle.Submodel || ''}`.trim();
  const hasStaggeredRows = [...vehicle.Fitments, ...vehicle.OptionalFitments, ...vehicle.PlusSizes].some(
    (fit) => fit.Position === 'Front' || fit.Position === 'Rear' || fit.Type === 'F' || fit.Type === 'R'
  );

  for (const fit of vehicle.PlusSizes || []) {
    const type = (fit.Type || '').toUpperCase();
    if (type !== 'FR') continue;
    if (!fit.RimDiameter) continue;
    const key = `${label}|plus-fr|${sizeKey(fit)}`;
    if (!seenVehicleSquare.has(key)) {
      seenVehicleSquare.add(key);
      squareRows.push({
        Source: 'AutoSync PlusSizes Type FR (true square plus-size)',
        Vehicle: label,
        Size: sizeKey(fit),
        Notes: hasStaggeredRows
          ? 'front=rear; shop still treats the vehicle as staggered because Type F/R plus rows also exist. Left as-is.'
          : 'square plus-size',
      });
    }
  }
}

const squareCsv = [
  'Source,Vehicle,Size,Notes',
  ...squareRows.map((row) => [row.Source, row.Vehicle, row.Size, row.Notes].map(csvEscape).join(',')),
].join('\n');
writeFileSync(join(artifactsDir, 'e5-square-fitments.csv'), `${squareCsv}\n`);
writeFileSync('/opt/cursor/artifacts/e5-square-fitments.csv', `${squareCsv}\n`);

const added = merged.filter((wheel) => supplementalSet.has(wheel.Pn));
console.log(`catalog wheels ${rawWheels.length} + supplemental ${added.length} = ${merged.length}`);
console.log(`image-gap rows ${gapRows.length} -> artifacts/e5-image-gaps.csv`);
console.log(`square-fitment rows ${squareRows.length} -> artifacts/e5-square-fitments.csv`);
console.log('added SKUs:');
for (const wheel of added) {
  const finish = catalogFinishName(wheel);
  console.log(
    `${wheel.Pn}\t${wheel.Model}\t${finish}\t${wheel.Diameter}x${wheel.Width} +${wheel.Offset}\tunit ${wheel.Price}\tset ${wheel.Price * 4}`
  );
}
if (added.length !== 23) {
  console.error(`expected 23 supplemental SKUs, got ${added.length}`);
  process.exit(1);
}
