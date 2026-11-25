import type { APIRoute } from 'astro';
import { jsonError, jsonOk, requirePortalSession, requireSameOrigin } from '@/core/portal/api-guard.ts';
import { loadPortalGalleries, savePortalGalleries } from '@/core/portal/galleries.ts';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const { items, source } = await loadPortalGalleries();
  return jsonOk({ items, source });
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
  const payload = body && typeof body === 'object' && 'items' in (body as object) ? (body as { items: unknown }).items : body;
  const saved = await savePortalGalleries(payload);
  if (saved.error) {
    const status = saved.error.includes('not configured') ? 503 : 400;
    return jsonError(status, saved.error);
  }
  return jsonOk({ items: saved.items, source: 'redis' });
};
