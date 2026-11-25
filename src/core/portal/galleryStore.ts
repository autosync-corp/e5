import { portalRedis } from '@/core/portal/slides.ts';
import {
  emptyGallery,
  emptyWheel,
  GALLERY_INDEX_KEY,
  GALLERY_STORE_VERSION,
  GALLERY_SYNC_KEY,
  galleryItemKey,
  MAX_GALLERY_DESCRIPTION,
  MAX_GALLERY_SLUG,
  MAX_GALLERY_TITLE,
  type GalleryClientEdited,
  type GalleryIndex,
  type GallerySyncState,
  type GalleryWheelPick,
  type StoredGallery,
  type StoredGalleryPhoto,
} from '@/core/portal/galleryTypes.ts';
import { generationFromYear, youtubeIdFromInput } from '@/core/portal/galleryCopy.ts';
import { proposedSeoSlug, uniqueSeoSlug } from '@/core/portal/gallerySeo.ts';
import type { CorvetteGalleryItem } from '@/pages/gallery/constants/CorvetteGalleryData.ts';

export type StoredGalleryRecord = CorvetteGalleryItem & {
  autosyncId?: number;
  catalogSource: 'store';
};

const ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/;

function clip(value: unknown, max: number): string {
  return String(value || '').trim().slice(0, max);
}

function asWheel(raw: unknown): GalleryWheelPick {
  const row = raw && typeof raw === 'object' ? (raw as GalleryWheelPick) : emptyWheel();
  return {
    style: clip(row.style, 40),
    size: clip(row.size, 40),
    finish: clip(row.finish, 60),
    pn: clip(row.pn, 40).toUpperCase(),
  };
}

function asPhoto(raw: unknown): StoredGalleryPhoto | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as StoredGalleryPhoto;
  const id = clip(row.id, 160);
  const publicPath = clip(row.publicPath, 300);
  const blobUrl = clip(row.blobUrl, 500);
  const blobPath = clip(row.blobPath, 300);
  if (!id || !publicPath) return null;
  return {
    id,
    blobPath,
    blobUrl,
    publicPath,
    alt: clip(row.alt, 180),
    sourcePath: clip(row.sourcePath, 300) || undefined,
  };
}

export function parseStoredGallery(raw: unknown): StoredGallery | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as StoredGallery;
  const slug = clip(row.slug, MAX_GALLERY_SLUG);
  if (!ID_RE.test(slug)) return null;
  const photos = Array.isArray(row.photos) ? row.photos.map(asPhoto).filter((item): item is StoredGalleryPhoto => Boolean(item)) : [];
  const clientEdited = row.clientEdited && typeof row.clientEdited === 'object' ? row.clientEdited : {};
  return {
    ...emptyGallery(slug),
    version: GALLERY_STORE_VERSION,
    autosyncId: typeof row.autosyncId === 'number' ? row.autosyncId : null,
    origin: row.origin === 'autosync' || row.origin === 'static' || row.origin === 'portal' ? row.origin : 'portal',
    deleted: Boolean(row.deleted),
    year: clip(row.year, 8),
    generation: clip(row.generation, 8),
    trim: clip(row.trim, 40),
    body: clip(row.body, 40),
    vehicleColor: clip(row.vehicleColor, 40),
    title: clip(row.title, MAX_GALLERY_TITLE),
    description: clip(row.description, MAX_GALLERY_DESCRIPTION),
    front: asWheel(row.front),
    rear: asWheel(row.rear),
    square: Boolean(row.square),
    youtubeId: youtubeIdFromInput(String(row.youtubeId || '')),
    photos,
    coverId: clip(row.coverId, 40) || photos[0]?.id || '',
    dateAdded: clip(row.dateAdded, 40) || new Date().toISOString().slice(0, 10),
    updatedAt: clip(row.updatedAt, 40) || new Date().toISOString(),
    autosyncUpdatedAt: clip(row.autosyncUpdatedAt, 40),
    autosyncImgUpdatedAt: clip(row.autosyncImgUpdatedAt, 40),
    previousSlugs: Array.isArray(row.previousSlugs)
      ? row.previousSlugs.map((slug) => clip(slug, MAX_GALLERY_SLUG)).filter((slug) => ID_RE.test(slug))
      : [],
    clientEdited: {
      title: Boolean(clientEdited.title),
      description: Boolean(clientEdited.description),
      photos: Boolean(clientEdited.photos),
      wheels: Boolean(clientEdited.wheels),
      vehicle: Boolean(clientEdited.vehicle),
      youtube: Boolean(clientEdited.youtube),
      slug: Boolean(clientEdited.slug),
      alts: clientEdited.alts && typeof clientEdited.alts === 'object' ? clientEdited.alts : {},
    },
  };
}

