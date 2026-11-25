import { portalRedis } from '@/core/portal/slides.ts';
import {
  corvetteGalleryData,
  type CorvetteGalleryItem,
  type GalleryListing,
} from '@/pages/gallery/constants/CorvetteGalleryData.ts';
import { galleryCoverUrl } from '@/pages/gallery/utils/galleryMedia.ts';
import { sortGalleryItems } from '@/pages/gallery/utils/sortGallery.ts';

export const GALLERIES_REDIS_KEY = 'e5:portal:galleries';
export const GALLERIES_DOC_VERSION = 1;
export const GALLERY_CACHE_MS = 5 * 60 * 1000;
const AUTOSYNC_GALLERIES_URL = 'https://api.autosyncstudio.com/galleries';
const AUTOSYNC_USER_AGENT = 'E5Portal/1.0';
const PAGE_SIZE = 200;
const MAX_PAGES = 10;
const MAX_ITEMS = 250;
const ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/;
const PN_RE = /e5[a-z]{2}(?:2p)?[a-z0-9]+/gi;

const STYLE_BY_PREFIX: Record<string, string> = {
  E5SE: 'Sebring',
  E5SP: 'Speedway',
  E5DA: 'Daytona',
  E5TA: 'Talladega',
  E5SO: 'Sonoma',
  E5LA: 'Laguna',
};

export type GalleryCatalogSource = 'autosync' | 'static' | 'matched';

export type GalleryRecord = CorvetteGalleryItem & {
  autosyncId?: number;
  catalogSource: GalleryCatalogSource;
};

export type PortalGalleryRow = {
  id: string;
  title: string;
  year: string;
  image: string;
  hidden: boolean;
  source: 'autosync' | 'site';
};

export type { GalleryListing };

type OverlayItem = { id: string; hidden: boolean };
type OverlayDoc = { version: number; items: OverlayItem[] };

type AutoSyncImage = { Path?: string };
type AutoSyncVehicle = { Year?: number; Make?: string; Model?: string; Submodel?: string };
type AutoSyncWheel = { Diameter?: number; Width?: number; Offset?: number; Position?: string };
type AutoSyncTire = {
  Brand?: string;
  SectionWidth?: number;
  AspectRatio?: number;
  RimDiameter?: number;
  Position?: string;
};
type AutoSyncVideo = { Id?: string };
type AutoSyncGallery = {
  Id: number;
  Images?: AutoSyncImage[];
  Vehicle?: AutoSyncVehicle;
  Wheels?: AutoSyncWheel[];
  Tires?: AutoSyncTire[];
  Videos?: AutoSyncVideo[];
  UpdatedAt?: string;
  ImgUpdatedAt?: string;
};
type AutoSyncResponse = {
  Galleries?: AutoSyncGallery[];
  MoreItems?: boolean;
  ImgUrlBase?: string;
};

let catalogCache: { at: number; items: GalleryRecord[] } | null = null;

function env(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  return fromMeta || '';
}

function autosyncKey(): string {
  return env('PUBLIC_AUTOSYNC_API_KEY') || env('AUTOSYNC_API_KEY') || 'efive';
}

function logGalleryFailure(step: string, detail: string): void {
  console.error(`portal-galleries failed step=${step} ${detail}`);
}

function extractPns(text: string): Set<string> {
  const found = new Set<string>();
  for (const match of text.matchAll(PN_RE)) {
    found.add(match[0].toUpperCase());
  }
  return found;
}

function generationFromYear(year: number): string {
  if (year >= 2020) return 'C8';
  if (year >= 2014) return 'C7';
  if (year >= 2005) return 'C6';
  if (year >= 1997) return 'C5';
  return 'C8';
}

function styleFromPns(pns: Set<string>): string | null {
  for (const pn of pns) {
    const prefix = pn.slice(0, 4);
    const base = STYLE_BY_PREFIX[prefix];
    if (!base) continue;
    if (pn.includes('2P')) return `${base} 2P`;
    return base;
  }
  return null;
}

