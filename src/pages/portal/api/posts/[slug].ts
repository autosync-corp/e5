import type { APIRoute } from 'astro';
import { jsonError, jsonOk, requirePortalSession, requireSameOrigin } from '@/core/portal/api-guard.ts';
import { blobConfigured } from '@/core/portal/slides.ts';
import {
  deletePortalPost,
  isValidSlug,
  loadPortalPost,
  redisConfigured,
  savePortalPost,
} from '@/core/portal/posts.ts';

export const prerender = false;

export const GET: APIRoute = async ({ cookies, params }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const slug = params.slug || '';
  const post = await loadPortalPost(slug);
  if (!post) return jsonError(404, 'That post was not found.');
  return jsonOk({ post, blobReady: blobConfigured(), saveReady: redisConfigured() });
};

export const PUT: APIRoute = async ({ cookies, request, params }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const originError = requireSameOrigin(request);
  if (originError) return originError;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'That save could not be read. Try again.');
  }
  const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  const urlSlug = params.slug && params.slug !== 'new' ? params.slug : '';
  const saved = await savePortalPost({
    ...payload,
    previousSlug: typeof payload.previousSlug === 'string' ? payload.previousSlug : urlSlug,
  });
  if (saved.error) {
    const status = saved.error.includes('not available') ? 503 : 400;
    return jsonError(status, saved.error);
  }
  return jsonOk({ post: saved.post, blobReady: blobConfigured(), saveReady: true });
};

export const DELETE: APIRoute = async ({ cookies, request, params }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  const slug = params.slug || '';
  if (!isValidSlug(slug)) return jsonError(400, 'That post was not found.');
  const result = await deletePortalPost(slug);
  if (result.error) {
    const status = result.error.includes('not available') ? 503 : 400;
    return jsonError(status, result.error);
  }
  return jsonOk({ ok: true });
};
