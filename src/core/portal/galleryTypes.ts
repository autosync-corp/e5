export const GALLERY_STORE_VERSION = 1;
export const GALLERY_INDEX_KEY = 'e5:galleries:index';
export const GALLERY_SYNC_KEY = 'e5:galleries:sync';
export const GALLERY_MEDIA_PREFIX = 'gallery-media';
export const GALLERY_PUBLIC_PREFIX = '/gallery';
export const MAX_GALLERY_TITLE = 160;
export const MAX_GALLERY_DESCRIPTION = 800;
export const MAX_GALLERY_ALT = 180;
export const MAX_GALLERY_PHOTOS = 40;
export const MAX_GALLERY_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_GALLERY_SLUG = 120;
export const SYNC_BATCH = 3;

export function galleryItemKey(slug: string): string {
  return `e5:galleries:item:${slug}`;
}

export type GalleryOrigin = 'portal' | 'autosync' | 'static';

export type GalleryWheelPick = {
  style: string;
  size: string;
  finish: string;
  pn: string;
};

export type StoredGalleryPhoto = {
  id: string;
  blobPath: string;
  blobUrl: string;
  publicPath: string;
  alt: string;
  sourcePath?: string;
};

export type GalleryClientEdited = {
  title?: boolean;
  description?: boolean;
  photos?: boolean;
  wheels?: boolean;
  vehicle?: boolean;
  youtube?: boolean;
  slug?: boolean;
  alts?: Record<string, boolean>;
};

export type StoredGallery = {
  version: number;
  slug: string;
  autosyncId: number | null;
  origin: GalleryOrigin;
  deleted: boolean;
  year: string;
  generation: string;
  trim: string;
  body: string;
  vehicleColor: string;
  title: string;
  description: string;
  front: GalleryWheelPick;
  rear: GalleryWheelPick;
  square: boolean;
  youtubeId: string;
  photos: StoredGalleryPhoto[];
  coverId: string;
  dateAdded: string;
  updatedAt: string;
  autosyncUpdatedAt: string;
  autosyncImgUpdatedAt: string;
  previousSlugs: string[];
  clientEdited: GalleryClientEdited;
};

export type GalleryIndex = {
  version: number;
  slugs: string[];
};

export type GallerySyncState = {
  version: number;
  status: 'idle' | 'running' | 'complete' | 'error';
  mode: 'backfill' | 'incremental';
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  cursor: number;
  lastError: string;
  lastRunAt: string;
  lastFullAt: string;
  lastIncrementalAt: string;
  updatedAfter: string;
};

export type PortalGalleryEditor = StoredGallery & {
  suggestions: { title: string; description: string };
};

export function emptyWheel(): GalleryWheelPick {
  return { style: '', size: '', finish: '', pn: '' };
}

export function emptyGallery(slug = ''): StoredGallery {
  const now = new Date().toISOString();
  return {
    version: GALLERY_STORE_VERSION,
    slug,
    autosyncId: null,
    origin: 'portal',
    deleted: false,
    year: '',
    generation: '',
    trim: '',
    body: '',
    vehicleColor: '',
    title: '',
    description: '',
    front: emptyWheel(),
    rear: emptyWheel(),
    square: false,
    youtubeId: '',
    photos: [],
    coverId: '',
    dateAdded: now.slice(0, 10),
    updatedAt: now,
    autosyncUpdatedAt: '',
    autosyncImgUpdatedAt: '',
    previousSlugs: [],
    clientEdited: {},
  };
}
