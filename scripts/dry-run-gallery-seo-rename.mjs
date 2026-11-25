/**
 * Read-only SEO rename plan. Never writes Redis, Blob, or e5:portal:galleries.
 * Usage: node scripts/dry-run-gallery-seo-rename.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  extFromUrl,
  isHashedPhotoName,
  isOpaqueGallerySlug,
  proposedSeoSlug,
  publicGalleryPhotoPath,
  RESERVED_GALLERY_SLUGS,
  seoPhotoAlt,
  shouldRenameSlug,
  uniqueSeoSlug,
} from './gallery-seo-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const i = trimmed.indexOf('=');
    if (i < 1) continue;
    const key = trimmed.slice(0, i);
    if (process.env[key]) continue;
    process.env[key] = trimmed.slice(i + 1);
  }
}

loadEnvFile('/tmp/e5-prod.env');
loadEnvFile(join(root, '.env'));

function parseStaticCatalog() {
  const text = readFileSync(join(root, 'src/pages/gallery/constants/CorvetteGalleryData.ts'), 'utf8');
  const items = [];
  const blocks = text.split(/\n  \{/);
  for (const block of blocks) {
    const id = block.match(/"galleryId": "([^"]+)"/);
    if (!id) continue;
    const field = (name) => {
      const match = block.match(new RegExp(`"${name}": (null|"[^"]*")`));
      if (!match || match[1] === 'null') return '';
      try {
        return JSON.parse(match[1]);
      } catch {
        return match[1].slice(1, -1);
      }
    };
    const imagesMatch = block.match(/"images": \[([^\]]*)\]/);
    const images = imagesMatch
      ? [...imagesMatch[1].matchAll(/"([^"]+)"/g)].map((row) => row[1])
      : [];
    const mediaUrls = [...block.matchAll(/"url": "([^"]+)"/g)].map((row) => row[1]);
    items.push({
      galleryId: id[1],
      year: field('year'),
      generation: field('submodel'),
      trim: field('trim'),
      vehicleColor: field('vehicleColor'),
      title: field('vehicleTitle'),
      style: field('wheelStyle'),
      finish: field('wheelFinish'),
      images: mediaUrls.length ? mediaUrls : images.map((file) =>
        file.startsWith('/') || file.startsWith('http')
          ? file
          : `/assets/images/gallery/corvette/${id[1]}/${file}`,
      ),
      origin: 'static',
    });
  }
  return items;
}

async function redisGet(key) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url.replace(/\/$/, '')}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  let value = data.result;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      /* keep string */
    }
  }
  return value;
}

function oldPhotoPath(slug, photo, index, fallbackUrl) {
  if (photo?.publicPath) return photo.publicPath;
  if (fallbackUrl) return fallbackUrl;
  const id = photo?.id || `p${index}`;
  const ext = extFromUrl(photo?.blobPath || photo?.blobUrl || 'x.webp');
  return `/gallery-media/${slug}/${id}.${ext}`;
}

const staticItems = parseStaticCatalog();
const staticById = new Map(staticItems.map((item) => [item.galleryId, item]));

const stored = [];
const indexRaw = await redisGet('e5:galleries:index');
const slugs = Array.isArray(indexRaw) ? indexRaw : indexRaw?.slugs || [];
for (const slug of slugs) {
  const item = await redisGet(`e5:galleries:item:${slug}`);
  if (item && typeof item === 'object' && !item.deleted) stored.push(item);
}

const overlayRaw = await redisGet('e5:portal:galleries');
const overlayItems = Array.isArray(overlayRaw?.items) ? overlayRaw.items : null;

const byId = new Map();
for (const item of staticItems) byId.set(item.galleryId, item);
for (const item of stored) {
  byId.set(item.slug, {
    galleryId: item.slug,
    year: item.year || '',
    generation: item.generation || '',
    trim: item.trim || '',
    vehicleColor: item.vehicleColor || '',
    title: item.title || '',
    style: item.front?.style || '',
    finish: item.front?.finish || '',
    images: (item.photos || []).map((photo, index) => oldPhotoPath(item.slug, photo, index)),
    photos: item.photos || [],
    origin: item.origin || 'autosync',
    clientEditedSlug: Boolean(item.clientEdited?.slug),
    blob: true,
  });
}

const ordered = [];
const used = new Set();
if (overlayItems) {
  for (const row of overlayItems) {
    if (!row?.id || row.hidden) continue;
    const item = byId.get(row.id);
    if (!item) continue;
    ordered.push(item);
    used.add(row.id);
  }
}
for (const item of byId.values()) {
  if (used.has(item.galleryId)) continue;
  ordered.push(item);
}

const kept = new Set();
for (const item of ordered) {
  if (!isOpaqueGallerySlug(item.galleryId)) kept.add(item.galleryId);
}
for (const reserved of RESERVED_GALLERY_SLUGS) kept.add(reserved);

const slugRows = [];
const conflicts = [];
const clashes = [];
const taken = new Set(kept);

