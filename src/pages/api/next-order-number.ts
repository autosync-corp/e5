import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';

export const prerender = false;

const redis = new Redis({
  url: import.meta.env.KV_REST_API_URL,
  token: import.meta.env.KV_REST_API_TOKEN,
});

const ORDER_COUNTER_KEY = 'e5:order-counter';

export const POST: APIRoute = async () => {
  try {
    const orderNumber = await redis.incr(ORDER_COUNTER_KEY);

    return new Response(JSON.stringify({ orderNumber: orderNumber.toString() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    // Fallback if Redis is unavailable
    return new Response(JSON.stringify({ orderNumber: Date.now().toString().slice(-6) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
