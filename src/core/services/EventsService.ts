import { Redis } from '@upstash/redis';

const EVENTS_KEY = 'e5:events';

function getRedis(): Redis | null {
  try {
    if (import.meta.env.KV_REST_API_URL && import.meta.env.KV_REST_API_TOKEN) {
      return new Redis({
        url: import.meta.env.KV_REST_API_URL,
        token: import.meta.env.KV_REST_API_TOKEN,
      });
    }
  } catch { /* Redis unavailable */ }
  return null;
}

export async function getAllEvents(): Promise<any[]> {
  const redis = getRedis();
  if (!redis) return [];
  try {
    const all = await redis.hgetall(EVENTS_KEY);
    if (!all) return [];
    return Object.values(all).map(e => (typeof e === 'string' ? JSON.parse(e) : e));
  } catch {
    return [];
  }
}

export async function getActiveEvent(): Promise<any | null> {
  const events = await getAllEvents();
  return events.find(e => e.active) || null;
}

export async function getEventBySlug(slug: string): Promise<any | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.hget(EVENTS_KEY, slug);
    if (!raw) return null;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}
