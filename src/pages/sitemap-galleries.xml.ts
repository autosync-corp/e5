import type { APIRoute } from 'astro';
import { SITE_URL } from '@/core/constants/Site.ts';
import { loadPublicGalleries } from '@/core/portal/galleries.ts';

export const prerender = false;

function loc(url: string): string {
  return url.replace(/&/g, '&amp;');
}

export const GET: APIRoute = async () => {
  const galleries = await loadPublicGalleries();
  const urls = [
    { loc: `${SITE_URL}/gallery/vehicles`, lastmod: undefined as string | undefined },
    ...galleries
      .filter((item) => item.galleryId)
      .map((item) => ({
        loc: `${SITE_URL}/gallery/${item.galleryId}`,
        lastmod: item.dateAdded,
      })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((entry) => {
    const lastmod = entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : '';
    return `  <url>
    <loc>${loc(entry.loc)}</loc>${lastmod}
  </url>`;
  })
  .join('\n')}
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
