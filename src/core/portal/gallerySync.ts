import {
  emptyGallery,
  MAX_GALLERY_PHOTOS,
  SYNC_BATCH,
  type GalleryWheelPick,
  type StoredGallery,
  type StoredGalleryPhoto,
} from '@/core/portal/galleryTypes.ts';
import {
  loadStoredGalleries,
  loadStoredGallery,
  loadSyncState,
  saveStoredGallery,
  saveSyncState,
} from '@/core/portal/galleryStore.ts';
import { copyRemotePhoto } from '@/core/portal/galleryPhotos.ts';
import {
  generationFromYear,
  suggestGalleryDescription,
  suggestGalleryTitle,
  suggestPhotoAlt,
} from '@/core/portal/galleryCopy.ts';
import { corvetteGalleryData } from '@/pages/gallery/constants/CorvetteGalleryData.ts';
import { blobConfigured, portalRedis } from '@/core/portal/slides.ts';
import { FINISH_CODE_TO_SITE_NAME, finishCodeFromPn } from '@/core/utils/officialPricing.ts';
import { proposedFactoryPaint } from '@/core/portal/galleryFactoryPaint.ts';
import { nextDescriptivePhotoId, proposedSeoSlug, uniqueSeoSlug } from '@/core/portal/gallerySeo.ts';
import { wheelOverrideFor } from '@/core/portal/galleryWheelOverrides.ts';
import { MAX_GALLERY_SLUG } from '@/core/portal/galleryTypes.ts';

const AUTOSYNC_GALLERIES_URL = 'https://api.autosyncstudio.com/galleries';
const AUTOSYNC_WHEELS_URL = 'https://api.autosyncstudio.com/wheels';
const AUTOSYNC_USER_AGENT = 'E5Portal/1.0';
const PN_RE = /e5[a-z]{2}(?:2p)?[a-z0-9]+/gi;
const STYLE_BY_PREFIX: Record<string, string> = {
  E5SE: 'Sebring',
  E5SP: 'Speedway',
  E5DA: 'Daytona',
  E5TA: 'Talladega',
  E5SO: 'Sonoma',
  E5LA: 'Laguna',
};

type AutoSyncGallery = {
  Id: number;
  Images?: Array<{ Path?: string }>;
  Vehicle?: { Year?: number; Make?: string; Model?: string; Submodel?: string; Body?: string };
  Wheels?: Array<{ WheelId?: number; Diameter?: number; Width?: number; Offset?: number; Position?: string }>;
  Videos?: Array<{ Id?: string }>;
  UpdatedAt?: string;
  ImgUpdatedAt?: string;
};

type AutoSyncWheelDetail = {
  Id?: number;
  Pn?: string;
  Model?: string;
  Finish?: string;
  Color?: string;
  Accent?: string;
  ShortColor?: string;
  ShortFinish?: string;
  Diameter?: number;
  Width?: number;
  Offset?: number;
};

function env(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  return fromMeta || '';
}

