import type { APIRoute } from 'astro';
import { jsonError, jsonOk, requirePortalSession } from '@/core/portal/api-guard.ts';
import { blobConfigured } from '@/core/portal/slides.ts';
import { loadPortalPosts, redisConfigured } from '@/core/portal/posts.ts';

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const auth = requirePortalSession(cookies);
  if (auth instanceof Response) return auth;
  const posts = await loadPortalPosts();
  return jsonOk({
    posts: posts.map((post) => ({
      slug: post.slug,
      title: post.titleText,
      excerpt: post.excerpt,
      date: post.date,
      published: post.published,
      coverUrl: post.coverUrl,
      source: post.source,
      slugLocked: post.slugLocked,
    })),
    blobReady: blobConfigured(),
    saveReady: redisConfigured(),
  });
};

export const POST: APIRoute = async () => jsonError(405, 'Use PUT on a post address.');
