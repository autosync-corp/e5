import type { APIRoute } from 'astro';
import { jsonError, jsonOk, requirePortalSession, requireSameOrigin } from '@/core/portal/api-guard.ts';
import { blobConfigured } from '@/core/portal/slides.ts';
import {
  GALLERY_IMAGE_TYPES,
  galleryImageExtFromMagic,
  putGalleryPhoto,
} from '@/core/portal/galleryPhotos.ts';
import { MAX_GALLERY_IMAGE_BYTES } from '@/core/portal/galleryTypes.ts';
import { isValidGallerySlug } from '@/core/portal/galleryStore.ts';

export const prerender = false;
export const maxDuration = 60;

export const POST: APIRoute = async ({ cookies, request }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  if (!blobConfigured()) {
    return jsonError(503, 'Image uploads are not available in this environment.');
  }

  const length = Number(request.headers.get('content-length') || '0');
  if (length > MAX_GALLERY_IMAGE_BYTES + 64 * 1024) {
    return jsonError(413, 'Image is too large (max 8 MB).');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError(400, 'Choose an image file.');
  }

  const file = form.get('file');
  if (!(file instanceof File)) return jsonError(400, 'Choose an image file.');
  if (file.size > MAX_GALLERY_IMAGE_BYTES) return jsonError(413, 'Image is too large (max 8 MB).');
  if (file.size < 32) return jsonError(400, 'Image file is empty.');

  const typeExt = GALLERY_IMAGE_TYPES[file.type];
  const buffer = new Uint8Array(await file.arrayBuffer());
  const magicExt = galleryImageExtFromMagic(buffer);
  if (!magicExt) return jsonError(400, 'Use a JPEG, PNG, or WebP image.');
  if (typeExt && typeExt !== magicExt) return jsonError(400, 'Image type does not match the file contents.');

  const slug = String(form.get('slug') || 'draft')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 80);
  if (!isValidGallerySlug(slug)) return jsonError(400, 'Invalid gallery id.');

  try {
    const photo = await putGalleryPhoto({
      slug,
      bytes: buffer,
      ext: magicExt,
      alt: String(form.get('alt') || '').slice(0, 180),
    });
    return jsonOk({ photo });
  } catch {
    return jsonError(502, 'Image upload failed.');
  }
};
