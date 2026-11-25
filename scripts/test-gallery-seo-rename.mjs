import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isHashedPhotoName,
  isOpaqueGallerySlug,
  proposedSeoSlug,
  publicGalleryPhotoPath,
  RESERVED_GALLERY_SLUGS,
  shouldRenameSlug,
  suggestGalleryTitle,
  uniqueSeoSlug,
  wheelOverrideFor,
} from './gallery-seo-lib.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let failed = 0;

function assert(label, ok) {
  if (!ok) {
    failed += 1;
    console.error('fail', label);
  } else {
    console.log('ok  ', label);
  }
}

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const seo = read('src/core/portal/gallerySeo.ts');
const types = read('src/core/portal/galleryTypes.ts');
const photos = read('src/core/portal/galleryPhotos.ts');
const sync = read('src/core/portal/gallerySync.ts');
const store = read('src/core/portal/galleryStore.ts');
const galleries = read('src/core/portal/galleries.ts');
const middleware = read('src/middleware.ts');
const page = read('src/pages/gallery/[id].astro');
const fileRoute = read('src/pages/gallery/[id]/[file].ts');
const media = read('src/pages/gallery-media/[...path].ts');
const apply = read('scripts/apply-gallery-seo-rename.mjs');
const dry = read('scripts/dry-run-gallery-seo-rename.mjs');
const map = JSON.parse(read('src/data/gallery-seo-rename-map.json'));
const wheelOverrides = JSON.parse(read('src/data/gallery-wheel-overrides.json'));
const g2991Override = wheelOverrideFor(wheelOverrides, 'g-2991', 2991);
const g2991Title = suggestGalleryTitle({
  year: '2025',
  vehicleColor: 'Black',
  generation: 'C8',
  trim: 'Z06',
  style: g2991Override.style,
  finish: g2991Override.finish,
});
const g2991Slug = proposedSeoSlug({
  year: '2025',
  vehicleColor: 'Black',
  generation: 'C8',
  trim: 'Z06',
  style: g2991Override.style,
  finish: g2991Override.finish,
});
const g2991Photo1 = `/gallery/${g2991Slug}/${g2991Slug}-1.webp`;

assert('opaque g-2991 is renamed', isOpaqueGallerySlug('g-2991') && shouldRenameSlug({ slug: 'g-2991' }).rename);
assert('descriptive slug stays', !shouldRenameSlug({ slug: '2004-c5-z06' }).rename);
assert(
  'g-2991 formula without series is 2025-black-c8-z06-e5-wheels',
  proposedSeoSlug({ year: '2025', vehicleColor: 'Black', generation: 'C8', trim: 'Z06' }) === '2025-black-c8-z06-e5-wheels',
);
assert(
  'g-2991 override keeps style and finish in separate fields',
  g2991Override.style === 'Sebring 2P Forged' &&
    g2991Override.finish === 'Gloss Black with Stainless Steel Lip' &&
    !String(g2991Override.style).includes('Gloss Black'),
);
assert(
  'g-2991 title follows the existing with-E5 pattern',
  g2991Title === '2025 Black C8 Z06 with E5 Sebring 2P Forged Gloss Black with Stainless Steel Lip wheels',
);
assert(
  'g-2991 slug is built from those fields like the others',
  g2991Slug === '2025-black-c8-z06-e5-sebring-2p-forged-gloss-black-with-stainless-steel-lip-wheels',
);
assert('g-2991 style and finish fit stored field clips', g2991Override.style.length <= 40 && g2991Override.finish.length <= 60);
assert(
  'series is not invented',
  proposedSeoSlug({ year: '2025', vehicleColor: 'Black', generation: 'C8', trim: 'Z06', style: 'Daytona', finish: 'Gloss Black' }) ===
    '2025-black-c8-z06-e5-daytona-gloss-black-wheels',
);
assert('hashed photo names detected', isHashedPhotoName('pmwvsyf7qqijjd8.webp') && !isHashedPhotoName('2025-black-c8-z06-e5-wheels-1.webp'));
assert(
  'public photo path is under /gallery/',
  publicGalleryPhotoPath('2025-black-c8-z06-e5-wheels', 1, 'webp') ===
    '/gallery/2025-black-c8-z06-e5-wheels/2025-black-c8-z06-e5-wheels-1.webp',
);
const taken = new Set(['2025-black-c8-z06-e5-wheels']);
assert('colliding slugs get -2', uniqueSeoSlug('2025-black-c8-z06-e5-wheels', taken) === '2025-black-c8-z06-e5-wheels-2');
assert('vehicles/wheels reserved', RESERVED_GALLERY_SLUGS.has('vehicles') && RESERVED_GALLERY_SLUGS.has('wheels'));
assert('portal client opaque slug is a reported conflict', shouldRenameSlug({ slug: 'g-2991', origin: 'portal' }).conflict);

