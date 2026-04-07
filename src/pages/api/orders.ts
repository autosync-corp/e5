import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

export const prerender = false;

const redis = new Redis({
  url: import.meta.env.KV_REST_API_URL,
  token: import.meta.env.KV_REST_API_TOKEN,
});

const ORDERS_KEY = 'e5:orders';

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
    const raw = await redis.lrange(ORDERS_KEY, 0, -1);
    const orders = (raw || []).map(o => (typeof o === 'string' ? JSON.parse(o) : o));
    return new Response(JSON.stringify(orders), {
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
