import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

export const prerender = false;

let redis: Redis | null = null;
try {
  if (import.meta.env.KV_REST_API_URL && import.meta.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: import.meta.env.KV_REST_API_URL,
      token: import.meta.env.KV_REST_API_TOKEN,
    });
  }
} catch { /* Redis unavailable */ }

const EVENTS_KEY = 'e5:events';

function checkAuth(request: Request): boolean {
  const adminPassword = import.meta.env.ADMIN_PASSWORD || 'e5admin2024';
  return request.headers.get('x-admin-password') === adminPassword;
}

export const GET: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (!redis) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const all = await redis.hgetall(EVENTS_KEY);
    const events = all ? Object.values(all).map(e => (typeof e === 'string' ? JSON.parse(e) : e)) : [];
    return new Response(JSON.stringify(events), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const data = await request.json();

    if (!data.slug || !data.title) {
      return new Response(JSON.stringify({ error: 'Slug and title are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!redis) {
      return new Response(JSON.stringify({ error: 'Storage unavailable.' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only one event may be active at a time
    if (data.active) {
      const all = await redis.hgetall(EVENTS_KEY);
      if (all) {
        for (const [slug, raw] of Object.entries(all)) {
          if (slug === data.slug) continue;
          const event = typeof raw === 'string' ? JSON.parse(raw) : raw;
          if (event.active) {
            event.active = false;
            await redis.hset(EVENTS_KEY, { [slug]: JSON.stringify(event) });
          }
        }
      }
    }

    const entry = {
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await redis.hset(EVENTS_KEY, { [data.slug]: JSON.stringify(entry) });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  if (!checkAuth(request)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Slug is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (redis) await redis.hdel(EVENTS_KEY, slug);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
