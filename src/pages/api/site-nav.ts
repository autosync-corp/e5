import type { APIRoute } from 'astro';
import { loadSiteNav, navFingerprint, toPublicNav } from '@/core/portal/nav.ts';

export const prerender = false;

const CACHE = 'public, s-maxage=60, stale-while-revalidate=600';

export const GET: APIRoute = async () => {
  const { nav, source } = await loadSiteNav();
  const publicNav = toPublicNav(nav);
  return new Response(
    JSON.stringify({
      header: publicNav.header,
      footer: publicNav.footer,
      fingerprint: navFingerprint(nav),
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