function autosyncKey(): string {
  return env('PUBLIC_AUTOSYNC_API_KEY') || env('AUTOSYNC_API_KEY') || 'efive';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractPns(text: string): Set<string> {
  const found = new Set<string>();
  for (const match of text.matchAll(PN_RE)) found.add(match[0].toUpperCase());
  return found;
}

function styleFromPn(pn: string): string {
  const gt = pn.match(/^E5GT0([1-4])/);
  if (gt) return `GT.0${gt[1]}`;
  const prefix = pn.slice(0, 4);
  const base = STYLE_BY_PREFIX[prefix];
  if (!base) return '';
  if (pn.includes('2P')) return `${base} 2P`;
  return base;
}

function finishFromPath(path: string): string {
  const p = path.toLowerCase();
  const pairs: Array<[string, string]> = [
    ['gloss_black_polished_lip', 'Gloss Black Polished Lip'],
    ['bronze_polished_lip', 'Bronze Polished Lip'],
    ['bronze_black_lip', 'Bronze Black Lip'],
    ['gray_black_lip', 'Gray Black Lip'],
    ['titanium_polished_lip', 'Titanium Polished Lip'],
    ['titanium_black_lip', 'Titanium Black Lip'],
    ['titanium_brushed', 'Titanium Brushed'],
    ['gloss_black', 'Gloss Black'],
    ['satin_black', 'Satin Black'],
    ['brushed_aluminum', 'Brushed Aluminum'],
    ['dark_bronze', 'Dark Bronze'],
    ['polished', 'Polished'],
    ['chrome', 'Chrome'],
  ];
  for (const [token, label] of pairs) {
    if (p.includes(token)) return label;
  }
  const code = finishCodeFromPn(pnFromPath(path));
  return (code && FINISH_CODE_TO_SITE_NAME[code]) || '';
}

function pnFromPath(path: string): string {
  return [...extractPns(path)][0] || '';
}

function wheelSize(wheel?: { Diameter?: number; Width?: number; Offset?: number }): string {
  if (!wheel?.Diameter || !wheel.Width) return '';
  const offset = wheel.Offset == null ? '' : ` +${wheel.Offset}mm`;
  return `${wheel.Diameter}" x ${wheel.Width}"${offset}`;
}

function pickStaticSlug(year: string, pns: Set<string>, claimed: Set<string>): string | null {
  if (!year || pns.size === 0) return null;
  const unused = corvetteGalleryData.filter((item) => item.galleryId && item.year === year && !claimed.has(item.galleryId));
  const hit = (item: (typeof unused)[number]) => {
    const front = (item.partF || '').toUpperCase();
    const rear = (item.wheelPartR || '').toUpperCase();
    return { both: Boolean(front && pns.has(front) && rear && pns.has(rear)), either: Boolean((front && pns.has(front)) || (rear && pns.has(rear))) };
  };
  const both = unused.filter((item) => hit(item).both);
  if (both.length === 1) return both[0].galleryId;
  if (both.length > 1) return null;
  const either = unused.filter((item) => hit(item).either);
  if (either.length === 1) return either[0].galleryId;
  return null;
}

async function fetchGalleryPage(opts: { page: number; updatedAfter?: string; imgUpdatedAfter?: string }): Promise<{
  galleries: AutoSyncGallery[];
  more: boolean;
  imgBase: string;
}> {
  const params = new URLSearchParams({
    source: 'vvs',
    key: autosyncKey(),
    'p-size': '200',
    'p-number': String(opts.page),
  });
  if (opts.updatedAfter) params.set('f-updatedAfter', opts.updatedAfter);
  if (opts.imgUpdatedAfter) params.set('f-imgUpdatedAfter', opts.imgUpdatedAfter);
  const includes = 'i-img&i-vehicle&i-wheels&i-tires&i-videos&i-updatedAt&i-imgUpdatedAt';
  const res = await fetch(`${AUTOSYNC_GALLERIES_URL}?${params.toString()}&${includes}`, {
    headers: { Accept: 'application/json', 'User-Agent': AUTOSYNC_USER_AGENT },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`autosync galleries status=${res.status}`);
  const data = (await res.json()) as { Galleries?: AutoSyncGallery[]; MoreItems?: boolean; ImgUrlBase?: string };
  return {
    galleries: data.Galleries || [],
    more: Boolean(data.MoreItems),
    imgBase: data.ImgUrlBase || '',
  };
}

async function fetchGalleriesByFilter(filter: { updatedAfter?: string; imgUpdatedAfter?: string }): Promise<{
  galleries: AutoSyncGallery[];
  imgBase: string;
}> {
  const galleries: AutoSyncGallery[] = [];
  let imgBase = '';
  for (let page = 1; page <= 10; page += 1) {
    const data = await fetchGalleryPage({ page, ...filter });
    imgBase = data.imgBase || imgBase;
    galleries.push(...data.galleries);
    if (!data.more) break;
    await sleep(60);
  }
  return { galleries, imgBase };
}

async function fetchGalleries(updatedAfter = ''): Promise<{ galleries: AutoSyncGallery[]; imgBase: string }> {
  const primary = await fetchGalleriesByFilter(updatedAfter ? { updatedAfter } : {});
  let galleries = primary.galleries;
  let imgBase = primary.imgBase;
  if (updatedAfter) {
    const extra = await fetchGalleriesByFilter({ imgUpdatedAfter: updatedAfter });
    const seen = new Set(galleries.map((gallery) => gallery.Id));
    for (const gallery of extra.galleries) {
      if (!seen.has(gallery.Id)) galleries.push(gallery);
    }
    imgBase = imgBase || extra.imgBase;
  }
  if (!imgBase) imgBase = 'https://storage.googleapis.com/autosync-galleries/webp/';
  if (!imgBase.endsWith('/')) imgBase += '/';
  return { galleries, imgBase };
}

const wheelCache = new Map<number, AutoSyncWheelDetail | null>();

async function fetchWheel(id: number): Promise<AutoSyncWheelDetail | null> {
  if (wheelCache.has(id)) return wheelCache.get(id) || null;
  await sleep(50);
  const params = new URLSearchParams({ key: autosyncKey(), 'f-id': String(id), 'i-specs': 'true' });
  const res = await fetch(`${AUTOSYNC_WHEELS_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json', 'User-Agent': AUTOSYNC_USER_AGENT },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    wheelCache.set(id, null);
    return null;
  }
  const data = (await res.json()) as { Wheels?: AutoSyncWheelDetail[] };
  const wheel = data.Wheels?.[0] || null;
  wheelCache.set(id, wheel);
  return wheel;
}

async function wheelPickFrom(
  wheel: NonNullable<AutoSyncGallery['Wheels']>[number] | undefined,
  path: string,
): Promise<GalleryWheelPick> {
  const pn = pnFromPath(path);
  let detail: AutoSyncWheelDetail | null = null;
  if (wheel?.WheelId) detail = await fetchWheel(wheel.WheelId);
  const style = (detail?.Model || styleFromPn(detail?.Pn || pn)).trim();
  const finish = [detail?.Finish, detail?.Color, detail?.Accent]
    .map((value) => (value || '').trim())
    .filter(Boolean)
    .join(' ') || finishFromPath(path);
  const size = wheelSize(detail || wheel);
  return {
    style,
    size,
    finish,
    pn: (detail?.Pn || pn).toUpperCase(),
  };
}

function existingTitleForSlug(slug: string): string {
  const staticItem = corvetteGalleryData.find((item) => item.galleryId === slug);
  return (staticItem?.vehicleTitle || '').trim();
}

export async function importAutoSyncGallery(
  gallery: AutoSyncGallery,
  imgBase: string,
  claimed: Set<string>,
  byAutosyncId: Map<number, StoredGallery>,
): Promise<'imported' | 'skipped' | 'failed'> {
  const vehicle = gallery.Vehicle || {};
  if (vehicle.Make && vehicle.Make !== 'Chevrolet') return 'skipped';
  if (vehicle.Model && vehicle.Model !== 'Corvette') return 'skipped';
  const images = (gallery.Images || []).map((image) => image.Path).filter((path): path is string => Boolean(path));
  if (images.length === 0) return 'skipped';

  const pns = extractPns(images.join(' '));
  const year = vehicle.Year ? String(vehicle.Year) : '';
  const existingById = byAutosyncId.get(gallery.Id);
  const matchedSlug = existingById?.slug || (year ? pickStaticSlug(year, pns, claimed) : null);
  let slug = existingById?.slug || matchedSlug || '';
  if (matchedSlug) claimed.add(matchedSlug);

  const current = existingById || (slug ? await loadStoredGallery(slug) : null);
  if (current?.deleted) return 'skipped';
  const photosFresh = Boolean(
    current &&
      current.photos.length > 0 &&
      current.autosyncUpdatedAt === (gallery.UpdatedAt || '') &&
      current.autosyncImgUpdatedAt === (gallery.ImgUpdatedAt || ''),
  );

  const wheels = gallery.Wheels || [];
  const frontWheel = wheels.find((wheel) => String(wheel.Position || '').toLowerCase() === 'front') || wheels[0];
  const rearWheel = wheels.find((wheel) => String(wheel.Position || '').toLowerCase() === 'rear') || wheels[1] || frontWheel;
  const front = await wheelPickFrom(frontWheel, images[0] || '');
  const rear = await wheelPickFrom(rearWheel, images[images.length - 1] || images[0] || '');
  const generation = generationFromYear(year);
  const trim = (vehicle.Submodel || '').trim();
  const body = (vehicle.Body || '').trim();
  const staticItem = corvetteGalleryData.find((item) => item.galleryId === slug);
  const paintColor = (staticItem?.vehicleColor || (slug && proposedFactoryPaint(slug)) || '').trim();
  if (!slug) {
    slug = uniqueSeoSlug(
      proposedSeoSlug({
        year,
        vehicleColor: paintColor,
        generation,
        trim,
        style: front.style,
        finish: front.finish,
        maxLength: MAX_GALLERY_SLUG,
      }),
      claimed,
      MAX_GALLERY_SLUG,
    );
  }
  const draft = current ? { ...current } : emptyGallery(slug);
  draft.slug = slug;
  draft.autosyncId = gallery.Id;
  draft.origin = matchedSlug ? 'static' : 'autosync';
  draft.deleted = false;
  if (!draft.clientEdited.vehicle) {
    draft.year = year || draft.year;
    draft.generation = generation || draft.generation;
    draft.trim = trim || draft.trim;
    draft.body = body || draft.body;
    draft.vehicleColor = paintColor || draft.vehicleColor;
  }
  if (!draft.clientEdited.wheels) {
    draft.front = front.style || front.pn ? front : draft.front;
    draft.rear = rear.style || rear.pn ? rear : draft.rear;
    const ov = wheelOverrideFor({ slug: draft.slug, autosyncId: gallery.Id });
    if (ov) {
      draft.front = { ...draft.front, style: ov.style, finish: ov.finish };
      draft.rear = { ...draft.rear, style: ov.style, finish: ov.finish };
    }
    draft.square = Boolean(draft.front.pn && draft.rear.pn && draft.front.pn === draft.rear.pn);
  }
  const generatedTitle = suggestGalleryTitle({
    year: draft.year,
    vehicleColor: draft.vehicleColor,
    generation: draft.generation,
    trim: draft.trim,
    style: draft.front.style,
    finish: draft.front.finish,
  });
  const staticTitle = existingTitleForSlug(slug);
  const suggestedTitle = draft.vehicleColor || !staticTitle ? generatedTitle : staticTitle;
  const suggestedDescription = suggestGalleryDescription(draft);
  if (!draft.clientEdited.title) draft.title = suggestedTitle;
  if (!draft.clientEdited.description) draft.description = suggestedDescription;
  if (!draft.clientEdited.youtube) {
    draft.youtubeId = gallery.Videos?.find((video) => video.Id)?.Id || draft.youtubeId;
  }
  draft.autosyncUpdatedAt = gallery.UpdatedAt || draft.autosyncUpdatedAt;
  draft.autosyncImgUpdatedAt = gallery.ImgUpdatedAt || draft.autosyncImgUpdatedAt;
  if (!draft.dateAdded) {
    draft.dateAdded = (gallery.ImgUpdatedAt || gallery.UpdatedAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
  }

  if (!draft.clientEdited.photos) {
    if (photosFresh) {
      draft.photos = draft.photos.map((photo, index) => {
        if (draft.clientEdited.alts?.[photo.id]) return photo;
        return { ...photo, alt: suggestPhotoAlt(draft, photo, index) };
      });
    } else {
      const have = new Set(draft.photos.map((photo) => photo.sourcePath).filter(Boolean));
      const nextPhotos: StoredGalleryPhoto[] = [...draft.photos];
      for (const [index, path] of images.slice(0, MAX_GALLERY_PHOTOS).entries()) {
        if (have.has(path)) continue;
        const alt = suggestPhotoAlt(draft, { id: `tmp-${index}` }, index);
        const originalUrl = `${imgBase}${path}`;
        try {
          const photo = await copyRemotePhoto({
          slug,
          url: originalUrl,
          sourcePath: path,
          alt,
          photoId: nextDescriptivePhotoId(slug, nextPhotos),
          existing: nextPhotos,
        });
          nextPhotos.push(photo);
          await sleep(50);
        } catch (err) {
          console.error(`portal-galleries photo failed slug=${slug} path=${path} ${err instanceof Error ? err.message : 'unknown'}`);
        }
      }
      draft.photos = nextPhotos.slice(0, MAX_GALLERY_PHOTOS);
      if (!draft.coverId) draft.coverId = draft.photos[0]?.id || '';
    }
  }

  if (
    photosFresh &&
    current &&
    current.vehicleColor === draft.vehicleColor &&
    current.title === draft.title &&
    current.description === draft.description &&
    current.front.finish === draft.front.finish &&
    current.photos.every((photo, index) => photo.alt === draft.photos[index]?.alt)
  ) {
    return 'skipped';
  }

  await saveStoredGallery(draft);
  claimed.add(draft.slug);
  byAutosyncId.set(gallery.Id, draft);
  return 'imported';
}

export async function runGallerySync(opts: { incremental?: boolean; maxGalleries?: number } = {}): Promise<{
  status: string;
  imported: number;
  skipped: number;
  failed: number;
  total: number;
  cursor: number;
  lastError: string;
  remaining: number;
}> {
  if (!portalRedis()) throw new Error('Redis is not configured (KV_REST_API_URL / KV_REST_API_TOKEN).');
  if (!blobConfigured()) throw new Error('Vercel Blob is not configured. Add BLOB_READ_WRITE_TOKEN.');

  const state = await loadSyncState();
  const incremental = Boolean(opts.incremental && state.lastFullAt);
  const updatedAfter = incremental ? state.updatedAfter || state.lastFullAt.slice(0, 10) : '';
  const { galleries, imgBase } = await fetchGalleries(updatedAfter);
  const e5 = galleries.filter((gallery) => {
    const make = gallery.Vehicle?.Make;
    const model = gallery.Vehicle?.Model;
    return (!make || make === 'Chevrolet') && (!model || model === 'Corvette');
  });
  const max = Math.max(1, Math.min(opts.maxGalleries || SYNC_BATCH, 8));
  const start = incremental ? 0 : state.cursor;
  const slice = e5.slice(start, start + max);
  const stored = await loadStoredGalleries();
  const claimed = new Set(stored.filter((item) => !item.deleted).map((item) => item.slug));
  const byAutosyncId = new Map(
    stored.filter((item) => item.autosyncId).map((item) => [item.autosyncId as number, item]),
  );
  let imported = state.imported;
  let skipped = state.skipped;
  let failed = state.failed;
  let lastError = '';

  state.status = 'running';
  state.mode = incremental ? 'incremental' : 'backfill';
  state.total = incremental ? e5.length : Math.max(state.total, e5.length);
  state.lastRunAt = new Date().toISOString();
  await saveSyncState(state);

  for (const gallery of slice) {
    try {
      const result = await importAutoSyncGallery(gallery, imgBase, claimed, byAutosyncId);
      if (result === 'imported') imported += 1;
      else skipped += 1;
    } catch (err) {
      failed += 1;
      lastError = err instanceof Error ? err.message : 'unknown';
      console.error(`portal-galleries sync failed id=${gallery.Id} ${lastError}`);
    }
  }

  const nextCursor = incremental ? 0 : start + slice.length;
  const done = incremental || nextCursor >= e5.length;
  const next = {
    ...state,
    status: done ? 'complete' : 'running',
    imported,
    skipped,
    failed,
    cursor: done ? 0 : nextCursor,
    lastError,
    lastFullAt: !incremental && done ? new Date().toISOString() : state.lastFullAt,
    lastIncrementalAt: incremental ? new Date().toISOString() : state.lastIncrementalAt,
    updatedAfter: new Date().toISOString().slice(0, 10),
    total: incremental ? e5.length : e5.length,
  } as const;
  await saveSyncState({ ...state, ...next });
  return {
    status: next.status,
    imported,
    skipped,
    failed,
    total: next.total,
    cursor: next.cursor,
    lastError,
    remaining: Math.max(0, e5.length - nextCursor),
  };
}