assert('public prefix is /gallery', types.includes("GALLERY_PUBLIC_PREFIX = '/gallery'"));
assert('image-extension requests are routed', middleware.includes('isGalleryImagePath') && middleware.includes('canonicalGalleryImagePath'));
assert('one-segment /gallery/*.webp does not hit the HTML page', middleware.includes('parts.length !== 3'));
assert('gallery page 301s old slugs', page.includes('Astro.redirect(`/gallery/${vehicleData.galleryId}`, 301)'));
assert('two-segment image route exists', fileRoute.includes('resolveGalleryPhotoSource') && fileRoute.includes('params.file'));
assert('old gallery-media 301s', media.includes('redirect(dest, 301)'));
assert('future imports use proposedSeoSlug', sync.includes('proposedSeoSlug') && sync.includes('uniqueSeoSlug'));
assert(
  'g-2991 override survives AutoSync unless portal edited wheels',
  sync.includes('wheelOverrideFor') &&
    sync.includes('if (!draft.clientEdited.wheels)') &&
    store.includes('applyWheelOverrideToStored') &&
    galleries.includes('applyWheelOverrideToRecord'),
);
assert('previous SEO slugs still 301', seo.includes('isOpaqueGallerySlug(row.old)') && galleries.includes('publicSlugFor(slug) === canonical'));
assert('new uploads use descriptive photo ids', photos.includes('nextDescriptivePhotoId'));
assert('apply script is gated', apply.includes("GALLERY_SEO_RENAME_APPLY === '1'") && apply.includes('--apply'));
assert('dry run never writes redis', dry.includes('Never writes Redis') && !dry.includes('redisSet') && !dry.includes('/set/'));
assert('map includes g-2991 when generated', !map.slugCount || map.slugs.some((row) => row.old === 'g-2991'));
const g2991 = (map.photos || []).find((row) => row.oldPath && row.oldPath.includes('/g-2991/pmwvsyf7qqijjd8'));
const g2991SlugRow = (map.slugs || []).find((row) => row.old === 'g-2991');
const g2991Previous = (map.slugs || []).find((row) => row.old === '2025-black-c8-z06-e5-wheels');
assert(
  'g-2991 photo 1 is under /gallery/',
  Boolean(g2991) &&
    g2991.newPath === g2991Photo1 &&
    g2991.alt.startsWith(g2991Title) &&
    (map.photos || []).every((row) => row.newPath.startsWith('/gallery/') && !row.newPath.startsWith('/gallery-media/')),
);
assert(
  'g-2991 map uses the Sebring slug and title',
  Boolean(g2991SlugRow) &&
    g2991SlugRow.new === g2991Slug &&
    g2991SlugRow.title === g2991Title,
);
assert(
  'previous g-2991 SEO slug 301s onto the Sebring slug',
  Boolean(g2991Previous) && g2991Previous.new === g2991Slug && g2991Previous.reason === 'previous-seo-slug',
);
assert('docs map exists', read('docs/gallery-seo-rename-map.md').includes('/gallery/'));
assert(
  'vercel.json does not use an invalid image-file header pattern',
  !read('vercel.json').includes(':file(.*'),
);

if (failed) {
  console.error(`${failed} gallery SEO rename checks failed`);
  process.exit(1);
}
console.log('gallery SEO rename checks passed');
