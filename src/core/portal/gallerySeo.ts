import type { CorvetteGalleryItem, GalleryMediaItem } from '@/pages/gallery/constants/CorvetteGalleryData.ts';
import type { StoredGallery, StoredGalleryPhoto } from '@/core/portal/galleryTypes.ts';
import renameMapJson from '@/data/gallery-seo-rename-map.json';
import { suggestPhotoAlt } from '@/core/portal/galleryCopy.ts';

export const GALLERY_IMAGE_EXT_RE = /\.(webp|jpe?g|png)$/i;
export const OPAQUE_GALLERY_SLUG_RE = /^g-\d+$/i;
export const HASHED_PHOTO_STEM_RE = /^(?:p[a-z0-9]{8,}|[a-z0-9]{10,16})$/i;

export const RESERVED_GALLERY_SLUGS = new Set([
  'vehicles',
  'wheels',
  'detail',
  'new',
  'gallery',
  'media',
  // Existing /gallery/* redirect sources in vercel.json — a live page at these
  // paths would be stolen by the 301.
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

export type GallerySeoSlugRow = {
  old: string;
  new: string;
  title: string;
  reason: string;
  clientEditedConflict: boolean;
};

export type GallerySeoPhotoRow = {
  oldSlug: string;
  newSlug: string;
  oldPath: string;
  newPath: string;
  alt: string;
};

export type GallerySeoRenameMap = {
  generatedAt: string;
  slugCount: number;
  photoCount: number;
  clashes: string[];
  conflicts: GallerySeoSlugRow[];
  slugs: GallerySeoSlugRow[];
  photos: GallerySeoPhotoRow[];
};

const map = renameMapJson as GallerySeoRenameMap;

const slugOldToNew = new Map<string, string>();
const slugNewToOld = new Map<string, string>();
const photoOldToNew = new Map<string, GallerySeoPhotoRow>();
const photoNewToOld = new Map<string, GallerySeoPhotoRow>();
let mapsReady = false;

function maps() {
  if (!mapsReady) {
    for (const row of map.slugs || []) {
      if (!row.old || !row.new) continue;
      slugOldToNew.set(row.old, row.new);
      slugNewToOld.set(row.new, row.old);
    }
    for (const row of map.photos || []) {
      if (row.oldPath) photoOldToNew.set(normalizePath(row.oldPath), row);
      if (row.newPath) photoNewToOld.set(normalizePath(row.newPath), row);
    }
    mapsReady = true;
  }
  return { slugOldToNew, slugNewToOld, photoOldToNew, photoNewToOld };
}

export function getGallerySeoRenameMap(): GallerySeoRenameMap {
  return map;
}

export function normalizePath(path: string): string {
  if (!path) return '';
  try {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      path = new URL(path).pathname;
    }
  } catch {
    /* keep */
  }
  return path.split('?')[0].replace(/\/+$/, '') || path;
}

export function slugifySeoPart(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isOpaqueGallerySlug(slug: string): boolean {
  return OPAQUE_GALLERY_SLUG_RE.test(String(slug || '').trim());
}

export function isHashedPhotoName(file: string): boolean {
  const stem = String(file || '')
    .split('/')
    .pop()
    ?.replace(GALLERY_IMAGE_EXT_RE, '') || '';
  if (!stem) return false;
  if (stem.includes('-') && !HASHED_PHOTO_STEM_RE.test(stem)) return false;
  return HASHED_PHOTO_STEM_RE.test(stem);
}

export function isGalleryImagePath(pathname: string): boolean {
  const path = pathname.split('?')[0];
  if (!path.startsWith('/gallery/') && !path.startsWith('/gallery-media/')) return false;
  return GALLERY_IMAGE_EXT_RE.test(path);
}

export function extFromUrl(url: string): string {
  const match = normalizePath(url).match(GALLERY_IMAGE_EXT_RE);
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'webp';
}

export function proposedSeoSlug(input: {
  year?: string | null;
  vehicleColor?: string | null;
  generation?: string | null;
  trim?: string | null;
  style?: string | null;
  finish?: string | null;
  maxLength?: number;
}): string {
  const year = slugifySeoPart(input.year || '');
  const color = slugifySeoPart(input.vehicleColor || '');
  const generation = slugifySeoPart(input.generation || '');
  const trim = slugifySeoPart(input.trim || '');
  const style = slugifySeoPart(input.style || '');
  const finish = slugifySeoPart(input.finish || '');
  const vehicle = [year, color, generation, trim].filter(Boolean);
  const wheel = ['e5', style, finish, 'wheels'].filter(Boolean);
  const raw = [...vehicle, ...wheel].filter(Boolean).join('-') || 'e5-wheels';
  const max = input.maxLength || 120;
  return raw.slice(0, max).replace(/-+$/g, '');
}

export function uniqueSeoSlug(base: string, taken: Set<string>, maxLength = 120): string {
  let slug = base || 'e5-wheels';
  if (!taken.has(slug) && !RESERVED_GALLERY_SLUGS.has(slug)) return slug;
  let n = 2;
  while (n < 1000) {
    const suffix = `-${n}`;
    slug = `${base.slice(0, Math.max(8, maxLength - suffix.length))}${suffix}`;
    if (!taken.has(slug) && !RESERVED_GALLERY_SLUGS.has(slug)) return slug;
    n += 1;
  }
  return `${base.slice(0, 110)}-${Date.now().toString(36)}`;
}

export function publicPhotoFileName(slug: string, index1: number, ext: string): string {
  return `${slug}-${index1}.${ext.replace(/^\./, '')}`;
}

export function publicGalleryPhotoPath(slug: string, index1: number, ext: string): string {
  return `/gallery/${slug}/${publicPhotoFileName(slug, index1, ext)}`;
}

export function nextDescriptivePhotoId(slug: string, existing: Array<{ id?: string; publicPath?: string }>): string {
  const used = new Set<number>();
  const prefix = `${slug}-`;
  for (const photo of existing) {
    const stem = (photo.id || '').replace(GALLERY_IMAGE_EXT_RE, '');
    const fromPath = (photo.publicPath || '').split('/').pop()?.replace(GALLERY_IMAGE_EXT_RE, '') || '';
    for (const value of [stem, fromPath]) {
      if (value.startsWith(prefix)) {
        const n = Number(value.slice(prefix.length));
        if (Number.isInteger(n) && n > 0) used.add(n);
      }
    }
  }
  let n = 1;
  while (used.has(n)) n += 1;
  return `${slug}-${n}`;
}

export function publicSlugFor(slug: string): string {
  if (!slug) return slug;
  const { slugOldToNew } = maps();
  return slugOldToNew.get(slug) || slug;
}

export function internalSlugFor(slug: string): string {
  if (!slug) return slug;
  const { slugNewToOld } = maps();
  return slugNewToOld.get(slug) || slug;
}

export function isRenamedGallerySlug(slug: string): boolean {
  const { slugOldToNew } = maps();
  return slugOldToNew.has(slug);
}

export function mappedPhotoForOldPath(path: string): GallerySeoPhotoRow | undefined {
  const { photoOldToNew } = maps();
  return photoOldToNew.get(normalizePath(path));
}

export function mappedPhotoForNewPath(path: string): GallerySeoPhotoRow | undefined {
  const { photoNewToOld } = maps();
  return photoNewToOld.get(normalizePath(path));
}

export function redirectGalleryMediaPath(pathname: string): string | null {
  const path = normalizePath(pathname);
  if (!path.startsWith('/gallery-media/')) return null;
  const mapped = mappedPhotoForOldPath(path);
  if (mapped?.newPath) return mapped.newPath;
  const rest = path.slice('/gallery-media'.length);
  if (!rest || rest === '/') return null;
  const parts = rest.replace(/^\/+/, '').split('/');
  if (parts.length < 2) return null;
  const [oldSlug, file] = parts;
  const newSlug = publicSlugFor(oldSlug);
  const photo = mappedPhotoForOldPath(path);
  if (photo) return photo.newPath;
  if (isHashedPhotoName(file)) {
    // Prefix swap plus slug rename; handler still resolves by old photo id.
    return `/gallery/${newSlug}/${file}`;
  }
  return `/gallery/${newSlug}/${file}`;
}

export function canonicalGalleryImagePath(pathname: string): string | null {
  const path = normalizePath(pathname);
  if (path.startsWith('/gallery-media/')) return redirectGalleryMediaPath(path);
  const mappedOld = mappedPhotoForOldPath(path);
  if (mappedOld?.newPath && mappedOld.newPath !== path) return mappedOld.newPath;
  const mappedNew = mappedPhotoForNewPath(path);
  if (mappedNew?.newPath) return mappedNew.newPath;
  return null;
}

export function seoPhotoAlt(title: string, index1: number, angle?: string): string {
  const base = (title || 'Corvette with E5 wheels').replace(/\s+/g, ' ').trim();
  const extra = angle ? ` — ${angle}` : ` — photo ${index1}`;
  return `${base}${extra}`.slice(0, 180);
}

export function projectGalleryForPublic<T extends CorvetteGalleryItem>(item: T): T {
  const oldId = item.galleryId || '';
  const newId = publicSlugFor(oldId);
  const media = (item.media && item.media.length > 0
    ? item.media
    : (item.images || []).map((file) => ({ type: 'image' as const, url: file }))
  ).map((entry, index) => projectMediaEntry(entry, newId, index, item.vehicleTitle || ''));
  return {
    ...item,
    galleryId: newId || oldId,
    media,
    images: undefined,
  };
}

function projectMediaEntry(
  entry: GalleryMediaItem,
  newSlug: string,
  index: number,
  title: string,
): GalleryMediaItem {
  if (entry.type === 'video') return entry;
  const url = entry.url || '';
  const path = normalizePath(url);
  const mapped = mappedPhotoForOldPath(path) || mappedPhotoForNewPath(path);
  const ext = extFromUrl(url || mapped?.newPath || 'x.webp');
  const nextPath = mapped?.newPath || publicGalleryPhotoPath(newSlug, index + 1, ext);
  const alt = (entry.alt || mapped?.alt || seoPhotoAlt(title, index + 1)).slice(0, 180);
  return {
    ...entry,
    url: nextPath,
    alt,
  };
}

export function storedPhotoPublicPath(slug: string, photo: StoredGalleryPhoto, index: number): string {
  const mapped = mappedPhotoForOldPath(photo.publicPath) || mappedPhotoForNewPath(photo.publicPath);
  if (mapped?.newPath) return mapped.newPath;
  const ext = extFromUrl(photo.publicPath || photo.blobPath || 'x.webp');
  return publicGalleryPhotoPath(publicSlugFor(slug), index + 1, ext);
}

export function suggestStoredPhotoAlt(gallery: StoredGallery, photo: StoredGalleryPhoto, index: number): string {
  const generated = suggestPhotoAlt(gallery, photo, index);
  if (gallery.title) return seoPhotoAlt(gallery.title, index + 1);
  return generated;
}

export function shouldRenameSlug(opts: {
  slug: string;
  origin?: string;
  clientEditedSlug?: boolean;
}): { rename: boolean; reason: string; conflict: boolean } {
  const slug = opts.slug;
  const opaque = isOpaqueGallerySlug(slug);
  const clientOwned = opts.origin === 'portal' || Boolean(opts.clientEditedSlug);
  if (!opaque) {
    return { rename: false, reason: 'descriptive', conflict: false };
  }
  if (clientOwned) {
    return { rename: true, reason: 'opaque-client-edited', conflict: true };
  }
  return { rename: true, reason: 'opaque-autosync-id', conflict: false };
}
