import type { APIRoute } from 'astro';
import { jsonError, jsonOk, requirePortalSession, requireSameOrigin } from '@/core/portal/api-guard.ts';
import { blobConfigured, loadHomepageSlides, saveHomepageSlides } from '@/core/portal/slides.ts';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const { slides, source } = await loadHomepageSlides();
  return jsonOk({ slides, source, blobReady: blobConfigured() });
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
  const payload = body && typeof body === 'object' ? (body as { slides?: unknown }).slides : body;
  const saved = await saveHomepageSlides(payload);
  if (saved.error) {
    const status = saved.error.includes('not configured') ? 503 : 400;
    return jsonError(status, saved.error);
  }
  return jsonOk({ slides: saved.slides, source: 'redis', blobReady: blobConfigured() });
};