function finishFromPath(path: string): string | null {
  const p = path.toLowerCase();
  const pairs: Array<[string, string]> = [
    ['gloss_black_polished_lip', 'Gloss Black Polished Lip'],
    ['bronze_polished_lip', 'Bronze Polished Lip'],
    ['bronze_black_lip', 'Bronze Black Lip'],
    ['gray_polished_lip', 'Gray Polished Lip'],
    ['gray_black_lip', 'Gray Black Lip'],
    ['titanium_polished_lip', 'Titanium Polished Lip'],
    ['titanium_black_lip', 'Titanium Black Lip'],
    ['titanium_brushed_tint', 'Titanium Brushed Tint'],
    ['titanium_brushed', 'Titanium Brushed'],
    ['titanium_gray', 'Titanium Gray'],
    ['gloss_black', 'Gloss Black'],
    ['satin_black', 'Satin Black'],
    ['dark_bronze', 'Dark Bronze'],
    ['brushed_aluminum', 'Brushed Aluminum'],
    ['bronze', 'Bronze'],
    ['polished', 'Polished'],
    ['chrome', 'Chrome'],
    ['gloss', 'Gloss'],
  ];
  for (const [token, label] of pairs) {
    if (p.includes(token)) return label;
  }
  return null;
}

function wheelSize(wheel: AutoSyncWheel | undefined): string | null {
  if (!wheel || !wheel.Diameter || !wheel.Width) return null;
  return `${wheel.Diameter}" x ${wheel.Width}"`;
}

function wheelOffset(wheel: AutoSyncWheel | undefined): string | null {
  if (wheel?.Offset == null || Number.isNaN(Number(wheel.Offset))) return null;
  return `${wheel.Offset}mm`;
}

function tireSize(tire: AutoSyncTire | undefined): string | null {
  if (!tire?.SectionWidth || !tire.AspectRatio || !tire.RimDiameter) return null;
  return `${tire.SectionWidth}/${tire.AspectRatio}R${tire.RimDiameter}`;
}

function isoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1];
}

function cloneStatic(item: CorvetteGalleryItem): GalleryRecord {
  return { ...item, catalogSource: 'static' };
}

function galleryPns(gallery: AutoSyncGallery): Set<string> {
  const blob = (gallery.Images || []).map((image) => image.Path || '').join(' ');
  return extractPns(blob);
}

function staticUnused(year: string, claimed: Set<string>): CorvetteGalleryItem[] {
  return corvetteGalleryData.filter((item) => {
    if (!item.galleryId || claimed.has(item.galleryId)) return false;
    return item.year === year;
  });
}

function pnHit(item: CorvetteGalleryItem, pns: Set<string>): { both: boolean; either: boolean } {
  const front = (item.partF || '').toUpperCase();
  const rear = (item.wheelPartR || '').toUpperCase();
  const frontHit = Boolean(front && pns.has(front));
  const rearHit = Boolean(rear && pns.has(rear));
  return { both: frontHit && rearHit, either: frontHit || rearHit };
}

function pickUniqueStatic(year: string, pns: Set<string>, claimed: Set<string>): CorvetteGalleryItem | null {
  if (pns.size === 0) return null;
  const unused = staticUnused(year, claimed);
  const both = unused.filter((item) => pnHit(item, pns).both);
  if (both.length === 1) return both[0];
  if (both.length > 1) return null;
  const either = unused.filter((item) => pnHit(item, pns).either);
  if (either.length === 1) return either[0];
  return null;
}

