import { corvetteGalleryData } from '../../pages/gallery/constants/CorvetteGalleryData.ts';
import { SITE_URL } from './Site.ts';

const SITE = SITE_URL;

/** Known content dates for URLs this change actually updates. Dates are YYYY-MM-DD. */
const PAGE_LASTMOD: Record<string, string> = {
  [`${SITE}`]: '2026-11-11',
  [`${SITE}/`]: '2026-11-11',
  [`${SITE}/gallery/vehicles`]: '2026-11-11',
};

function toIsoDate(date: string): string {
  if (date.includes('T')) return date;
  return `${date}T00:00:00.000Z`;
}

function normalizeUrl(url: string): string {
  if (url.endsWith('/') && url !== `${SITE}/`) {
    return url.slice(0, -1);
  }
  return url;
}

/**
 * Per-page lastmod for the sitemap. Gallery entries use `dateAdded` when present.
 * Pages without a real content date return undefined so we do not stamp every URL
 * with the build time.
 */
export function getSitemapLastmod(url: string): string | undefined {
  const normalized = normalizeUrl(url);

  const pageDate = PAGE_LASTMOD[normalized] || PAGE_LASTMOD[url];
  if (pageDate) return toIsoDate(pageDate);

  const galleryMatch = normalized.match(/\/gallery\/([^/]+)$/);
  const galleryId = galleryMatch?.[1];
  if (galleryId && galleryId !== 'vehicles' && galleryId !== 'wheels') {
    const item = corvetteGalleryData.find((entry) => entry.galleryId === galleryId);
    if (item?.dateAdded) return toIsoDate(item.dateAdded);
  }

  return undefined;
}
