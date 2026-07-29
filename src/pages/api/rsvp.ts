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

const RSVP_KEY = 'e5:rsvp';

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    if (!data.firstName || !data.lastName || !data.email) {
      return new Response(JSON.stringify({ error: 'First name, last name, and email are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const entry = {
      ...data,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID(),
    };

    if (redis) {
      await redis.lpush(RSVP_KEY, JSON.stringify(entry));
    }

    const webhookUrl = import.meta.env.GHL_RSVP_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
        });
      } catch { /* webhook failure should not block success response */ }
    }

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
