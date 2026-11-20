import { corvetteGalleryData } from '../../pages/gallery/constants/CorvetteGalleryData.ts';
import { SITE_URL } from './Site.ts';

const SITE = SITE_URL;

/** Known content dates for URLs this change actually updates. Dates are YYYY-MM-DD. */
const PAGE_LASTMOD: Record<string, string> = {
  [`${SITE}`]: '2026-11-11',
  [`${SITE}/`]: '2026-11-11',
  [`${SITE}/gallery/vehicles`]: '2026-11-11',
  [`${SITE}/wheels/gt-01`]: '2026-11-16',
  [`${SITE}/wheels/gt-02`]: '2026-11-16',
  [`${SITE}/wheels/gt-03`]: '2026-11-16',
  [`${SITE}/wheels/gt-04`]: '2026-11-16',
  [`${SITE}/e5-visualizer`]: '2026-11-20',
  [`${SITE}/shop`]: '2026-11-20',
  [`${SITE}/wheels/sebring-2p`]: '2026-11-20',
  [`${SITE}/generations/c8/c8-e-ray`]: '2026-11-20',
  [`${SITE}/generations`]: '2026-11-17',
  [`${SITE}/generations/c5`]: '2026-11-17',
  [`${SITE}/generations/c5/c5-base`]: '2026-11-17',
  [`${SITE}/generations/c6`]: '2026-11-17',
  [`${SITE}/generations/c6/c6-z06`]: '2026-11-17',
  [`${SITE}/generations/c6/c6-zr1`]: '2026-11-17',
  [`${SITE}/generations/c7`]: '2026-11-17',
  [`${SITE}/generations/c7/c7-zr1`]: '2026-11-17',
  [`${SITE}/generations/c8`]: '2026-11-17',
  [`${SITE}/generations/c8/c8-zr1`]: '2026-11-17',
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

  // Shop finish pages gained server-rendered H1/intro on 2026-11-20.
  if (/^https:\/\/www\.e5wheels\.com\/shop\/[^/]+\/[^/]+$/.test(normalized)) {
    return toIsoDate('2026-11-20');
  }

  const galleryMatch = normalized.match(/\/gallery\/([^/]+)$/);
  const galleryId = galleryMatch?.[1];
  if (galleryId && galleryId !== 'vehicles' && galleryId !== 'wheels') {
    const item = corvetteGalleryData.find((entry) => entry.galleryId === galleryId);
    if (item?.dateAdded) return toIsoDate(item.dateAdded);
  }

  return undefined;
}
