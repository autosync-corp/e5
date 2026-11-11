import type { CorvetteGalleryItem } from '@/pages/gallery/constants/CorvetteGalleryData.ts';

const GENERATION_ORDER: Record<string, number> = { C8: 1, C7: 2, C6: 3, C5: 4 };

/** Pinned first, then dateAdded desc, then generation (C8→C5), then year desc. */
export function sortGalleryItems(items: CorvetteGalleryItem[]): CorvetteGalleryItem[] {
  return [...items].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;

    if (a.dateAdded && !b.dateAdded) return -1;
    if (!a.dateAdded && b.dateAdded) return 1;
    if (a.dateAdded && b.dateAdded) {
      return b.dateAdded.localeCompare(a.dateAdded);
    }

    const genA = GENERATION_ORDER[a.submodel || ''] || 999;
    const genB = GENERATION_ORDER[b.submodel || ''] || 999;
    if (genA !== genB) return genA - genB;

    const yearA = parseInt(a.year || '0', 10);
    const yearB = parseInt(b.year || '0', 10);
    return yearB - yearA;
  });
}
