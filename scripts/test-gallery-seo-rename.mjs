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
  uniqueSeoSlug,
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
const middleware = read('src/middleware.ts');
const page = read('src/pages/gallery/[id].astro');
const fileRoute = read('src/pages/gallery/[id]/[file].ts');
const media = read('src/pages/gallery-media/[...path].ts');
const apply = read('scripts/apply-gallery-seo-rename.mjs');
const dry = read('scripts/dry-run-gallery-seo-rename.mjs');
const map = JSON.parse(read('src/data/gallery-seo-rename-map.json'));

assert('opaque g-2991 is renamed', isOpaqueGallerySlug('g-2991') && shouldRenameSlug({ slug: 'g-2991' }).rename);
assert('descriptive slug stays', !shouldRenameSlug({ slug: '2004-c5-z06' }).rename);
assert(
  'g-2991 formula without series is 2025-black-c8-z06-e5-wheels',
  proposedSeoSlug({ year: '2025', vehicleColor: 'Black', generation: 'C8', trim: 'Z06' }) === '2025-black-c8-z06-e5-wheels',
);
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
assert('new uploads use descriptive photo ids', photos.includes('nextDescriptivePhotoId'));
assert('apply script is gated', apply.includes("GALLERY_SEO_RENAME_APPLY === '1'") && apply.includes('--apply'));
assert('dry run never writes redis', dry.includes('Never writes Redis') && !dry.includes('redisSet') && !dry.includes('/set/'));
assert('map includes g-2991 when generated', !map.slugCount || map.slugs.some((row) => row.old === 'g-2991'));
const g2991 = (map.photos || []).find((row) => row.oldPath && row.oldPath.includes('/g-2991/pmwvsyf7qqijjd8'));
assert(
  'g-2991 photo 1 is under /gallery/',
  Boolean(g2991) &&
    g2991.newPath === '/gallery/2025-black-c8-z06-e5-wheels/2025-black-c8-z06-e5-wheels-1.webp' &&
    (map.photos || []).every((row) => row.newPath.startsWith('/gallery/') && !row.newPath.startsWith('/gallery-media/')),
);
assert('docs map exists', read('docs/gallery-seo-rename-map.md').includes('/gallery/'));

if (failed) {
  console.error(`${failed} gallery SEO rename checks failed`);
  process.exit(1);
}
console.log('gallery SEO rename checks passed');
