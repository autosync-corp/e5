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

const TRACKING_KEY = 'e5:tracking';

export const GET: APIRoute = async ({ request }) => {
  const adminPassword = import.meta.env.ADMIN_PASSWORD || 'e5admin2024';
  const password = request.headers.get('x-admin-password');

  if (password !== adminPassword) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    if (!redis) return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const raw = await redis.get(TRACKING_KEY);
    const settings = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};
    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const adminPassword = import.meta.env.ADMIN_PASSWORD || 'e5admin2024';
  const password = request.headers.get('x-admin-password');

  if (password !== adminPassword) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const settings = await request.json();
    if (!redis) return new Response(JSON.stringify({ error: 'Redis unavailable' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
    await redis.set(TRACKING_KEY, JSON.stringify(settings));
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to save settings' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