export function slugifyGalleryTitle(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_GALLERY_SLUG);
}

export function seoSlugFromGalleryFields(input: {
  year?: string;
  vehicleColor?: string;
  generation?: string;
  trim?: string;
  style?: string;
  finish?: string;
  taken?: Set<string>;
}): string {
  const base = proposedSeoSlug({
    year: input.year,
    vehicleColor: input.vehicleColor,
    generation: input.generation,
    trim: input.trim,
    style: input.style,
    finish: input.finish,
    maxLength: MAX_GALLERY_SLUG,
  });
  return uniqueSeoSlug(base, input.taken || new Set(), MAX_GALLERY_SLUG);
}

export async function loadGalleryIndex(): Promise<string[]> {
  const redis = portalRedis();
  if (!redis) return [];
  try {
    const raw = await redis.get<GalleryIndex | string[]>(GALLERY_INDEX_KEY);
    if (Array.isArray(raw)) return raw.filter((slug) => ID_RE.test(String(slug)));
    if (raw && Array.isArray(raw.slugs)) return raw.slugs.filter((slug) => ID_RE.test(String(slug)));
    return [];
  } catch {
    return [];
  }
}

async function saveGalleryIndex(slugs: string[]): Promise<void> {
  const redis = portalRedis();
  if (!redis) throw new Error('Redis is not configured (KV_REST_API_URL / KV_REST_API_TOKEN).');
  const unique = [...new Set(slugs.filter((slug) => ID_RE.test(slug)))];
  await redis.set(GALLERY_INDEX_KEY, { version: GALLERY_STORE_VERSION, slugs: unique } satisfies GalleryIndex);
}

export async function loadStoredGallery(slug: string): Promise<StoredGallery | null> {
  const redis = portalRedis();
  if (!redis || !slug) return null;
  try {
    const raw = await redis.get<unknown>(galleryItemKey(slug));
    return parseStoredGallery(raw);
  } catch {
    return null;
  }
}

export async function loadStoredGalleries(): Promise<StoredGallery[]> {
  const slugs = await loadGalleryIndex();
  const items: StoredGallery[] = [];
  for (const slug of slugs) {
    const item = await loadStoredGallery(slug);
    if (item) items.push(item);
  }
  return items;
}

export async function saveStoredGallery(item: StoredGallery): Promise<StoredGallery> {
  const redis = portalRedis();
  if (!redis) throw new Error('Redis is not configured (KV_REST_API_URL / KV_REST_API_TOKEN).');
  const parsed = parseStoredGallery({ ...item, updatedAt: new Date().toISOString() });
  if (!parsed) throw new Error('Invalid gallery.');
  if (!parsed.generation && parsed.year) parsed.generation = generationFromYear(parsed.year);
  await redis.set(galleryItemKey(parsed.slug), parsed);
  const index = await loadGalleryIndex();
  if (!index.includes(parsed.slug)) {
    index.push(parsed.slug);
    await saveGalleryIndex(index);
  }
  return parsed;
}

export async function deleteStoredGallery(slug: string): Promise<StoredGallery | null> {
  const current = await loadStoredGallery(slug);
  if (!current) return null;
  current.deleted = true;
  current.updatedAt = new Date().toISOString();
  await saveStoredGallery(current);
  return current;
}

