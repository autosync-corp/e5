#!/usr/bin/env node

// Regenerates public/visualizer-app/fitment-catalog.json - the data that
// drives the new visualizer's (/e5-visualizer) "SHOP THIS FITMENT" /
// "DOES NOT FIT THIS VEHICLE" / "REQUEST A QUOTE" button.
//
// Cross-references the LIVE product catalog (api.autosyncstudio.com/wheels)
// against src/core/constants/CuratedFitments.ts's approved fitment sizes
// per generation/trim, for every (generation, wheel style, dropdown finish)
// combination the visualizer offers. Three possible outcomes per combo:
//   'fit'    - a real product exists at this generation's curated size.
//   'no-fit' - the style/finish is a real product, just not manufactured
//              in this generation's specific size (e.g. Speedway doesn't
//              come in C7 Stingray's fitment at all).
//   'quote'  - no product exists for this style/finish in any size.
//
// Run this again whenever the live catalog changes (new finishes, new
// sizes) or CuratedFitments.ts is updated - keep the CURATED_FITMENTS
// object below in sync with that file by hand (this script doesn't parse
// TypeScript, so it can't import it directly).
//
// Usage: node scripts/generate-visualizer-fitment-catalog.js

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'visualizer-app', 'fitment-catalog.json');

// Keep this in sync with src/core/constants/CuratedFitments.ts's CURATED_FITMENTS.
const CURATED_FITMENTS = [
  { generation: 'C8', trims: ['Z06', 'ZR1', 'ZR-1', 'E-Ray'],
    options: [{ front: [20, 10, 25], rear: [21, 13, 20] }] },
  { generation: 'C8', trims: ['Stingray', 'Base'],
    options: [{ front: [19, 9, 35], rear: [20, 11, 45] },
              { front: [20, 9, 35], rear: [21, 12, 52] }] },
  { generation: 'C7', trims: ['Z06', 'Grand Sport'],
    options: [{ front: [19, 10, 30], rear: [20, 12, 50] }] },
  { generation: 'C7', trims: ['Stingray', 'Base'],
    options: [{ front: [19, 9.5, 53], rear: [20, 11, 76] }] },
  { generation: 'C6', trims: ['Z06', 'Grand Sport'],
    options: [{ front: [19, 10, 30], rear: [20, 12, 50] }] },
  { generation: 'C6', trims: ['Base'],
    options: [{ front: [19, 9.5, 53], rear: [20, 11, 76] }] },
  { generation: 'C5', trims: ['Base', 'Z06'],
    options: [{ front: [18, 10, 58], rear: [19, 11, 59] }] },
];

function getCurated(generation, trim) {
  const entry = CURATED_FITMENTS.find(e => e.generation === generation && e.trims.includes(trim));
  return entry ? entry.options : null;
}

// visualizer generation key -> [generation, trim]
const VIZ_GENS = {
  C5: ['C5', 'Z06'],
  C6_Grand_Sport: ['C6', 'Grand Sport'],
  C6_Z06: ['C6', 'Base'],
  C7_Grand_Sport: ['C7', 'Grand Sport'],
  C7_Stingray: ['C7', 'Stingray'],
  C7_Z06: ['C7', 'Z06'],
  C8_Z06: ['C8', 'Z06'],
  C8_Stingray: ['C8', 'Stingray'],
};

const STYLES = ['Daytona', 'Sebring', 'Speedway'];
// Must match GENS[key].wcs in e5wheels-visualizer_9.html.
const DROPDOWN_FINISHES = ['Bronze Brushed Tint', 'Chrome', 'Gloss Black', 'Gloss Gunmetal',
  'Gloss White', 'Hyper Silver', 'Satin Black', 'Satin Gunmetal', 'Titanium'];
// The dropdown uses one simplified label per swatch, but the real catalog
// sometimes uses a different name for the same physical finish on a given
// style (Speedway's bronze is a distinct "Dark Bronze" product; "Titanium"
// can be "Titanium Brushed" or "Titanium Brushed Tint" depending on model).
const FINISH_ALIASES = {
  Titanium: ['Titanium Brushed', 'Titanium Brushed Tint'],
  'Bronze Brushed Tint': ['Bronze Brushed Tint', 'Dark Bronze'],
};
const candidateFinishes = (f) => FINISH_ALIASES[f] || [f];

