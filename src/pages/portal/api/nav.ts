import type { APIRoute } from 'astro';
import { jsonError, jsonOk, requirePortalSession, requireSameOrigin } from '@/core/portal/api-guard.ts';
import { loadSiteNav, saveSiteNav } from '@/core/portal/nav.ts';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const { nav, source } = await loadSiteNav();
  return jsonOk({ nav, source });
};

export const PUT: APIRoute = async ({ cookies, request }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'Invalid JSON');
  }
  const payload = body && typeof body === 'object' && 'nav' in (body as object) ? (body as { nav: unknown }).nav : body;
  const saved = await saveSiteNav(payload);
  if (saved.error) {
    const status = saved.error.includes('not available') ? 503 : 400;
    return jsonError(status, saved.error);
  }
  return jsonOk({ nav: saved.nav, source: 'redis' });
};
