import type { APIRoute } from 'astro';
import {
  loadHomepageSlides,
  slidesFingerprint,
  toPublicSlide,
  visibleHomepageSlides,
} from '@/core/portal/slides.ts';

export const prerender = false;

const CACHE = 'public, s-maxage=60, stale-while-revalidate=600';

export const GET: APIRoute = async () => {
  const { slides, source } = await loadHomepageSlides();
  const visible = visibleHomepageSlides(slides).map(toPublicSlide);
  return new Response(
    JSON.stringify({
      slides: visible,
      fingerprint: slidesFingerprint(slides),
      source,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': CACHE,
      },
    },
  );
};
