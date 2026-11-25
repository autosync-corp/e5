import type { APIRoute } from 'astro';
import { SITE_URL } from '@/core/constants/Site.ts';
import { loadPublicGalleries } from '@/core/portal/galleries.ts';
import { galleryMediaItems } from '@/pages/gallery/utils/galleryMedia.ts';
import { absoluteUrl } from '@/pages/gallery/utils/galleryMedia.ts';

export const prerender = false;

function xml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export const GET: APIRoute = async () => {
  const galleries = await loadPublicGalleries();
  const urls = galleries
    .filter((item) => item.galleryId)
    .map((item) => {
      const images = galleryMediaItems(item).filter((entry) => entry.type === 'image' && entry.url);
      if (images.length === 0) return '';
      const loc = `${SITE_URL}/gallery/${item.galleryId}`;
      const imageTags = images
        .map((entry) => {
          const imageLoc = absoluteUrl(entry.url || '', SITE_URL);
          const title = xml(entry.alt || item.vehicleTitle || item.galleryId || 'E5 Wheels gallery photo');
          return `    <image:image>
      <image:loc>${xml(imageLoc)}</image:loc>
      <image:title>${title}</image:title>
    </image:image>`;
        })
        .join('\n');
      return `  <url>
    <loc>${xml(loc)}</loc>
${imageTags}
  </url>`;
    })
    .filter(Boolean)
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=600',
    },
  });
};
