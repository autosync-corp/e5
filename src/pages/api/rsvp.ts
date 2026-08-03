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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// One full-width rounded row per optional field — returns '' if there's no value,
// so the caller can filter it out instead of rendering an empty labeled box.
function createOptionalRow(label: string, value: string): string {
  if (!value) return '';
  return `<tr><td style="padding:0 0 12px 0;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background-color:#f4f4f4;border:1px solid #dddddd;border-collapse:separate;border-spacing:0;border-radius:10px;"><tr><td style="width:165px;padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:18px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#777777;vertical-align:top;">${escapeHtml(label)}</td><td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:#111111;vertical-align:top;">${escapeHtml(value)}</td></tr></table></td></tr>`;
}

// Wraps whatever rows have data in a titled section — returns '' entirely if nothing
// optional was submitted, so the GHL template shows no heading, box, or spacing at all.
function wrapOptionalDetails(rows: string[]): string {
  const availableRows = rows.filter(Boolean);
  if (availableRows.length === 0) return '';
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;"><tr><td style="padding:0 0 12px 0;"><div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#d31d25;font-weight:700;">Additional Details</div></td></tr><tr><td><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">${availableRows.join('')}</table></td></tr></table>`;
}

function buildOptionalDetailsText(pairs: [string, string][]): string {
  return pairs.filter(([, value]) => value).map(([label, value]) => `${label}: ${value}`).join('\n');
}

const RECAPTCHA_SCORE_THRESHOLD = 0.5;

// Returns true if the submission should proceed. Skips the check entirely when the
// feature isn't configured (matches the optional-webhook pattern used elsewhere here),
// but blocks once a project/API key is set and the token is missing, invalid, or low-scoring.
async function verifyRecaptcha(token: string, expectedAction: string): Promise<boolean> {
  const projectId = import.meta.env.RECAPTCHA_PROJECT_ID;
  const apiKey = import.meta.env.RECAPTCHA_API_KEY;
  const siteKey = import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY;
  if (!projectId || !apiKey || !siteKey) return true;
  if (!token) return false;

  try {
    const res = await fetch(
      `https://recaptchaenterprise.googleapis.com/v1/projects/${projectId}/assessments?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: { token, expectedAction, siteKey } }),
      }
    );
    const result = await res.json();
    if (!result.tokenProperties?.valid) return false;
    if (result.tokenProperties.action !== expectedAction) return false;
    return (result.riskAnalysis?.score ?? 0) >= RECAPTCHA_SCORE_THRESHOLD;
  } catch {
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    if (!data.eventSlug || !data.firstName || !data.lastName || !data.email) {
      return new Response(JSON.stringify({ error: 'First name, last name, and email are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const recaptchaOk = await verifyRecaptcha(data.recaptchaToken, 'rsvp_submit');
    if (!recaptchaOk) {
      return new Response(JSON.stringify({ error: 'Something went wrong. Please try again.' }), {
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

        const customFieldAnswers: Record<string, string> = data.customFieldAnswers || {};
        const filledCustomFields = Object.entries(customFieldAnswers).filter(([, value]) => value);
        const customFieldsText = filledCustomFields
          .map(([label, value]) => `${label}: ${value}`)
          .join('\n');
        const customFieldsHtml = filledCustomFields
          .map(([label, value]) => `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(String(value))}`)
          .join('<br>');

        const eventTitle = event?.title || data.eventSlug;

        const fullLocation = [data.streetAddress, data.city, data.state, data.zipCode]
          .filter(Boolean)
          .join(', ');

        const webhookData: Record<string, any> = {
          // RSVP Information
          rsvpId: entry.id,
          timestamp: entry.timestamp,
          timestampFormatted: new Date(entry.timestamp).toLocaleString('en-US', {
            dateStyle: 'full',
            timeStyle: 'short',
          }),

          // Ready-made subject lines — drop directly into GHL's subject fields
          emailSubject: `New RSVP: ${eventTitle} — ${data.firstName} ${data.lastName}`, // internal staff notification
          customerEmailSubject: `We received your RSVP — ${eventTitle}`, // attendee confirmation

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
            streetAddress: data.streetAddress || '',
            city: data.city || '',
            state: data.state || '',
            zipCode: data.zipCode || '',
            fullLocation,
          },

          // Vehicle Interest
          vehicle: {
            corvetteGen: data.corvetteGen || '',
            modelTrim: data.modelTrim || '',
            display: vehicleParts.join(' '),
          },

          // Attending
          attending: data.attending || '',
          attendingLabel: ATTENDING_LABELS[data.attending] || data.attending || '',

          // Metadata
          metadata: {
            source: 'E5 Wheels RSVP',
            sourceUrl: new URL(request.url).origin + `/events/${data.eventSlug}`,
          },
        };

        // Only included when the event actually uses these — keeps the payload free of
        // empty sections for events that don't have the wheel dropdown or custom fields on
        if (wheelParts.length > 0) {
          webhookData.wheel = {
            model: data.wheelInterest || '',
            finish: data.wheelFinish || '',
            display: wheelParts.join(' - '),
          };
        }

        if (filledCustomFields.length > 0) {
          webhookData.customFieldAnswers = customFieldAnswers;
          webhookData.customFieldsText = customFieldsText;
          webhookData.customFieldsHtml = customFieldsHtml;
        }

        // Combined optional-details blocks — generated server-side so the GHL template
        // only needs one merge tag with no surrounding wrapper. Internal gets everything;
        // customer gets a trimmed version (no custom field answers echoed back to them).
        const attendingValue = ATTENDING_LABELS[data.attending] || data.attending || '';
        const vehicleValue = vehicleParts.join(' ');
        const wheelValue = wheelParts.join(' - ');

        const internalRows = [
          createOptionalRow('Attending', attendingValue),
          createOptionalRow('Corvette', vehicleValue),
          createOptionalRow('Wheel Interest', wheelValue),
          ...filledCustomFields.map(([label, value]) => createOptionalRow(label, String(value))),
        ];
        const customerRows = [
          createOptionalRow('Attending', attendingValue),
          createOptionalRow('Corvette', vehicleValue),
          createOptionalRow('Wheel Interest', wheelValue),
        ];

        webhookData.internalOptionalDetailsHtml = wrapOptionalDetails(internalRows);
        webhookData.hasInternalOptionalDetails = webhookData.internalOptionalDetailsHtml !== '';
        webhookData.internalOptionalDetailsText = buildOptionalDetailsText([
          ['Attending', attendingValue],
          ['Corvette', vehicleValue],
          ['Wheel Interest', wheelValue],
          ...filledCustomFields.map(([label, value]) => [label, String(value)] as [string, string]),
        ]);

        webhookData.customerOptionalDetailsHtml = wrapOptionalDetails(customerRows);
        webhookData.hasCustomerOptionalDetails = webhookData.customerOptionalDetailsHtml !== '';
        webhookData.customerOptionalDetailsText = buildOptionalDetailsText([
          ['Attending', attendingValue],
          ['Corvette', vehicleValue],
          ['Wheel Interest', wheelValue],
        ]);

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
