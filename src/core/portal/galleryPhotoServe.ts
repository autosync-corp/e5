import { loadStoredGallery } from '@/core/portal/galleryStore.ts';
import { loadGalleryCatalog } from '@/core/portal/galleries.ts';
import { galleryMediaItems } from '@/pages/gallery/utils/galleryMedia.ts';
import { SITE_URL } from '@/core/constants/Site.ts';
import {
  extFromUrl,
  GALLERY_IMAGE_EXT_RE,
  internalSlugFor,
  mappedPhotoForNewPath,
  mappedPhotoForOldPath,
  normalizePath,
  publicSlugFor,
} from '@/core/portal/gallerySeo.ts';

export type GalleryPhotoSource = {
  url: string;
  alt: string;
  contentType?: string;
};

function absolute(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${SITE_URL}${url}`;
  return `${SITE_URL}/${url}`;
}

function isLoopbackPublicPath(url: string): boolean {
  const path = normalizePath(url);
  return path.startsWith('/gallery/') || path.startsWith('/gallery-media/');
}

function photoIndexFromFile(slug: string, file: string): number | null {
  const stem = file.replace(GALLERY_IMAGE_EXT_RE, '');
  const prefix = `${slug}-`;
  if (stem.startsWith(prefix)) {
    const n = Number(stem.slice(prefix.length));
    if (Number.isInteger(n) && n > 0) return n - 1;
  }
  return null;
}

export async function resolveGalleryPhotoSource(slug: string, file: string): Promise<GalleryPhotoSource | null> {
  if (!slug || !file) return null;
  const publicPath = `/gallery/${slug}/${file}`;
  const mapped =
    mappedPhotoForNewPath(publicPath) ||
    mappedPhotoForOldPath(publicPath) ||
    mappedPhotoForOldPath(`/gallery-media/${slug}/${file}`) ||
    mappedPhotoForOldPath(`/gallery-media/${internalSlugFor(slug)}/${file}`);

  const internal = mapped?.oldSlug || internalSlugFor(slug);
  const stored = (await loadStoredGallery(internal)) || (await loadStoredGallery(slug));
  if (stored && !stored.deleted) {
    const stem = file.replace(GALLERY_IMAGE_EXT_RE, '');
    const oldFile = mapped?.oldPath.split('/').pop() || '';
    const oldStem = oldFile.replace(GALLERY_IMAGE_EXT_RE, '');
    const index = photoIndexFromFile(publicSlugFor(stored.slug), file) ?? photoIndexFromFile(stored.slug, file);
    const photo =
      stored.photos.find(
        (entry) =>
          (mapped?.oldPath && entry.publicPath === mapped.oldPath) ||
          (mapped?.newPath && entry.publicPath === mapped.newPath) ||
          entry.publicPath.endsWith(`/${file}`) ||
          entry.id === stem ||
          (oldStem && entry.id === oldStem) ||
          (oldFile && entry.publicPath.endsWith(`/${oldFile}`)),
      ) || (index != null ? stored.photos[index] : undefined);
    if (photo?.blobUrl) return { url: photo.blobUrl, alt: mapped?.alt || photo.alt };
  }

  if (mapped?.oldPath && !isLoopbackPublicPath(mapped.oldPath)) {
    return { url: absolute(mapped.oldPath), alt: mapped.alt };
  }

  const catalog = await loadGalleryCatalog();
  const item = catalog.find((row) => row.galleryId === slug || row.galleryId === internal);
  if (!item) return null;
  const media = galleryMediaItems(item).filter((entry) => entry.type === 'image' && entry.url);
  const index = photoIndexFromFile(publicSlugFor(item.galleryId || slug), file);
  const entry = index != null ? media[index] : media.find((row) => (row.url || '').endsWith(`/${file}`));
  if (!entry?.url || isLoopbackPublicPath(entry.url)) return null;
  return { url: absolute(entry.url), alt: mapped?.alt || entry.alt || '' };
}

export function contentTypeForExt(ext: string): string {
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  return 'image/webp';
}

export { extFromUrl };