export function storedToRecord(item: StoredGallery): StoredGalleryRecord {
  const cover = item.photos.find((photo) => photo.id === item.coverId) || item.photos[0];
  const ordered = cover ? [cover, ...item.photos.filter((photo) => photo.id !== cover.id)] : item.photos;
  const media: CorvetteGalleryItem['media'] = ordered.map((photo) => ({
    type: 'image' as const,
    url: photo.publicPath,
    alt: photo.alt,
  }));
  if (item.youtubeId) {
    media.push({ type: 'video', youtubeId: item.youtubeId });
  }
  return {
    galleryId: item.slug,
    year: item.year || null,
    submodel: item.generation || null,
    trim: item.trim || null,
    vehicleColor: item.vehicleColor || null,
    vehicleTitle: item.title || null,
    description: item.description || null,
    wheelStyle: item.front.style || null,
    wheelFinish: item.front.finish || null,
    wheelSizeF: item.front.size || null,
    offesetF: null,
    partF: item.front.pn || null,
    tireSizeF: null,
    tirePartF: null,
    wheelSizeRear: item.square ? item.front.size || null : item.rear.size || null,
    offsetR: null,
    wheelPartR: item.square ? item.front.pn || null : item.rear.pn || null,
    tireSizeR: null,
    tirePartR: null,
    tireModel: null,
    media,
    pinned: false,
    dateAdded: item.dateAdded,
    autosyncId: item.autosyncId || undefined,
    catalogSource: 'store',
  };
}

export function mergeStoredCatalog<T extends CorvetteGalleryItem & { catalogSource: string; autosyncId?: number }>(
  fallback: T[],
  stored: StoredGallery[],
): Array<T | StoredGalleryRecord> {
  const deleted = new Set(stored.filter((item) => item.deleted).map((item) => item.slug));
  const bySlug = new Map(stored.filter((item) => !item.deleted).map((item) => [item.slug, storedToRecord(item)]));
  const used = new Set<string>();
  const out: Array<T | StoredGalleryRecord> = [];
  for (const item of fallback) {
    const id = item.galleryId;
    if (!id || deleted.has(id)) continue;
    const owned = bySlug.get(id);
    if (owned) {
      out.push(owned);
      used.add(id);
    } else {
      out.push(item);
    }
  }
  for (const item of stored) {
    if (item.deleted || used.has(item.slug)) continue;
    out.push(storedToRecord(item));
  }
  return out;
}

export function applyClientEdits(
  current: StoredGallery,
  patch: Partial<StoredGallery>,
  edited: GalleryClientEdited,
): StoredGallery {
  const next: StoredGallery = {
    ...current,
    ...patch,
    front: patch.front ? asWheel(patch.front) : current.front,
    rear: patch.rear ? asWheel(patch.rear) : current.rear,
    photos: Array.isArray(patch.photos) ? patch.photos.map(asPhoto).filter((item): item is StoredGalleryPhoto => Boolean(item)) : current.photos,
    clientEdited: {
      ...current.clientEdited,
      ...edited,
      alts: { ...(current.clientEdited.alts || {}), ...(edited.alts || {}) },
    },
    updatedAt: new Date().toISOString(),
  };
  if (next.year && !next.generation) next.generation = generationFromYear(next.year);
  if (next.square) next.rear = { ...next.front };
  if (!next.coverId || !next.photos.some((photo) => photo.id === next.coverId)) {
    next.coverId = next.photos[0]?.id || '';
  }
  return next;
}

export async function loadSyncState(): Promise<GallerySyncState> {
  const redis = portalRedis();
  const fallback: GallerySyncState = {
    version: 1,
    status: 'idle',
    mode: 'backfill',
    total: 0,
    imported: 0,
    skipped: 0,
    failed: 0,
    cursor: 0,
    lastError: '',
    lastRunAt: '',
    lastFullAt: '',
    lastIncrementalAt: '',
    updatedAfter: '',
  };
  if (!redis) return fallback;
  try {
    const raw = await redis.get<GallerySyncState>(GALLERY_SYNC_KEY);
    if (!raw || typeof raw !== 'object') return fallback;
    return { ...fallback, ...raw };
  } catch {
    return fallback;
  }
}

export async function saveSyncState(state: GallerySyncState): Promise<void> {
  const redis = portalRedis();
  if (!redis) return;
  await redis.set(GALLERY_SYNC_KEY, state);
}

export function isValidGallerySlug(slug: string): boolean {
  return ID_RE.test(slug) && slug.length <= MAX_GALLERY_SLUG;
}
