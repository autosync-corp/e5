import type { APIRoute } from 'astro';
import { jsonError, jsonOk, requirePortalSession, requireSameOrigin } from '@/core/portal/api-guard.ts';
import {
  applyClientEdits,
  deleteStoredGallery,
  isValidGallerySlug,
  loadStoredGallery,
  saveStoredGallery,
} from '@/core/portal/galleryStore.ts';
import { deleteGalleryPhotoBlob } from '@/core/portal/galleryPhotos.ts';
import { bustGalleryCatalogCache } from '@/core/portal/galleries.ts';
import { generationFromYear } from '@/core/portal/galleryCopy.ts';
import type { StoredGallery } from '@/core/portal/galleryTypes.ts';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, params }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const id = params.id || '';
  if (!isValidGallerySlug(id)) return jsonError(400, 'Invalid gallery id.');
  const item = await loadStoredGallery(id);
  if (!item || item.deleted) return jsonError(404, 'Gallery not found.');
  return jsonOk({ item });
};

export const PUT: APIRoute = async ({ cookies, request, params }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const id = params.id || '';
  if (!isValidGallerySlug(id)) return jsonError(400, 'Invalid gallery id.');
  const current = await loadStoredGallery(id);
  if (!current || current.deleted) return jsonError(404, 'Gallery not found.');

  let body: Partial<StoredGallery> = {};
  try {
    body = (await request.json()) as Partial<StoredGallery>;
  } catch {
    return jsonError(400, 'Invalid JSON');
  }

  const year = String(body.year ?? current.year);
  const next = applyClientEdits(current, {
      title: body.title ?? current.title,
      description: body.description ?? current.description,
      year,
      generation: String(body.generation || generationFromYear(year) || current.generation),
      trim: body.trim ?? current.trim,
      body: body.body ?? current.body,
      vehicleColor: body.vehicleColor ?? current.vehicleColor,
      front: body.front ?? current.front,
      rear: body.rear ?? current.rear,
      square: body.square ?? current.square,
      youtubeId: body.youtubeId ?? current.youtubeId,
      photos: body.photos ?? current.photos,
      coverId: body.coverId ?? current.coverId,
    }, {
      title: body.title != null,
      description: body.description != null,
      vehicle: body.year != null || body.trim != null || body.vehicleColor != null || body.body != null,
      wheels: body.front != null || body.rear != null || body.square != null,
      photos: body.photos != null || body.coverId != null,
      youtube: body.youtubeId != null,
    });
  const keep = new Set(next.photos.map((photo) => photo.id));
  for (const photo of current.photos) {
    if (!keep.has(photo.id)) await deleteGalleryPhotoBlob(photo);
  }
  const saved = await saveStoredGallery(next);
  bustGalleryCatalogCache();
  return jsonOk({ item: saved });
};

export const DELETE: APIRoute = async ({ cookies, request, params }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const id = params.id || '';
  if (!isValidGallerySlug(id)) return jsonError(400, 'Invalid gallery id.');
  const current = await loadStoredGallery(id);
  if (!current) return jsonError(404, 'Gallery not found.');
  for (const photo of current.photos) {
    await deleteGalleryPhotoBlob(photo);
  }
  await deleteStoredGallery(id);
  bustGalleryCatalogCache();
  return jsonOk({ ok: true });
};
