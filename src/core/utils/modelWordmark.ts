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

/**
 * Wordmark image for a catalog model name, or null when the site has no
 * wordmark file (GT.01–GT.04) and the display font should be used instead.
 */
export function modelWordmarkSrc(model: string | null | undefined): string | null {
  if (!model) return null;
  const slug = toSlug(model);
  if ((MODEL_WORDMARK_SLUGS as readonly string[]).includes(slug)) {
    return `/assets/images/logos/e5-${slug}.webp`;
  }
  return null;
}
