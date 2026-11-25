/**
 * Dry-run: 10 imported gallery titles before vs after paint/wheel copy.
 * Reads Redis titles if KV env is set; never writes Redis or Blob.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function clean(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function suggestGalleryTitle(input) {
  const vehicle = [clean(input.year), clean(input.vehicleColor), clean(input.generation), clean(input.trim)].filter(Boolean);
  const base = vehicle.join(' ') || 'Corvette';
  const style = clean(input.style);
  const finish = clean(input.finish);
  const wheel = [style ? `E5 ${style}` : '', finish].filter(Boolean).join(' ');
  if (wheel) return `${base} with ${wheel} wheels`.slice(0, 160);
  return base.slice(0, 160);
}

function generationFromYear(year) {
  const n = Number(year);
  if (n >= 2020) return 'C8';
  if (n >= 2014) return 'C7';
  if (n >= 2005) return 'C6';
  if (n >= 1997) return 'C5';
  return '';
}

function parseStatic() {
  const text = readFileSync(join(root, 'src/pages/gallery/constants/CorvetteGalleryData.ts'), 'utf8');
  const byId = new Map();
  const chunks = text.split(/\n  \{/);
  for (const chunk of chunks) {
    const id = chunk.match(/"galleryId": "([^"]+)"/);
    if (!id) continue;
    const color = chunk.match(/"vehicleColor": (null|"[^"]*")/);
    const title = chunk.match(/"vehicleTitle": "([^"]+)"/);
    byId.set(id[1], {
      vehicleColor: color && color[1] !== 'null' ? JSON.parse(color[1]) : '',
      vehicleTitle: title ? title[1] : '',
    });
  }
  return byId;
}

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'E5Portal/1.0' } });
  if (!res.ok) throw new Error(`${url} status=${res.status}`);
  return res.json();
}

async function wheelFinish(wheelId, path) {
  if (!wheelId) return '';
  const data = await getJson(`https://api.autosyncstudio.com/wheels?key=efive&f-id=${wheelId}&i-specs`);
  const wheel = data.Wheels?.[0];
  if (!wheel) return '';
  const spec = [wheel.Finish, wheel.Color, wheel.Accent].map(clean).filter(Boolean).join(' ');
  if (spec) return spec;
  const p = String(path || '').toLowerCase();
  if (p.includes('gloss_black')) return 'Gloss Black';
  if (p.includes('brushed')) return 'Brushed Aluminum';
  return '';
}

const SAMPLE_IDS = [2992, 2991, 2990, 2989, 2985, 2986, 2921, 2934, 2940, 2979];
const staticById = parseStatic();

const byAutosync = new Map();
for (let page = 1; page <= 10; page += 1) {
  const list = await getJson(
    `https://api.autosyncstudio.com/galleries?source=vvs&key=efive&p-size=200&p-number=${page}&i-img&i-vehicle&i-wheels`,
  );
  for (const gallery of list.Galleries || []) byAutosync.set(gallery.Id, gallery);
  if (!list.MoreItems) break;
}

let stored = [];
try {
  stored = JSON.parse(readFileSync('/tmp/e5-gal-fp/last-sync.json', 'utf8')).galleries || [];
} catch {
  stored = [];
}
const storedById = new Map(stored.map((item) => [item.autosyncId, item]));

const rows = [];
for (const id of SAMPLE_IDS) {
  const gallery = byAutosync.get(id);
  if (!gallery) continue;
  const storedItem = storedById.get(id);
  const slug = storedItem?.slug || `g-${id}`;
  const staticItem = staticById.get(slug);
  const vehicle = gallery.Vehicle || {};
  const year = vehicle.Year ? String(vehicle.Year) : storedItem?.year || '';
  const trim = (vehicle.Submodel || storedItem?.trim || '').trim();
  const generation = generationFromYear(year);
  const paintColor = (staticItem?.vehicleColor || '').trim();
  const path = gallery.Images?.[0]?.Path || '';
  const front = (gallery.Wheels || []).find((wheel) => String(wheel.Position || '').toLowerCase() === 'front') || gallery.Wheels?.[0];
  const pnMatch = String(path).match(/e5[a-z]{2}(?:2p)?[a-z0-9]+/i);
  const wheelData = front?.WheelId ? await getJson(`https://api.autosyncstudio.com/wheels?key=efive&f-id=${front.WheelId}&i-specs`) : { Wheels: [] };
  const detail = wheelData.Wheels?.[0];
  let style = detail?.Model || '';
  if (!style && pnMatch) {
    const pn = pnMatch[0].toUpperCase();
    if (pn.startsWith('E5SE')) style = pn.includes('2P') ? 'Sebring 2P' : 'Sebring';
    else if (pn.startsWith('E5SP')) style = 'Speedway';
    else if (pn.startsWith('E5DA')) style = 'Daytona';
    else if (pn.startsWith('E5TA')) style = 'Talladega';
    else if (pn.startsWith('E5SO')) style = 'Sonoma';
    else if (pn.startsWith('E5LA')) style = 'Laguna';
  }
  const finish = (await wheelFinish(front?.WheelId, path)) || '';
  const generated = suggestGalleryTitle({
    year,
    vehicleColor: paintColor,
    generation,
    trim,
    style,
    finish,
  });
  const after = paintColor || !staticItem?.vehicleTitle ? generated : staticItem.vehicleTitle;
  rows.push({
    autosyncId: id,
    slug,
    paintColor: paintColor || '(none)',
    before: storedItem?.title || '(not in store snapshot)',
    after,
  });
}

console.log('Dry-run title diff (no Redis writes)\n');
console.log('| AutoSync id | slug | paint color | before | after |');
console.log('|---|---|---|---|---|');
for (const row of rows) {
  console.log(`| ${row.autosyncId} | ${row.slug} | ${row.paintColor} | ${row.before} | ${row.after} |`);
}
console.log('\nJSON');
console.log(JSON.stringify(rows, null, 2));
