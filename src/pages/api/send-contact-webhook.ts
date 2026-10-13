import type { APIRoute } from 'astro';
import { verifyRecaptcha, verifyCity, verifyZipMatchesState, isHoneypotFilled } from '@/core/utils/formVerification';

// Mark this page as server-rendered
export const prerender = false;

// The default is the current production hook; GHL_CONTACT_WEBHOOK_URL only needs setting
// to point a deploy somewhere else (e.g. a test hook locally).
const ghlWebhookUrl = import.meta.env.GHL_CONTACT_WEBHOOK_URL || 'https://services.leadconnectorhq.com/hooks/F2g2xOQ3ELR4bB1mEUed/webhook-trigger/bd1833c2-9fc4-42a6-9ffe-07afede969d0';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Send contact webhook API endpoint called');

    const body = await request.json();
    const { firstName, lastName, email, phone, state, city, zipCode, message, smsConsent, formType, source } = body;

    // Honeypot: a field hidden from real users that bots fill because it's in the DOM.
    // Answer 200 so the bot believes it succeeded and doesn't retry another way, but
    // drop the submission on the floor.
    if (isHoneypotFilled(body.faxNumber)) {
      console.warn('[forms] contact submission rejected: honeypot filled');
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Received contact data:', { firstName, lastName, email });

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: firstName, lastName, and email are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!(await verifyRecaptcha(body.recaptchaToken, 'contact_submit'))) {
      return new Response(
        JSON.stringify({ error: 'Something went wrong. Please try again.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!(await verifyCity(city, state))) {
      return new Response(
        JSON.stringify({ error: "We couldn't verify that City/State combination. Please double check and try again." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!(await verifyZipMatchesState(zipCode, state))) {
      return new Response(
        JSON.stringify({ error: "That ZIP code doesn't match the state selected. Please double check and try again." }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build webhook data for GHL
    const webhookData = {
      // Contact Information
      firstName: firstName,
      lastName: lastName,
      fullName: `${firstName} ${lastName}`,
      email: email,
      phone: phone || '',

      // Location Information
      state: state || '',
      city: city || '',
      zipCode: zipCode || '',
      location: state && city ? `${city}, ${state}${zipCode ? ' ' + zipCode : ''}` : '',

      // Message
      message: message || '',

      // Consent
      smsConsent: smsConsent || false,
      smsConsentText: smsConsent ? 'Yes - Agreed to receive SMS messages' : 'No',

      // Metadata
      submissionDate: new Date().toISOString(),
      submissionDateFormatted: new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
      }),
      formType: formType || 'Contact Us',
      source: source || 'E5 Wheels Website - Contact Form',
      sourceUrl: new URL(request.url).origin,
    };

    console.log('Sending contact webhook data to GHL...');

    // Send to GHL webhook
    const webhookResponse = await fetch(ghlWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    console.log('GHL webhook response status:', webhookResponse.status);

    if (!webhookResponse.ok) {
      console.error('GHL webhook failed:', await webhookResponse.text());
      throw new Error('Failed to send webhook to GHL');
    }

    console.log('✅ Contact webhook sent successfully to GHL');

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Contact webhook sending error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send contact webhook' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
