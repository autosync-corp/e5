import overridesJson from '@/data/gallery-wheel-overrides.json';
import {
  suggestGalleryDescription,
  suggestGalleryTitle,
  suggestPhotoAlt,
} from '@/core/portal/galleryCopy.ts';
import type { StoredGallery } from '@/core/portal/galleryTypes.ts';
import type { CorvetteGalleryItem } from '@/pages/gallery/constants/CorvetteGalleryData.ts';

export type GalleryWheelOverride = {
  autosyncId?: number;
  style: string;
  finish: string;
};

const bySlug = new Map<string, GalleryWheelOverride>();
const byAutosyncId = new Map<number, GalleryWheelOverride>();

for (const [slug, row] of Object.entries(overridesJson as Record<string, GalleryWheelOverride>)) {
  if (!row?.style || !row?.finish) continue;
  bySlug.set(slug, row);
  if (typeof row.autosyncId === 'number') byAutosyncId.set(row.autosyncId, row);
}

export function wheelOverrideFor(input: {
  slug?: string | null;
  autosyncId?: number | null;
}): GalleryWheelOverride | null {
  const autosyncId = Number(input.autosyncId);
  if (Number.isInteger(autosyncId) && autosyncId > 0) {
    const byId = byAutosyncId.get(autosyncId);
    if (byId) return byId;
  }
  const slug = String(input.slug || '').trim();
  if (slug && bySlug.has(slug)) return bySlug.get(slug) || null;
  return null;
}

export function applyWheelOverrideToStored(item: StoredGallery): StoredGallery {
  if (item.clientEdited?.wheels) return item;
  const ov = wheelOverrideFor({ slug: item.slug, autosyncId: item.autosyncId });
  if (!ov) return item;
  const next: StoredGallery = {
    ...item,
    front: { ...item.front, style: ov.style, finish: ov.finish },
    rear: { ...item.rear, style: ov.style, finish: ov.finish },
  };
  if (!item.clientEdited?.title) {
    next.title = suggestGalleryTitle({
      year: next.year,
      vehicleColor: next.vehicleColor,
      generation: next.generation,
      trim: next.trim,
      style: ov.style,
      finish: ov.finish,
    });
  }
  if (!item.clientEdited?.description) {
    next.description = suggestGalleryDescription(next);
  }
  next.photos = next.photos.map((photo, index) => {
    if (item.clientEdited?.alts?.[photo.id]) return photo;
    return { ...photo, alt: suggestPhotoAlt(next, photo, index) };
  });
  return next;
}

export function applyWheelOverrideToRecord<T extends CorvetteGalleryItem & {
  autosyncId?: number;
  catalogSource?: string;
}>(item: T): T {
  if (item.catalogSource === 'store') return item;
  const ov = wheelOverrideFor({ slug: item.galleryId, autosyncId: item.autosyncId });
  if (!ov) return item;
  if (item.wheelStyle === ov.style && item.wheelFinish === ov.finish) return item;
  return {
    ...item,
    wheelStyle: ov.style,
    wheelFinish: ov.finish,
    vehicleTitle: suggestGalleryTitle({
      year: item.year || undefined,
      vehicleColor: item.vehicleColor || undefined,
      generation: item.submodel || undefined,
      trim: item.trim || undefined,
      style: ov.style,
      finish: ov.finish,
    }),
  };
}
