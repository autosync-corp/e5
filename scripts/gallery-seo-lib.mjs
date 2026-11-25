export const GALLERY_IMAGE_EXT_RE = /\.(webp|jpe?g|png)$/i;
export const OPAQUE_GALLERY_SLUG_RE = /^g-\d+$/i;
export const HASHED_PHOTO_STEM_RE = /^(?:p[a-z0-9]{8,}|[a-z0-9]{10,16})$/i;
export const MAX_GALLERY_SLUG = 120;

export const RESERVED_GALLERY_SLUGS = new Set([
  'vehicles',
  'wheels',
  'detail',
  'new',
  'gallery',
  'media',
  '2023-c8',
  '2023-c8-red-corvette',
  '2023-c8-corvette-stingray-3lt',
  'c8-2023-red-stingray-torch-red',
  'c8-2022-yellow-stingray',
  '2023-c8-corvette-stingray-3lt-nightshoot',
  '2023-c8-corvette-stingray-3lt-outdoor-shoot',
  'c8-2023-daytona-black-stingray',
  'c8-2023-sebring-black-stingray',
]);

export function slugifySeoPart(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isOpaqueGallerySlug(slug) {
  return OPAQUE_GALLERY_SLUG_RE.test(String(slug || '').trim());
}

export function isHashedPhotoName(file) {
  const stem = String(file || '')
    .split('/')
    .pop()
    ?.replace(GALLERY_IMAGE_EXT_RE, '') || '';
  if (!stem) return false;
  return HASHED_PHOTO_STEM_RE.test(stem);
}

export function proposedSeoSlug(input = {}) {
  const year = slugifySeoPart(input.year || '');
  const color = slugifySeoPart(input.vehicleColor || '');
  const generation = slugifySeoPart(input.generation || '');
  const trim = slugifySeoPart(input.trim || '');
  const style = slugifySeoPart(input.style || '');
  const finish = slugifySeoPart(input.finish || '');
  const vehicle = [year, color, generation, trim].filter(Boolean);
  const wheel = ['e5', style, finish, 'wheels'].filter(Boolean);
  const raw = [...vehicle, ...wheel].filter(Boolean).join('-') || 'e5-wheels';
  const max = input.maxLength || MAX_GALLERY_SLUG;
  return raw.slice(0, max).replace(/-+$/g, '');
}

export function uniqueSeoSlug(base, taken, maxLength = MAX_GALLERY_SLUG) {
  let slug = base || 'e5-wheels';
  if (!taken.has(slug) && !RESERVED_GALLERY_SLUGS.has(slug)) return slug;
  let n = 2;
  while (n < 1000) {
    const suffix = `-${n}`;
    slug = `${base.slice(0, Math.max(8, maxLength - suffix.length))}${suffix}`;
    if (!taken.has(slug) && !RESERVED_GALLERY_SLUGS.has(slug)) return slug;
    n += 1;
  }
  return `${base.slice(0, 110)}-x`;
}

export function publicPhotoFileName(slug, index1, ext) {
  return `${slug}-${index1}.${String(ext || 'webp').replace(/^\./, '')}`;
}

export function publicGalleryPhotoPath(slug, index1, ext) {
  return `/gallery/${slug}/${publicPhotoFileName(slug, index1, ext)}`;
}

export function extFromUrl(url) {
  const match = String(url || '').match(GALLERY_IMAGE_EXT_RE);
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'webp';
}

export function seoPhotoAlt(title, index1) {
  const base = String(title || 'Corvette with E5 wheels').replace(/\s+/g, ' ').trim();
  return `${base} — photo ${index1}`.slice(0, 180);
}

export function shouldRenameSlug(opts) {
  const slug = opts.slug;
  const opaque = isOpaqueGallerySlug(slug);
  const clientOwned = opts.origin === 'portal' || Boolean(opts.clientEditedSlug);
  if (!opaque) return { rename: false, reason: 'descriptive', conflict: false };
  if (clientOwned) return { rename: true, reason: 'opaque-client-edited', conflict: true };
  return { rename: true, reason: 'opaque-autosync-id', conflict: false };
}
