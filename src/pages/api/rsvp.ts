import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';
import { getEventBySlug } from '@/core/services/EventsService';

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

function rsvpKeyFor(eventSlug: string): string {
  return `e5:rsvp:${eventSlug}`;
}

const ATTENDING_LABELS: Record<string, string> = { YES: 'Yes', MAYBE: 'Maybe', NO: 'No' };

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    if (!data.eventSlug || !data.firstName || !data.lastName || !data.email) {
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
      await redis.lpush(rsvpKeyFor(data.eventSlug), JSON.stringify(entry));
    }

    const webhookUrl = import.meta.env.GHL_RSVP_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        const event = await getEventBySlug(data.eventSlug);

        const vehicleParts = [data.corvetteGen, data.modelTrim].filter(Boolean);
        const wheelParts = [data.wheelInterest, data.wheelFinish].filter(Boolean);

        const customFieldAnswers = data.customFieldAnswers || {};
        const customFieldsText = Object.entries(customFieldAnswers)
          .filter(([, value]) => value)
          .map(([label, value]) => `${label}: ${value}`)
          .join('\n');

        const eventTitle = event?.title || data.eventSlug;

        const webhookData = {
          // RSVP Information
          rsvpId: entry.id,
          timestamp: entry.timestamp,
          timestampFormatted: new Date(entry.timestamp).toLocaleString('en-US', {
            dateStyle: 'full',
            timeStyle: 'short',
          }),

          // Ready-made subject line — drop directly into the GHL email/notification subject field
          emailSubject: `New RSVP: ${eventTitle} — ${data.firstName} ${data.lastName}`,

          // Event Information
          event: {
            slug: data.eventSlug,
            title: eventTitle,
            dateLabel: event?.dateLabel || '',
            location: event?.location || '',
            timeRange: event?.timeRange || '',
          },

          // Attendee Information
          attendee: {
            firstName: data.firstName,
            lastName: data.lastName,
            fullName: `${data.firstName} ${data.lastName}`,
            email: data.email,
            phone: data.phone || '',
          },

          // Location
          location: {
            state: data.state || '',
            city: data.city || '',
            fullLocation: [data.city, data.state].filter(Boolean).join(', '),
          },

          // Vehicle Interest
          vehicle: {
            corvetteGen: data.corvetteGen || '',
            modelTrim: data.modelTrim || '',
            display: vehicleParts.join(' '),
          },

          // Wheel Interest
          wheel: {
            model: data.wheelInterest || '',
            finish: data.wheelFinish || '',
            display: wheelParts.join(' - '),
          },

          // Attending
          attending: data.attending || '',
          attendingLabel: ATTENDING_LABELS[data.attending] || data.attending || '',

          // Custom Fields
          customFieldAnswers,
          customFieldsText,

          // Metadata
          metadata: {
            source: 'E5 Wheels RSVP',
            sourceUrl: new URL(request.url).origin + `/events/${data.eventSlug}`,
          },
        };

        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookData),
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
