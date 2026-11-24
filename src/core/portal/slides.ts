import { Redis } from '@upstash/redis';
import {
  INTERACTIVE_GALLERY_ROUTE,
  SHOP_ROUTE,
  WHEELS_GT_03_ROUTE,
} from '@/core/constants/Routes.ts';

export const SLIDES_REDIS_KEY = 'e5:portal:slides';
export const MAX_SLIDES = 12;
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const SLIDES_DOC_VERSION = 1;

const MAX = {
  id: 40,
  stem: 40,
  imageUrl: 500,
  alt: 160,
  kicker: 48,
  title: 80,
  subtitle: 80,
  code: 32,
  body: 240,
  script: 48,
  credits: 220,
  cta: 48,
  href: 300,
  gtm: 80,
} as const;

export const SLIDE_LAYOUTS = ['promo', 'viz', 'laydown', 'film'] as const;
export type SlideLayout = (typeof SLIDE_LAYOUTS)[number];

export type HomepageSlide = {
  id: string;
  layout: SlideLayout;
  hidden: boolean;
  stem: string;
  imageUrl: string;
  alt: string;
  kicker: string;
  title: string;
  subtitle: string;
  code: string;
  body: string;
  script: string;
  credits: string;
  cta: string;
  href: string;
  gtm: string;
  emphasize: boolean;
};

export type SlidesDoc = {
  version: number;
  slides: HomepageSlide[];
};

export type PublicHomepageSlide = Omit<HomepageSlide, 'hidden'>;

function env(name: string): string {
  const fromProcess = process.env[name];
  if (fromProcess) return fromProcess;
  const fromMeta = (import.meta.env as Record<string, string | undefined>)[name];
  return fromMeta || '';
}

export function portalRedis(): Redis | null {
  try {
    const url = env('KV_REST_API_URL');
    const token = env('KV_REST_API_TOKEN');
    if (url && token) return new Redis({ url, token });
  } catch {
    /* Redis unavailable */
  }
  return null;
}

export function blobConfigured(): boolean {
  return Boolean(env('BLOB_READ_WRITE_TOKEN'));
}

export function seedHomepageSlides(): HomepageSlide[] {
  return [
    {
      id: 'bf-sale',
      layout: 'promo',
      hidden: false,
      stem: 'bf-sale',
      imageUrl: '',
      alt: 'Blue C8 Corvette Stingray fitted with E5 Sebring Gloss Black wheels',
      kicker: 'LIMITED TIME',
      title: 'BLACK FRIDAY SALE',
      subtitle: '',
      code: '15%OFF@E5',
      body: 'Use this code at checkout for 15% off complete E5 wheel sets.',
      script: '',
      credits: '',
      cta: 'SHOP WHEELS',
      href: SHOP_ROUTE,
      gtm: 'Black Friday Shop Wheels',
      emphasize: false,
    },
    {
      id: 'viz-gallery',
      layout: 'viz',
      hidden: false,
      stem: 'viz-01',
      imageUrl: '',
      alt: 'C8 Stingray Torch Red with Daytona Gloss Black wheels in the E5 Immersive Gallery',
      kicker: 'NOW LIVE',
      title: 'E5 IMMERSIVE GALLERY',
      subtitle: '',
      code: '',
      body: 'See E5 wheels on your Corvette — the new Immersive Gallery is live.',
      script: '',
      credits: '',
      cta: 'OPEN GALLERY',
      href: INTERACTIVE_GALLERY_ROUTE,
      gtm: 'Open Immersive Gallery',
      emphasize: false,
    },
    {
      id: 'gt03-stock',
      layout: 'laydown',
      hidden: false,
      stem: 'gt03-black',
      imageUrl: '',
      alt: 'Black C8 Corvette Z06 fitted with in-stock E5 GT.03 wheels',
      kicker: 'GT FORGED',
      title: 'GT.03',
      subtitle: '',
      code: '',
      body: 'IN-STOCK & READY-2-SHIP',
      script: '',
      credits: '',
      cta: 'EXPLORE GT.03',
      href: WHEELS_GT_03_ROUTE,
      gtm: 'Explore GT.03',
      emphasize: true,
    },
    {
      id: 'film-poster',
      layout: 'film',
      hidden: false,
      stem: 'film-poster',
      imageUrl: '',
      alt: 'Black C7 Corvette Grand Sport fitted with E5 Daytona Bronze Brushed Tint wheels, poster-print treatment',
      kicker: 'NOW SHOWING',
      title: 'FORGED',
      subtitle: 'ON BLACKTOP',
      code: '',
      body: 'The wheels. The road. The',
      script: 'machine.',
      credits: 'E5 WHEELS presents  ·  a Corvette motion picture  ·  starring forged aluminum',
      cta: 'WATCH THE FILM',
      href: '',
      gtm: 'Watch the Film',
      emphasize: false,
    },
  ];
}

