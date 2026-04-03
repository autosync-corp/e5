import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';
import type { StoredCoupon } from './coupons';

export const prerender = false;

const redis = new Redis({
  url: import.meta.env.KV_REST_API_URL,
  token: import.meta.env.KV_REST_API_TOKEN,
});

const COUPONS_KEY = 'e5:coupons';

export const POST: APIRoute = async ({ request }) => {
  const { code, subtotal } = await request.json();

  if (!code) {
    return new Response(JSON.stringify({ valid: false, error: 'No code provided' }), { status: 400 });
  }

  const coupons = await redis.get<StoredCoupon[]>(COUPONS_KEY) || [];
  const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());

  if (!coupon) {
    return new Response(JSON.stringify({ valid: false, error: 'Invalid coupon code' }), { status: 200 });
  }

  if (!coupon.active) {
    return new Response(JSON.stringify({ valid: false, error: 'Coupon is no longer active' }), { status: 200 });
  }

  if (coupon.expires && new Date(coupon.expires) < new Date()) {
    return new Response(JSON.stringify({ valid: false, error: 'Coupon has expired' }), { status: 200 });
  }

  const discount = coupon.type === 'percentage'
    ? (subtotal * coupon.discount) / 100
    : coupon.discount;

  return new Response(JSON.stringify({
    valid: true,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      discount: coupon.discount,
    },
    discountAmount: parseFloat(discount.toFixed(2)),
  }), { status: 200 });
};
