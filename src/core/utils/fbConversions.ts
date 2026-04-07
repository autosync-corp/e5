import { Redis } from '@upstash/redis';
import * as crypto from 'crypto';

const redis = new Redis({
  url: import.meta.env.KV_REST_API_URL,
  token: import.meta.env.KV_REST_API_TOKEN,
});

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export async function sendFbPurchaseEvent(order: {
  orderNumber: string;
  total: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  sourceUrl: string;
}) {
  try {
    const raw = await redis.get('e5:tracking');
    const settings: any = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};

    if (!settings.fbPixelId || !settings.fbCapiToken) return;

    const userData: Record<string, string> = {};
    if (order.email) userData['em'] = hashValue(order.email);
    if (order.phone) userData['ph'] = hashValue(order.phone.replace(/\D/g, ''));
    if (order.firstName) userData['fn'] = hashValue(order.firstName);
    if (order.lastName) userData['ln'] = hashValue(order.lastName);

    const payload = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_source_url: order.sourceUrl,
          action_source: 'website',
          user_data: userData,
          custom_data: {
            currency: 'USD',
            value: parseFloat(order.total),
            order_id: order.orderNumber,
          },
        },
      ],
    };

    await fetch(
      `https://graph.facebook.com/v19.0/${settings.fbPixelId}/events?access_token=${settings.fbCapiToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
  } catch {
    // Non-critical — don't break the order flow
  }
}