export const DEFAULT_HOMEPAGE_SLIDES = seedHomepageSlides();

function isLayout(value: unknown): value is SlideLayout {
  return SLIDE_LAYOUTS.includes(value as SlideLayout);
}

function clip(value: unknown, max: number): string {
  return String(value ?? '')
    .replace(/\0/g, '')
    .trim()
    .slice(0, max);
}

const ID_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const STEM_RE = /^(?:bf-sale|viz-0[1-4]|gt03-black|film-poster)?$/;
const BLOB_HOST_RE = /^https:\/\/[a-z0-9.-]+\.(?:public\.)?blob\.vercel-storage\.com\//i;
const SITE_HREF_RE = /^(?:\/(?!\/)[\w\-./?#%&=+]{0,298}|https:\/\/(?:www\.)?e5wheels\.com(?:\/[\w\-./?#%&=+]*)?)$/i;

export function isAllowedSlideHref(href: string): boolean {
  if (!href) return true;
  if (/[\s<>]/.test(href)) return false;
  if (/^(javascript|data|vbscript):/i.test(href)) return false;
  return SITE_HREF_RE.test(href);
}

export function isAllowedImageUrl(url: string): boolean {
  if (!url) return true;
  if (BLOB_HOST_RE.test(url)) return true;
  if (/^\/assets\/images\/banner\/[\w.-]+$/.test(url)) return true;
  return false;
}

function normalizeSlide(raw: unknown, index: number): HomepageSlide {
  const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const fallback = DEFAULT_HOMEPAGE_SLIDES[index] || DEFAULT_HOMEPAGE_SLIDES[0];
  const id = clip(row.id, MAX.id).toLowerCase() || `slide-${index + 1}`;
  const layout = isLayout(row.layout) ? row.layout : fallback.layout;
  return {
    id,
    layout,
    hidden: Boolean(row.hidden),
    stem: clip(row.stem, MAX.stem),
    imageUrl: clip(row.imageUrl, MAX.imageUrl),
    alt: clip(row.alt, MAX.alt),
    kicker: clip(row.kicker, MAX.kicker),
    title: clip(row.title, MAX.title),
    subtitle: clip(row.subtitle, MAX.subtitle),
    code: clip(row.code, MAX.code),
    body: clip(row.body, MAX.body),
    script: clip(row.script, MAX.script),
    credits: clip(row.credits, MAX.credits),
    cta: clip(row.cta, MAX.cta),
    href: layout === 'film' ? '' : clip(row.href, MAX.href),
    gtm: clip(row.gtm, MAX.gtm) || clip(row.title, MAX.gtm),
    emphasize: Boolean(row.emphasize),
  };
}

export function validateHomepageSlides(input: unknown): { slides: HomepageSlide[]; error: string | null } {
  const list = Array.isArray(input)
    ? input
    : input && typeof input === 'object' && Array.isArray((input as SlidesDoc).slides)
      ? (input as SlidesDoc).slides
      : null;
  if (!list) return { slides: [], error: 'Slides must be an array.' };
  if (list.length < 1) return { slides: [], error: 'Keep at least one slide.' };
  if (list.length > MAX_SLIDES) return { slides: [], error: `At most ${MAX_SLIDES} slides.` };

  const slides = list.map((row, index) => normalizeSlide(row, index));
  const ids = new Set<string>();
  let filmCount = 0;

  for (const slide of slides) {
    if (!ID_RE.test(slide.id)) return { slides: [], error: `Invalid slide id: ${slide.id}` };
    if (ids.has(slide.id)) return { slides: [], error: 'Slide ids must be unique.' };
    ids.add(slide.id);
    if (!STEM_RE.test(slide.stem)) return { slides: [], error: `Unknown image stem on ${slide.id}.` };
    if (!isAllowedImageUrl(slide.imageUrl)) {
      return { slides: [], error: `Image URL is not allowed on ${slide.id}.` };
    }
    if (!slide.stem && !slide.imageUrl && !slide.hidden) {
      return { slides: [], error: `Slide ${slide.id} needs an image.` };
    }
    if (!slide.title) return { slides: [], error: 'Each slide needs a headline.' };
    if (!slide.cta) return { slides: [], error: 'Each slide needs a button label.' };
    if (slide.layout !== 'film' && !isAllowedSlideHref(slide.href)) {
      return { slides: [], error: `Button link is not allowed on ${slide.id}.` };
    }
    if (slide.layout === 'film') {
      filmCount += 1;
      if (filmCount > 1) return { slides: [], error: 'Only one film-poster slide is allowed.' };
    }
  }

  return { slides, error: null };
}

function parseSlidesDoc(raw: unknown): HomepageSlide[] | null {
  if (!raw) return null;
  const { slides, error } = validateHomepageSlides(raw);
  if (error || !slides.length) return null;
  return slides;
}

export function visibleHomepageSlides(slides: HomepageSlide[]): HomepageSlide[] {
  return slides.filter((slide) => !slide.hidden);
}

export function toPublicSlide(slide: HomepageSlide): PublicHomepageSlide {
  const { hidden: _hidden, ...rest } = slide;
  return rest;
}

export function slidesFingerprint(slides: HomepageSlide[]): string {
  const json = JSON.stringify(visibleHomepageSlides(slides).map(toPublicSlide));
  let hash = 5381;
  for (let i = 0; i < json.length; i += 1) {
    hash = ((hash << 5) + hash) ^ json.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

export async function loadHomepageSlides(): Promise<{ slides: HomepageSlide[]; source: 'redis' | 'seed' }> {
  const seed = seedHomepageSlides();
  const redis = portalRedis();
  if (!redis) return { slides: seed, source: 'seed' };
  try {
    const raw = await redis.get<unknown>(SLIDES_REDIS_KEY);
    const parsed = parseSlidesDoc(raw);
    if (parsed) return { slides: parsed, source: 'redis' };
    await redis.set(SLIDES_REDIS_KEY, { version: SLIDES_DOC_VERSION, slides: seed } satisfies SlidesDoc, {
      nx: true,
    });
    const again = parseSlidesDoc(await redis.get<unknown>(SLIDES_REDIS_KEY));
    return { slides: again || seed, source: again ? 'redis' : 'seed' };
  } catch {
    return { slides: seed, source: 'seed' };
  }
}

export async function saveHomepageSlides(input: unknown): Promise<{ slides: HomepageSlide[]; error: string | null }> {
  const { slides, error } = validateHomepageSlides(input);
  if (error) return { slides: [], error };
  const redis = portalRedis();
  if (!redis) return { slides: [], error: 'Redis is not configured (KV_REST_API_URL / KV_REST_API_TOKEN).' };
  try {
    await redis.set(SLIDES_REDIS_KEY, { version: SLIDES_DOC_VERSION, slides } satisfies SlidesDoc);
    return { slides, error: null };
  } catch {
    return { slides: [], error: 'Could not save slides.' };
  }
}

export function newPromoSlide(index: number): HomepageSlide {
  return {
    id: `slide-${Date.now().toString(36)}-${index}`,
    layout: 'promo',
    hidden: false,
    stem: '',
    imageUrl: '',
    alt: '',
    kicker: '',
    title: 'NEW SLIDE',
    subtitle: '',
    code: '',
    body: '',
    script: '',
    credits: '',
    cta: 'LEARN MORE',
    href: SHOP_ROUTE,
    gtm: 'New homepage slide',
    emphasize: false,
  };
}

export function previewSrc(slide: HomepageSlide): string {
  if (slide.imageUrl) return slide.imageUrl;
  if (slide.stem) return `/assets/images/banner/${slide.stem}-800.webp`;
  return '';
}
