import type { APIRoute } from 'astro';
import { loadStoredGallery } from '@/core/portal/galleryStore.ts';
import { GALLERY_PUBLIC_PREFIX } from '@/core/portal/galleryTypes.ts';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const raw = (Array.isArray(params.path) ? params.path.join('/') : String(params.path || '')).replace(/^\/+|\/+$/g, '');
  const [slug, file] = raw.split('/');
  if (!slug || !file) return new Response('Not found', { status: 404 });
  const photoId = file.replace(/\.[a-z0-9]+$/i, '');
  const item = await loadStoredGallery(slug);
  if (!item || item.deleted) return new Response('Not found', { status: 404 });
  const photo = item.photos.find((entry) => entry.id === photoId || entry.publicPath === `${GALLERY_PUBLIC_PREFIX}/${raw}`);
  if (!photo?.blobUrl) return new Response('Not found', { status: 404 });
  const upstream = await fetch(photo.blobUrl, { signal: AbortSignal.timeout(20000) });
  if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 });
  const type = upstream.headers.get('content-type') || 'image/webp';
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
