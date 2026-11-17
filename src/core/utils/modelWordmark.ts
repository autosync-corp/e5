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

const FORM_FORGED_SLUGS = ['daytona', 'sebring', 'speedway'];
const E5_FORGED_SLUGS = ['sonoma', 'talladega', 'laguna'];

/**
 * Series family wordmark for a catalog model, or null when the model is not
 * in FORM / 2P / E5 / GT Forged.
 */
export function seriesWordmarkForModel(model: string | null | undefined): { src: string; alt: string } | null {
  if (!model) return null;
  const slug = toSlug(model);
  if (slug === 'sebring-2p' || slug.includes('2p')) {
    return { src: '/assets/images/logos/2p-forged.png', alt: '2P Forged' };
  }
  if (FORM_FORGED_SLUGS.includes(slug)) {
    return { src: '/assets/images/logos/form-forged.png', alt: 'Form Forged' };
  }
  if (/^gt0[1-4]$/.test(slug)) {
    return { src: '/assets/images/logos/gt-forged.png', alt: 'GT Forged' };
  }
  if (E5_FORGED_SLUGS.includes(slug)) {
    return { src: '/assets/images/logos/e5-forged.webp', alt: 'E5 Forged' };
  }
  return null;
}

/** Canvas/ink fit so shop cards share one letter height without altering files. */
export function modelWordmarkFit(model: string | null | undefined): 'sonoma' | 'gt' | 'default' | null {
  const src = modelWordmarkSrc(model);
  if (!src) return null;
  if (src.includes('sonoma')) return 'sonoma';
  if (src.includes('gt-0')) return 'gt';
  return 'default';
}
