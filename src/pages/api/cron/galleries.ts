import type { APIRoute } from 'astro';
import { runGallerySync } from '@/core/portal/gallerySync.ts';
import { bustGalleryCatalogCache } from '@/core/portal/galleries.ts';

export const prerender = false;
export const maxDuration = 300;

function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET || '';
  const header = request.headers.get('authorization') || '';
  if (secret && header === `Bearer ${secret}`) return true;
  return false;
}

export const GET: APIRoute = async ({ request }) => {
  if (!authorized(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
    });
  }
  try {
    const result = await runGallerySync({ incremental: true, maxGalleries: 3 });
    bustGalleryCatalogCache();
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed.';
    const status = /not configured/i.test(message) ? 503 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' },
    });
  }
};
