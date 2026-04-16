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

const ORDERS_KEY = 'e5:orders';

export const POST: APIRoute = async ({ request }) => {
  try {
    const order = await request.json();
    if (!redis) return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    await redis.lpush(ORDERS_KEY, JSON.stringify(order));
    await redis.ltrim(ORDERS_KEY, 0, 499); // Keep last 500 orders

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Failed to save order' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
