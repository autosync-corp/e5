import type { APIRoute } from 'astro';

// Mark this page as server-rendered
export const prerender = false;

// The default is the current production hook; GHL_REGISTRATION_WEBHOOK_URL only needs setting
// to point a deploy somewhere else (e.g. a test hook locally).
const ghlWebhookUrl = import.meta.env.GHL_REGISTRATION_WEBHOOK_URL || 'https://services.leadconnectorhq.com/hooks/F2g2xOQ3ELR4bB1mEUed/webhook-trigger/cf036c3d-501c-409e-95f8-17c06a35e047';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Send registration webhook API endpoint called');

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      purchaseMonth,
      purchaseDay,
      purchaseYear,
      corvetteGeneration,
      corvetteYear,
      color,
      wheelModel,
      purchaseLocation
    } = body;

    console.log('Received registration data:', { firstName, lastName, email, wheelModel });

    // Validate required fields
    if (!firstName || !lastName || !email || !purchaseMonth || !purchaseDay || !purchaseYear || !corvetteGeneration || !corvetteYear || !color || !wheelModel || !purchaseLocation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build formatted purchase date
    const purchaseDate = `${purchaseMonth}/${purchaseDay}/${purchaseYear}`;
    const purchaseDateObj = new Date(`${purchaseYear}-${purchaseMonth}-${purchaseDay}`);
    const purchaseDateFormatted = purchaseDateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Build webhook data for GHL
    const webhookData = {
      // Customer Information
      firstName: firstName,
      lastName: lastName,
      fullName: `${firstName} ${lastName}`,
      email: email,
      phone: phone || '',

      // Purchase Information
      purchaseDate: purchaseDate,
      purchaseDateFormatted: purchaseDateFormatted,
      purchaseMonth: purchaseMonth,
      purchaseDay: purchaseDay,
      purchaseYear: purchaseYear,
      purchaseLocation: purchaseLocation,

      // Vehicle Information
      corvetteGeneration: corvetteGeneration,
      corvetteYear: corvetteYear,
      corvetteColor: color,
      vehicleFullName: `${corvetteYear} ${corvetteGeneration}`,
      vehicleDescription: `${corvetteYear} ${corvetteGeneration} - ${color}`,

      // Wheel Information
      wheelModel: wheelModel,
      wheelModelAndFinish: wheelModel,

      // Metadata
      registrationDate: new Date().toISOString(),
      registrationDateFormatted: new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
      }),
      formType: 'Wheel Registration',
      source: 'E5 Wheels Website - Registration Form',
      sourceUrl: new URL(request.url).origin,
    };

    console.log('Sending registration webhook data to GHL...');

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

    console.log('✅ Registration webhook sent successfully to GHL');

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Registration webhook sending error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send registration webhook' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
