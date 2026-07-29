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

function rsvpKeyFor(eventSlug: string): string {
  return `e5:rsvp:${eventSlug}`;
}

export const GET: APIRoute = async ({ request, url }) => {
  const adminPassword = import.meta.env.ADMIN_PASSWORD || 'e5admin2024';
  const password = request.headers.get('x-admin-password');

  if (password !== adminPassword) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response(JSON.stringify({ error: 'Event slug is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (!redis) return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const raw = await redis.lrange(rsvpKeyFor(slug), 0, -1);
    const attendees = (raw || []).map(a => (typeof a === 'string' ? JSON.parse(a) : a));
    return new Response(JSON.stringify(attendees), {
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
