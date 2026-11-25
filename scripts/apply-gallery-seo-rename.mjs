/**
 * Production go-live only. Copies blobs to descriptive names and rewrites
 * first-party gallery Redis keys. Never run from tests or preview CI.
 *
 * Requires BOTH:
 *   node scripts/apply-gallery-seo-rename.mjs --apply
 *   GALLERY_SEO_RENAME_APPLY=1
 *
 * Does not delete old blobs. Updates e5:portal:galleries ids to the new slugs
 * so hide/reorder keep matching after keys move.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { put } from '@vercel/blob';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const APPLY = process.argv.includes('--apply') && process.env.GALLERY_SEO_RENAME_APPLY === '1';

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

if (!APPLY) {
  console.log('Refusing to apply. Re-run with --apply and GALLERY_SEO_RENAME_APPLY=1 after go-live.');
  process.exit(0);
}

const map = JSON.parse(readFileSync(join(root, 'src/data/gallery-seo-rename-map.json'), 'utf8'));
const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;
if (!url || !token) {
  console.error('KV env is missing.');
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is missing.');
  process.exit(1);
}

async function redisGet(key) {
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
      /* keep */
    }
  }
  return value;
}

async function redisSet(key, value) {
  const res = await fetch(`${url.replace(/\/$/, '')}/set/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`redis set ${key} status=${res.status}`);
}

async function redisDel(key) {
  await fetch(`${url.replace(/\/$/, '')}/del/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

const slugOldToNew = new Map(map.slugs.map((row) => [row.old, row.new]));
const storedBySlug = new Map();
async function stored(slug) {
  if (!storedBySlug.has(slug)) storedBySlug.set(slug, await redisGet(`e5:galleries:item:${slug}`));
  return storedBySlug.get(slug);
}

let copied = 0;
let skippedPhotos = 0;
for (const photo of map.photos) {
  const item = await stored(photo.oldSlug);
  const rec = (item?.photos || []).find((row) => row.publicPath === photo.oldPath);
  const blobUrl = rec?.blobUrl || photo.blobUrl;
  if (!blobUrl) {
    skippedPhotos += 1;
    continue;
  }
  const blobPath = `gallery-media/${photo.newSlug}/${photo.newPath.split('/').pop()}`;
  const res = await fetch(blobUrl, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) {
    skippedPhotos += 1;
    continue;
  }
  const bytes = Buffer.from(await res.arrayBuffer());
  await put(blobPath, bytes, {
    access: 'public',
    addRandomSuffix: false,
    contentType: res.headers.get('content-type') || 'image/webp',
  });
  copied += 1;
}

const indexRaw = await redisGet('e5:galleries:index');
const slugs = Array.isArray(indexRaw) ? indexRaw : indexRaw?.slugs || [];
const nextSlugs = [];
let moved = 0;
for (const slug of slugs) {
  const item = await redisGet(`e5:galleries:item:${slug}`);
  if (!item || typeof item !== 'object') {
    nextSlugs.push(slug);
    continue;
  }
  const nextSlug = slugOldToNew.get(slug) || slug;
  const photosByOld = new Map(map.photos.filter((row) => row.oldSlug === slug).map((row) => [row.oldPath, row]));
  const photos = (item.photos || []).map((photo, index) => {
    const mapped = photosByOld.get(photo.publicPath) || map.photos.find((row) => row.oldSlug === slug && row.newPath.endsWith(`-${index + 1}.webp`));
    if (!mapped) return photo;
    return {
      ...photo,
      id: mapped.newPath.split('/').pop().replace(/\.[a-z0-9]+$/i, ''),
      publicPath: mapped.newPath,
      alt: mapped.alt || photo.alt,
      blobPath: `gallery-media/${mapped.newSlug}/${mapped.newPath.split('/').pop()}`,
    };
  });
  const next = {
    ...item,
    slug: nextSlug,
    photos,
    previousSlugs: [...new Set([...(item.previousSlugs || []), slug].filter((value) => value && value !== nextSlug))],
    updatedAt: new Date().toISOString(),
  };
  await redisSet(`e5:galleries:item:${nextSlug}`, next);
  if (nextSlug !== slug) {
    await redisDel(`e5:galleries:item:${slug}`);
    moved += 1;
  }
  nextSlugs.push(nextSlug);
}

await redisSet('e5:galleries:index', { version: 1, slugs: [...new Set(nextSlugs)] });

const overlay = await redisGet('e5:portal:galleries');
if (overlay && Array.isArray(overlay.items)) {
  const items = overlay.items.map((row) => ({
    ...row,
    id: slugOldToNew.get(row.id) || row.id,
  }));
  await redisSet('e5:portal:galleries', { ...overlay, items });
}

console.log(JSON.stringify({ copied, skippedPhotos, slugsMoved: moved, slugsIndexed: nextSlugs.length }, null, 2));
