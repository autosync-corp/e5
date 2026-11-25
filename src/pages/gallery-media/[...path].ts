import type { APIRoute } from 'astro';
import { canonicalGalleryImagePath } from '@/core/portal/gallerySeo.ts';
import { contentTypeForExt, extFromUrl, resolveGalleryPhotoSource } from '@/core/portal/galleryPhotoServe.ts';

export const prerender = false;

export const GET: APIRoute = async ({ params, redirect }) => {
  const raw = (Array.isArray(params.path) ? params.path.join('/') : String(params.path || '')).replace(/^\/+|\/+$/g, '');
  const from = `/gallery-media/${raw}`;
  const dest = canonicalGalleryImagePath(from);
  if (dest && dest !== from) return redirect(dest, 301);
  const [slug, file] = raw.split('/');
  if (!slug || !file) return new Response('Not found', { status: 404 });
  const source = await resolveGalleryPhotoSource(slug, file);
  if (!source?.url) return new Response('Not found', { status: 404 });
  const upstream = await fetch(source.url, { signal: AbortSignal.timeout(20000) });
  if (!upstream.ok || !upstream.body) return new Response('Not found', { status: 404 });
  const type = upstream.headers.get('content-type') || contentTypeForExt(extFromUrl(file));
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
