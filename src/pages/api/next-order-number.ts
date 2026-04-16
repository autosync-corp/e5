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
} catch {
  // Redis unavailable
}

const ORDER_COUNTER_KEY = 'e5:order-counter';

export const POST: APIRoute = async () => {
  try {
    if (!redis) throw new Error('Redis not available');
    const orderNumber = await redis.incr(ORDER_COUNTER_KEY);

    return new Response(JSON.stringify({ orderNumber: orderNumber.toString() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ orderNumber: Date.now().toString().slice(-6) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