function mapAutoSyncGallery(
  gallery: AutoSyncGallery,
  imgBase: string,
  matched: CorvetteGalleryItem | null,
): GalleryRecord | null {
  const vehicle = gallery.Vehicle || {};
  if (vehicle.Make && vehicle.Make !== 'Chevrolet') return null;
  if (vehicle.Model && vehicle.Model !== 'Corvette') return null;

  const images = (gallery.Images || []).map((image) => image.Path).filter((path): path is string => Boolean(path));
  if (images.length === 0) return null;

  const pns = galleryPns(gallery);
  const wheels = gallery.Wheels || [];
  const frontWheel = wheels.find((wheel) => wheel.Position === 'front') || wheels[0];
  const rearWheel = wheels.find((wheel) => wheel.Position === 'rear') || wheels[1];
  const tires = gallery.Tires || [];
  const frontTire = tires.find((tire) => tire.Position === 'front') || tires[0];
  const rearTire = tires.find((tire) => tire.Position === 'rear') || tires[1];
  const year = vehicle.Year ? String(vehicle.Year) : matched?.year || null;
  const generation = year ? generationFromYear(Number(year)) : matched?.submodel || 'C8';
  const trim = vehicle.Submodel || matched?.trim || null;
  const firstPath = images[0];
  const media = [
    ...images.map((path) => ({ type: 'image' as const, url: `${imgBase}${path}` })),
    ...(gallery.Videos || [])
      .filter((video) => video.Id)
      .map((video) => ({ type: 'video' as const, youtubeId: video.Id })),
  ];

  if (matched) {
    return {
      ...matched,
      media,
      images: undefined,
      wheelSizeF: matched.wheelSizeF || wheelSize(frontWheel),
      wheelSizeRear: matched.wheelSizeRear || wheelSize(rearWheel),
      offesetF: matched.offesetF || wheelOffset(frontWheel),
      offsetR: matched.offsetR || wheelOffset(rearWheel),
      tireSizeF: matched.tireSizeF || tireSize(frontTire),
      tireSizeR: matched.tireSizeR || tireSize(rearTire),
      tireModel: matched.tireModel || frontTire?.Brand || null,
      autosyncId: gallery.Id,
      catalogSource: 'matched',
    };
  }

  const title = [year, generation, 'Corvette', trim].filter(Boolean).join(' ');
  return {
    galleryId: `g-${gallery.Id}`,
    dateAdded: isoDate(gallery.ImgUpdatedAt) || isoDate(gallery.UpdatedAt),
    year,
    submodel: generation,
    trim,
    vehicleColor: null,
    vehicleTitle: title || `Corvette gallery ${gallery.Id}`,
    wheelStyle: styleFromPns(pns),
    wheelFinish: finishFromPath(firstPath),
    wheelSizeF: wheelSize(frontWheel),
    offesetF: wheelOffset(frontWheel),
    partF: [...pns][0] || null,
    tireSizeF: tireSize(frontTire),
    tirePartF: null,
    wheelSizeRear: wheelSize(rearWheel),
    offsetR: wheelOffset(rearWheel),
    wheelPartR: [...pns][1] || null,
    tireSizeR: tireSize(rearTire),
    tirePartR: null,
    tireModel: frontTire?.Brand || null,
    media,
    pinned: false,
    autosyncId: gallery.Id,
    catalogSource: 'autosync',
  };
}

async function fetchAutoSyncPage(page: number): Promise<AutoSyncResponse> {
  const params = new URLSearchParams({
    source: 'vvs',
    key: autosyncKey(),
    'p-size': String(PAGE_SIZE),
    'p-number': String(page),
  });
  const includes = 'i-img&i-vehicle&i-wheels&i-tires&i-videos&i-updatedAt';
  const res = await fetch(`${AUTOSYNC_GALLERIES_URL}?${params.toString()}&${includes}`, {
    headers: { Accept: 'application/json', 'User-Agent': AUTOSYNC_USER_AGENT },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    throw new Error(`status=${res.status}`);
  }
  return (await res.json()) as AutoSyncResponse;
}

async function fetchAutoSyncGalleries(): Promise<{ galleries: AutoSyncGallery[]; imgBase: string }> {
  const galleries: AutoSyncGallery[] = [];
  let imgBase = '';
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const data = await fetchAutoSyncPage(page);
    imgBase = data.ImgUrlBase || imgBase;
    const rows = Array.isArray(data.Galleries) ? data.Galleries : [];
    galleries.push(...rows);
    if (!data.MoreItems) break;
  }
  if (!imgBase) imgBase = 'https://storage.googleapis.com/autosync-galleries/webp/';
  if (!imgBase.endsWith('/')) imgBase = `${imgBase}/`;
  return { galleries, imgBase };
}