// --- src/core/utils/wheelUrl.ts's slug logic, faithfully ported ---
function toSlug(text) {
  if (!text) return '';
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-')
    .replace(/^-+/, '').replace(/-+$/, '');
}
function normalizeSizeForUrl(size) {
  if (!size) return '';
  let normalized = size.replace(/"/g, '').replace(/\s+/g, '').replace(/x/gi, 'x').toLowerCase();
  return normalized.replace(/([+-]\d+)mm/g, (_m, offset) =>
    offset.startsWith('+') ? `-et${offset.substring(1)}` : `-et${offset}`);
}
function buildStaggeredSize(front, rear) {
  return `${normalizeSizeForUrl(front)}-${normalizeSizeForUrl(rear)}`;
}
function buildVehicleSlug(generation, trim) {
  return `${toSlug(generation)}-${toSlug(trim)}`;
}
function buildWheelUrl(series, finish, generation, trim, frontSize, rearSize) {
  return `/shop/${toSlug(series)}/${toSlug(finish)}/${buildVehicleSlug(generation, trim)}/${buildStaggeredSize(frontSize, rearSize)}`;
}
function fmtSpec([diameter, width, offset]) {
  const off = offset >= 0 ? `+${offset}` : `${offset}`;
  return `${diameter}" x ${width}" ${off}mm`;
}
function getFinishName(w) {
  return [w.Finish, w.Color, w.Accent].filter(Boolean).join(' ') || 'Standard';
}

async function fetchFullCatalog() {
  const all = [];
  let page = 1;
  for (;;) {
    const url = `https://api.autosyncstudio.com/wheels?key=efive&p-number=${page}&p-size=100&i-specs=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Wheels API error: ${res.status}`);
    const data = await res.json();
    const wheels = data.Wheels || [];
    all.push(...wheels);
    if (!data.MoreItems || wheels.length === 0) break;
    page += 1;
    if (page > 30) break; // safety stop
  }
  return all;
}

async function main() {
  console.log('Fetching live product catalog...');
  const wheels = await fetchFullCatalog();
  console.log(`Fetched ${wheels.length} SKUs.`);

  // (model, finishName) -> Set of "diameter,width,offset" size keys
  const catalogIndex = new Map();
  for (const w of wheels) {
    const key = `${w.Model}::${getFinishName(w)}`;
    if (!catalogIndex.has(key)) catalogIndex.set(key, new Set());
    catalogIndex.get(key).add(`${w.Diameter},${w.Width},${w.Offset}`);
  }
  const hasSize = (style, finish, spec) => {
    const sizes = catalogIndex.get(`${style}::${finish}`);
    return sizes ? sizes.has(spec.join(',')) : false;
  };

  const result = {};
  const stats = { fit: 0, 'no-fit': 0, quote: 0 };

  for (const [genKey, [generation, trim]] of Object.entries(VIZ_GENS)) {
    const curatedOptions = getCurated(generation, trim) || [];
    const genResult = { generation, trim, styles: {} };

    for (const style of STYLES) {
      const styleResult = {};
      for (const dropdownFinish of DROPDOWN_FINISHES) {
        let status = 'quote';
        let url = null;
        let anyProductExists = false;

        for (const candidate of candidateFinishes(dropdownFinish)) {
          if (catalogIndex.has(`${style}::${candidate}`)) anyProductExists = true;
          const match = curatedOptions.find(opt =>
            hasSize(style, candidate, opt.front) && hasSize(style, candidate, opt.rear));
          if (match) {
            status = 'fit';
            url = buildWheelUrl(style, candidate, generation, trim, fmtSpec(match.front), fmtSpec(match.rear));
            break;
          }
        }
        if (status !== 'fit') status = anyProductExists ? 'no-fit' : 'quote';

        stats[status] += 1;
        styleResult[dropdownFinish] = url ? { status, url } : { status };
      }
      genResult.styles[style] = styleResult;
    }
    result[genKey] = genResult;
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2) + '\n');
  console.log(`Written to ${OUTPUT_FILE}`);
  console.log('Stats:', stats);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
