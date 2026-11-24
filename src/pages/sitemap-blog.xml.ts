import type { APIRoute } from 'astro';
import { SITE_URL } from '@/core/constants/Site.ts';
import { loadPublicPosts } from '@/core/portal/posts.ts';

export const prerender = false;

function loc(url: string): string {
  return url.replace(/&/g, '&amp;');
}

export const GET: APIRoute = async () => {
  const posts = await loadPublicPosts();
  const urls = [`${SITE_URL}/blog`, ...posts.map((post) => `${SITE_URL}/blog/${post.slug}`)];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${loc(url)}</loc>
  </url>`,
  )
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