function mergeCatalog(apiGalleries: AutoSyncGallery[], imgBase: string): GalleryRecord[] {
  const claimed = new Set<string>();
  const fromApi: GalleryRecord[] = [];

  for (const gallery of apiGalleries) {
    const vehicle = gallery.Vehicle || {};
    const year = vehicle.Year ? String(vehicle.Year) : '';
    const pns = galleryPns(gallery);
    const matched = year ? pickUniqueStatic(year, pns, claimed) : null;
    if (matched?.galleryId) claimed.add(matched.galleryId);
    // Ambiguous PN matches stay on their static URLs; skip a duplicate AutoSync slug.
    if (!matched && year && pns.size > 0) {
      const unused = staticUnused(year, claimed);
      const ambiguous = unused.filter((item) => pnHit(item, pns).either).length > 1;
      if (ambiguous) continue;
    }
    const mapped = mapAutoSyncGallery(gallery, imgBase, matched);
    if (mapped?.galleryId) fromApi.push(mapped);
  }

  const unmatchedStatic = corvetteGalleryData
    .filter((item) => item.galleryId && !claimed.has(item.galleryId))
    .map(cloneStatic);

  return [...fromApi, ...unmatchedStatic];
}

function staticCatalog(): GalleryRecord[] {
  return corvetteGalleryData.filter((item) => item.galleryId).map(cloneStatic);
}

export async function loadGalleryCatalog(): Promise<GalleryRecord[]> {
  if (catalogCache && Date.now() - catalogCache.at < GALLERY_CACHE_MS) {
    return catalogCache.items;
  }
  try {
    const { galleries, imgBase } = await fetchAutoSyncGalleries();
    const items = mergeCatalog(galleries, imgBase);
    catalogCache = { at: Date.now(), items };
    return items;
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'unknown';
    logGalleryFailure('autosync-galleries', detail);
    return staticCatalog();
  }
}

function parseOverlay(raw: unknown): OverlayItem[] | null {
  if (!raw || typeof raw !== 'object') return null;
  const items = (raw as OverlayDoc).items;
  if (!Array.isArray(items)) return null;
  const seen = new Set<string>();
  const parsed: OverlayItem[] = [];
  for (const row of items) {
    if (!row || typeof row !== 'object') continue;
    const id = String((row as OverlayItem).id || '');
    if (!ID_RE.test(id) || seen.has(id)) continue;
    seen.add(id);
    parsed.push({ id, hidden: Boolean((row as OverlayItem).hidden) });
  }
  return parsed;
}

async function loadOverlay(): Promise<OverlayItem[] | null> {
  const redis = portalRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get<unknown>(GALLERIES_REDIS_KEY);
    const parsed = parseOverlay(raw);
    if (parsed) return parsed;
    return null;
  } catch {
    return null;
  }
}

function applyOverlay(catalog: GalleryRecord[], overlay: OverlayItem[] | null): Array<GalleryRecord & { hidden: boolean }> {
  const byId = new Map(catalog.filter((item) => item.galleryId).map((item) => [item.galleryId as string, item]));
  const used = new Set<string>();
  const ordered: Array<GalleryRecord & { hidden: boolean }> = [];

  if (overlay) {
    for (const row of overlay) {
      const item = byId.get(row.id);
      if (!item) continue;
      used.add(row.id);
      ordered.push({ ...item, hidden: row.hidden });
    }
  }

  const rest = overlay
    ? catalog.filter((item) => item.galleryId && !used.has(item.galleryId))
    : sortGalleryItems(catalog);
  for (const item of rest) {
    if (!item.galleryId) continue;
    ordered.push({ ...item, hidden: false });
  }
  return ordered;
}

export function toGalleryListing(item: CorvetteGalleryItem): GalleryListing | null {
  if (!item.galleryId) return null;
  return {
    galleryId: item.galleryId,
    vehicleTitle: item.vehicleTitle,
    year: item.year,
    submodel: item.submodel,
    trim: item.trim,
    image: galleryCoverUrl(item),
    wheelStyle: item.wheelStyle,
    wheelFinish: item.wheelFinish,
    wheelSizeF: item.wheelSizeF,
    wheelSizeRear: item.wheelSizeRear,
    tireModel: item.tireModel,
    partF: item.partF,
    wheelPartR: item.wheelPartR,
    dateAdded: item.dateAdded,
    pinned: item.pinned,
  };
}

