import { del, put } from '@vercel/blob';
import { blobConfigured, MAX_IMAGE_BYTES } from '@/core/portal/slides.ts';
import {
  GALLERY_MEDIA_PREFIX,
  GALLERY_PUBLIC_PREFIX,
  MAX_GALLERY_IMAGE_BYTES,
  type StoredGalleryPhoto,
} from '@/core/portal/galleryTypes.ts';

export const GALLERY_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function galleryImageExtFromMagic(bytes: Uint8Array): string | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'png';
  const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  const webp = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (riff === 'RIFF' && webp === 'WEBP') return 'webp';
  return null;
}

export function newPhotoId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function contentTypeFor(ext: string): string {
  if (ext === 'jpg') return 'image/jpeg';
  if (ext === 'png') return 'image/png';
  return 'image/webp';
}

export function publicGalleryMediaPath(slug: string, photoId: string, ext: string): string {
  return `${GALLERY_PUBLIC_PREFIX}/${slug}/${photoId}.${ext}`;
}

export async function putGalleryPhoto(opts: {
  slug: string;
  photoId?: string;
  bytes: Uint8Array;
  ext: string;
  alt?: string;
  sourcePath?: string;
}): Promise<StoredGalleryPhoto> {
  if (!blobConfigured()) {
    throw new Error('Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN.');
  }
  if (opts.bytes.byteLength > MAX_GALLERY_IMAGE_BYTES) {
    throw new Error(`Image is too large (max ${MAX_GALLERY_IMAGE_BYTES / (1024 * 1024)} MB).`);
  }
  const photoId = opts.photoId || newPhotoId();
  const ext = opts.ext;
  const blobPath = `${GALLERY_MEDIA_PREFIX}/${opts.slug}/${photoId}.${ext}`;
  const contentType = contentTypeFor(ext);
  const blob = await put(blobPath, Buffer.from(opts.bytes), {
    access: 'public',
    addRandomSuffix: false,
    contentType,
  });
  return {
    id: photoId,
    blobPath,
    blobUrl: blob.url,
    publicPath: publicGalleryMediaPath(opts.slug, photoId, ext),
    alt: (opts.alt || '').slice(0, 180),
    sourcePath: opts.sourcePath,
  };
}

export async function copyRemotePhoto(opts: {
  slug: string;
  url: string;
  sourcePath?: string;
  alt?: string;
  photoId?: string;
}): Promise<StoredGalleryPhoto> {
  const res = await fetch(opts.url, {
    headers: { 'User-Agent': 'E5Portal/1.0', Accept: 'image/webp,image/jpeg,image/png,*/*' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`photo-fetch status=${res.status}`);
  const buffer = new Uint8Array(await res.arrayBuffer());
  if (buffer.byteLength < 32) throw new Error('photo-fetch empty');
  if (buffer.byteLength > MAX_GALLERY_IMAGE_BYTES) throw new Error('photo-fetch too large');
  const ext = galleryImageExtFromMagic(buffer) || (opts.url.toLowerCase().includes('.png') ? 'png' : 'webp');
  return putGalleryPhoto({
    slug: opts.slug,
    photoId: opts.photoId,
    bytes: buffer,
    ext,
    alt: opts.alt,
    sourcePath: opts.sourcePath,
  });
}

export async function deleteGalleryPhotoBlob(photo: StoredGalleryPhoto): Promise<void> {
  if (!photo.blobUrl && !photo.blobPath) return;
  try {
    await del(photo.blobUrl || photo.blobPath);
  } catch {
    /* already gone */
  }
}

export { MAX_IMAGE_BYTES, MAX_GALLERY_IMAGE_BYTES };
