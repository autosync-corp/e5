import type { APIRoute } from 'astro';
import { jsonError, jsonOk, requirePortalSession, requireSameOrigin } from '@/core/portal/api-guard.ts';
import {
  applyClientEdits,
  isValidGallerySlug,
  loadGalleryIndex,
  loadStoredGallery,
  saveStoredGallery,
  slugifyGalleryTitle,
} from '@/core/portal/galleryStore.ts';
import { emptyGallery } from '@/core/portal/galleryTypes.ts';
import { generationFromYear, suggestGalleryDescription, suggestGalleryTitle } from '@/core/portal/galleryCopy.ts';
import { bustGalleryCatalogCache, loadGalleryCatalog, type GalleryRecord } from '@/core/portal/galleries.ts';
import { corvetteGalleryData } from '@/pages/gallery/constants/CorvetteGalleryData.ts';
import { copyRemotePhoto } from '@/core/portal/galleryPhotos.ts';
import { galleryMediaItems } from '@/pages/gallery/utils/galleryMedia.ts';
import { SITE_URL } from '@/core/constants/Site.ts';

export const prerender = false;
export const maxDuration = 60;

async function uniqueSlug(base: string): Promise<string> {
  const index = new Set(await loadGalleryIndex());
  for (const item of corvetteGalleryData) {
    if (item.galleryId) index.add(item.galleryId);
  }
  let slug = base || 'gallery';
  let n = 2;
  while (index.has(slug) || slug === 'new' || (await loadStoredGallery(slug))) {
    slug = `${base.slice(0, 70)}-${n}`;
    n += 1;
  }
  return slug;
}

export const POST: APIRoute = async ({ cookies, request }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return jsonError(400, 'Invalid JSON');
  }

  const promote = String(body.promote || '').trim();
  if (promote) {
    if (!isValidGallerySlug(promote)) return jsonError(400, 'Invalid gallery id.');
    const existing = await loadStoredGallery(promote);
    if (existing && !existing.deleted) return jsonOk({ item: existing });
    const catalog = await loadGalleryCatalog();
    const catalogItem = catalog.find((item) => item.galleryId === promote) as GalleryRecord | undefined;
    if (!catalogItem?.galleryId) return jsonError(404, 'Gallery not found.');
    const draft = emptyGallery(catalogItem.galleryId);
    draft.origin = catalogItem.catalogSource === 'autosync' || catalogItem.catalogSource === 'matched' ? 'autosync' : 'static';
    draft.autosyncId = catalogItem.autosyncId || null;
    draft.year = catalogItem.year || '';
    draft.generation = catalogItem.submodel || generationFromYear(catalogItem.year || '');
    draft.trim = catalogItem.trim || '';
    draft.vehicleColor = catalogItem.vehicleColor || '';
    draft.title = catalogItem.vehicleTitle || suggestGalleryTitle(draft);
    draft.description = catalogItem.description || suggestGalleryDescription(draft);
    draft.front = {
      style: catalogItem.wheelStyle || '',
      size: catalogItem.wheelSizeF || '',
      finish: catalogItem.wheelFinish || '',
      pn: (catalogItem.partF || '').toUpperCase(),
    };
    draft.rear = {
      style: catalogItem.wheelStyle || '',
      size: catalogItem.wheelSizeRear || catalogItem.wheelSizeF || '',
      finish: catalogItem.wheelFinish || '',
      pn: (catalogItem.wheelPartR || catalogItem.partF || '').toUpperCase(),
    };
    draft.square = Boolean(draft.front.pn && draft.front.pn === draft.rear.pn);
    const media = galleryMediaItems(catalogItem).filter((entry) => entry.type === 'image' && entry.url);
    for (const entry of media.slice(0, 40)) {
      const url = entry.url!.startsWith('http') ? entry.url! : `${SITE_URL}${entry.url}`;
      try {
        draft.photos.push(await copyRemotePhoto({ slug: draft.slug, url, sourcePath: entry.url, alt: entry.alt }));
      } catch {
        /* keep going */
      }
    }
    if (!draft.coverId) draft.coverId = draft.photos[0]?.id || '';
    const saved = await saveStoredGallery(draft);
    bustGalleryCatalogCache();
    return jsonOk({ item: saved }, 201);
  }

  const title = String(body.title || '').trim();
  let slug = String(body.slug || slugifyGalleryTitle(title) || 'gallery')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  if (!isValidGallerySlug(slug) || slug === 'new') return jsonError(400, 'Invalid gallery id.');
  slug = await uniqueSlug(slug);
  const year = String(body.year || '').trim();
  const draft = emptyGallery(slug);
  const saved = await saveStoredGallery(
    applyClientEdits(draft, {
      ...draft,
      title: title || suggestGalleryTitle({ year, generation: generationFromYear(year), trim: String(body.trim || '') }),
      year,
      generation: String(body.generation || generationFromYear(year)),
      trim: String(body.trim || ''),
      body: String(body.body || ''),
      vehicleColor: String(body.vehicleColor || ''),
      description: String(body.description || ''),
      front: (body.front as typeof draft.front) || draft.front,
      rear: (body.rear as typeof draft.rear) || draft.rear,
      square: Boolean(body.square),
      youtubeId: String(body.youtubeId || ''),
      photos: Array.isArray(body.photos) ? (body.photos as typeof draft.photos) : [],
      coverId: String(body.coverId || ''),
      origin: 'portal',
    }, {
      title: Boolean(title),
      description: Boolean(body.description),
      vehicle: true,
      wheels: true,
      photos: Array.isArray(body.photos),
      youtube: Boolean(body.youtubeId),
    }),
  );
  bustGalleryCatalogCache();
  return jsonOk({ item: saved }, 201);
};
