import type { APIRoute } from 'astro';

// Mark this page as server-rendered
export const prerender = false;

const ghlWebhookUrl = 'https://services.leadconnectorhq.com/hooks/KqlpMLqMB6avqxiT2xPx/webhook-trigger/3889a8dc-4fcc-49b5-8310-35c0864b8778';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Send contact webhook API endpoint called');

    const body = await request.json();
    const { firstName, lastName, email, phone, state, city, zipCode, message, smsConsent } = body;

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
      formType: 'Contact Us',
      source: 'E5 Wheels Website - Contact Form',
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