for (const item of ordered) {
  const decision = shouldRenameSlug({
    slug: item.galleryId,
    origin: item.origin,
    clientEditedSlug: item.clientEditedSlug,
  });
  if (!decision.rename) continue;
  const next = uniqueSeoSlug(
    proposedSeoSlug({
      year: item.year,
      vehicleColor: item.vehicleColor,
      generation: item.generation,
      trim: item.trim,
      style: item.style,
      finish: item.finish,
    }),
    taken,
  );
  if (RESERVED_GALLERY_SLUGS.has(next)) clashes.push(`${item.galleryId} -> ${next} hits a reserved /gallery route`);
  if (kept.has(next) && next !== item.galleryId) clashes.push(`${item.galleryId} -> ${next} collides with an existing descriptive slug`);
  taken.add(next);
  const row = {
    old: item.galleryId,
    new: next,
    title: item.title,
    reason: decision.reason,
    clientEditedConflict: decision.conflict,
  };
  slugRows.push(row);
  if (decision.conflict) conflicts.push(row);
}

const slugOldToNew = new Map(slugRows.map((row) => [row.old, row.new]));
const photoRows = [];
for (const item of ordered) {
  const newSlug = slugOldToNew.get(item.galleryId) || item.galleryId;
  const photos = item.photos || [];
  const urls = item.images || [];
  const count = Math.max(photos.length, urls.length);
  for (let i = 0; i < count; i += 1) {
    const photo = photos[i];
    const url = urls[i] || oldPhotoPath(item.galleryId, photo, i);
    const ext = extFromUrl(photo?.publicPath || photo?.blobPath || url);
    const oldPath = oldPhotoPath(item.galleryId, photo, i, url);
    const newPath = publicGalleryPhotoPath(newSlug, i + 1, ext);
    const hashed = isHashedPhotoName(oldPath) || oldPath.startsWith('/gallery-media/');
    if (!hashed && oldPath === newPath) continue;
    photoRows.push({
      oldSlug: item.galleryId,
      newSlug,
      oldPath,
      newPath,
      alt: seoPhotoAlt(item.title, i + 1),
    });
  }
}

const generatedAt = new Date().toISOString();
const json = {
  generatedAt,
  slugCount: slugRows.length,
  photoCount: photoRows.length,
  clashes,
  conflicts,
  slugs: slugRows,
  photos: photoRows,
};

writeFileSync(join(root, 'src/data/gallery-seo-rename-map.json'), `${JSON.stringify(json, null, 2)}\n`);

const md = [];
md.push('# Gallery SEO rename map');
md.push('');
md.push(`Generated ${generatedAt}. Dry run only — this file is the plan. Production Redis/Blob are rewritten only by \`scripts/apply-gallery-seo-rename.mjs --apply\` after go-live.`);
md.push('');
md.push(`Public galleries in this plan: **${ordered.length}**. Opaque slugs to rename: **${slugRows.length}**. Photo paths to rename: **${photoRows.length}**.`);
md.push('');
md.push('Pages live at `/gallery/{slug}`. Photos are served at `/gallery/{slug}/{slug}-n.webp`. Image-extension requests under `/gallery/` go to the media handler, so they cannot clash with the HTML page. `/gallery/vehicles` and `/gallery/wheels` stay reserved.');
md.push('');
if (clashes.length) {
  md.push('## Route clashes');
  md.push('');
  for (const line of clashes) md.push(`- ${line}`);
  md.push('');
} else {
  md.push('## Route clashes');
  md.push('');
  md.push('None. No proposed slug is `vehicles`, `wheels`, or an existing `/gallery/*` redirect source.');
  md.push('');
}
if (conflicts.length) {
  md.push('## Client-edited slug conflicts');
  md.push('');
  md.push('These slugs are portal/client-owned **and** opaque codes, so they are still renamed.');
  md.push('');
  for (const row of conflicts) md.push(`- \`${row.old}\` → \`${row.new}\``);
  md.push('');
} else {
  md.push('## Client-edited slug conflicts');
  md.push('');
  md.push('None.');
  md.push('');
}
md.push('## Opaque slugs');
md.push('');
md.push('| Old slug | New slug | Title | Reason |');
md.push('|---|---|---|---|');
for (const row of slugRows) {
  md.push(`| \`${row.old}\` | \`${row.new}\` | ${row.title.replace(/\|/g, '/')} | ${row.reason} |`);
}
md.push('');
md.push('## Photo paths');
md.push('');
md.push('| Old path | New path | Alt |');
md.push('|---|---|---|');
for (const row of photoRows) {
  md.push(`| \`${row.oldPath}\` | \`${row.newPath}\` | ${row.alt.replace(/\|/g, '/')} |`);
}
md.push('');

writeFileSync(join(root, 'docs/gallery-seo-rename-map.md'), md.join('\n'));

console.log(JSON.stringify({
  publicGalleries: ordered.length,
  stored: stored.length,
  overlayPresent: Boolean(overlayItems),
  slugsRenamed: slugRows.length,
  photosRenamed: photoRows.length,
  clashes: clashes.length,
  conflicts: conflicts.length,
  redis: Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
}, null, 2));
