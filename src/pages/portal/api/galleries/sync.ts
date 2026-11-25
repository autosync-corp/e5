import type { APIRoute } from 'astro';
import { jsonError, jsonOk, requirePortalSession, requireSameOrigin } from '@/core/portal/api-guard.ts';
import { runGallerySync } from '@/core/portal/gallerySync.ts';
import { loadSyncState } from '@/core/portal/galleryStore.ts';
import { bustGalleryCatalogCache } from '@/core/portal/galleries.ts';

export const prerender = false;
export const maxDuration = 300;

export const GET: APIRoute = async ({ cookies }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  return jsonOk({ sync: await loadSyncState() });
};

export const POST: APIRoute = async ({ cookies, request }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const originError = requireSameOrigin(request);
  if (originError) return originError;
  let body: { incremental?: boolean; maxGalleries?: number } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }
  try {
    const result = await runGallerySync({
      incremental: Boolean(body.incremental),
      maxGalleries: Number(body.maxGalleries) || 2,
    });
    bustGalleryCatalogCache();
    return jsonOk({ ...result, sync: await loadSyncState() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed.';
    return jsonError(/not configured/i.test(message) ? 503 : 500, message);
  }
};
