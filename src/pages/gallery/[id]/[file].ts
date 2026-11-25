import type { APIRoute } from 'astro';
import { contentTypeForExt, extFromUrl, resolveGalleryPhotoSource } from '@/core/portal/galleryPhotoServe.ts';
import { GALLERY_IMAGE_EXT_RE } from '@/core/portal/gallerySeo.ts';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const slug = String(params.id || '');
  const file = String(params.file || '');
  if (!slug || !file || !GALLERY_IMAGE_EXT_RE.test(file)) {
    return new Response('Not found', { status: 404 });
  }
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
