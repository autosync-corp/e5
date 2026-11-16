import { toSlug } from './wheelUrl';

/**
 * Models that already have a logo-style wordmark under /assets/images/logos
 * (same files the gallery uses: e5-{slug}.webp).
 */
export const MODEL_WORDMARK_SLUGS = [
  'daytona',
  'sebring',
  'sebring-2p',
  'speedway',
  'talladega',
  'laguna',
  'sonoma',
] as const;

const GT_WORDMARK_BY_SLUG: Record<string, string> = {
  gt01: '/assets/images/logos/gt-01-wordmark.png',
  gt02: '/assets/images/logos/gt-02-wordmark.png',
  gt03: '/assets/images/logos/gt-03-wordmark.png',
  gt04: '/assets/images/logos/gt-04-wordmark.png',
};

/**
 * Wordmark image for a catalog model name, or null when the site has no
 * wordmark file and the display font should be used instead.
 */
export function modelWordmarkSrc(model: string | null | undefined): string | null {
  if (!model) return null;
  const slug = toSlug(model);
  if (GT_WORDMARK_BY_SLUG[slug]) {
    return GT_WORDMARK_BY_SLUG[slug];
  }
  if ((MODEL_WORDMARK_SLUGS as readonly string[]).includes(slug)) {
    return `/assets/images/logos/e5-${slug}.webp`;
  }
  return null;
}