function toPortalRow(item: GalleryRecord & { hidden: boolean }): PortalGalleryRow {
  return {
    id: item.galleryId || '',
    title: item.vehicleTitle || item.trim || item.galleryId || 'Gallery',
    year: item.year || '',
    image: galleryCoverUrl(item),
    hidden: item.hidden,
    source: item.catalogSource === 'static' ? 'site' : 'autosync',
  };
}

export async function loadPublicGalleries(): Promise<CorvetteGalleryItem[]> {
  const catalog = await loadGalleryCatalog();
  const overlay = await loadOverlay();
  return applyOverlay(catalog, overlay).filter((item) => !item.hidden);
}

export async function loadGalleryBySlug(slug: string): Promise<CorvetteGalleryItem | null> {
  if (!slug) return null;
  const catalog = await loadGalleryCatalog();
  const overlay = await loadOverlay();
  const ordered = applyOverlay(catalog, overlay);
  const found = ordered.find((item) => item.galleryId === slug);
  if (!found || found.hidden) return null;
  return found;
}

export async function loadPortalGalleries(): Promise<{ items: PortalGalleryRow[]; source: 'redis' | 'catalog' }> {
  const catalog = await loadGalleryCatalog();
  const overlay = await loadOverlay();
  const items = applyOverlay(catalog, overlay).map(toPortalRow).filter((row) => row.id);
  return { items, source: overlay ? 'redis' : 'catalog' };
}

export function validateGalleryOverlay(
  input: unknown,
  catalogIds: Set<string>,
): { items: OverlayItem[]; error: string | null } {
  const list = Array.isArray(input)
    ? input
    : input && typeof input === 'object' && Array.isArray((input as OverlayDoc).items)
      ? (input as OverlayDoc).items
      : null;
  if (!list) return { items: [], error: 'Galleries must be an array.' };
  if (list.length < 1) return { items: [], error: 'Keep at least one gallery.' };
  if (list.length > MAX_ITEMS) return { items: [], error: `At most ${MAX_ITEMS} galleries.` };

  const seen = new Set<string>();
  const items: OverlayItem[] = [];
  for (const row of list) {
    if (!row || typeof row !== 'object') return { items: [], error: 'Each gallery needs an id.' };
    const id = String((row as OverlayItem).id || '');
    if (!ID_RE.test(id)) return { items: [], error: `Invalid gallery id: ${id}` };
    if (!catalogIds.has(id)) return { items: [], error: `Unknown gallery: ${id}` };
    if (seen.has(id)) return { items: [], error: 'Gallery ids must be unique.' };
    seen.add(id);
    items.push({ id, hidden: Boolean((row as OverlayItem).hidden) });
  }
  return { items, error: null };
}

export async function savePortalGalleries(input: unknown): Promise<{ items: PortalGalleryRow[]; error: string | null }> {
  const catalog = await loadGalleryCatalog();
  const catalogIds = new Set(catalog.map((item) => item.galleryId).filter((id): id is string => Boolean(id)));
  const payload = input && typeof input === 'object' && Array.isArray((input as { items?: unknown }).items)
    ? (input as { items: unknown }).items
    : input;
  const { items, error } = validateGalleryOverlay(payload, catalogIds);
  if (error) return { items: [], error };
  const redis = portalRedis();
  if (!redis) return { items: [], error: 'Redis is not configured (KV_REST_API_URL / KV_REST_API_TOKEN).' };
  try {
    await redis.set(GALLERIES_REDIS_KEY, { version: GALLERIES_DOC_VERSION, items } satisfies OverlayDoc);
    catalogCache = null;
    const next = applyOverlay(catalog, items).map(toPortalRow).filter((row) => row.id);
    return { items: next, error: null };
  } catch {
    return { items: [], error: 'Could not save galleries.' };
  }
}
