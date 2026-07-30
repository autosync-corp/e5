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

const COUPONS_KEY = 'e5:coupons';
const ADMIN_PASSWORD = import.meta.env.ADMIN_PASSWORD;

export interface StoredCoupon {
  code: string;
  type: 'percentage' | 'fixed';
  discount: number;
  expires: string;
  active: boolean;
  createdAt: string;
}

async function getCoupons(): Promise<StoredCoupon[]> {
  if (!redis) return [];
  const data = await redis.get<StoredCoupon[]>(COUPONS_KEY);
  return data || [];
}

// GET - list all coupons (admin only)
export const GET: APIRoute = async ({ request }) => {
  const auth = request.headers.get('x-admin-password');
  if (auth !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const coupons = await getCoupons();
  return new Response(JSON.stringify(coupons), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST - add a coupon (admin only)
export const POST: APIRoute = async ({ request }) => {
  const auth = request.headers.get('x-admin-password');
  if (auth !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const body = await request.json();
  const { code, type, discount, expires } = body;

  if (!code || !type || !discount) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
  }

  const coupons = await getCoupons();

  if (coupons.find(c => c.code.toUpperCase() === code.toUpperCase())) {
    return new Response(JSON.stringify({ error: 'Coupon code already exists' }), { status: 409 });
  }

  const newCoupon: StoredCoupon = {
    code: code.toUpperCase(),
    type,
    discount: parseFloat(discount),
    expires: expires || '2099-12-31',
    active: true,
    createdAt: new Date().toISOString(),
  };

  coupons.push(newCoupon);
  if (redis) await redis.set(COUPONS_KEY, coupons);

  return new Response(JSON.stringify(newCoupon), { status: 201 });
};

// DELETE - remove a coupon (admin only)
export const DELETE: APIRoute = async ({ request }) => {
  const auth = request.headers.get('x-admin-password');
  if (auth !== ADMIN_PASSWORD) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { code } = await request.json();
  const coupons = await getCoupons();
  const updated = coupons.filter(c => c.code.toUpperCase() !== code.toUpperCase());
  if (redis) await redis.set(COUPONS_KEY, updated);

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
