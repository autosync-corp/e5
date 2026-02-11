import type { APIRoute } from 'astro';

// Mark this page as server-rendered
export const prerender = false;

const ghlWebhookUrl = 'https://services.leadconnectorhq.com/hooks/KqlpMLqMB6avqxiT2xPx/webhook-trigger/1133036c-d6b3-4550-b41d-74a64cb17477';

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Send vendor registration webhook API endpoint called');

    const body = await request.json();
    const {
      // Shop Info
      shopName,
      shopType,
      websiteUrl,
      shopAddress,
      state,
      city,
      zipCode,
      socialMediaLinks,
      // Primary Contact
      fullName,
      titleRole,
      email,
      phone,
      // Business Verification
      yearsInBusiness,
      hasRetailLocation,
      resaleCertificate
    } = body;

    console.log('Received vendor registration data:', { shopName, email, shopType });

    // Validate required fields
    if (!shopName || !shopType || !websiteUrl || !shopAddress || !state || !city || !zipCode || !socialMediaLinks || !fullName || !titleRole || !email || !phone || !yearsInBusiness || !hasRetailLocation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build full address
    const fullAddress = `${shopAddress}, ${city}, ${state} ${zipCode}`;

    // Build webhook data for GHL
    const webhookData = {
      // Shop Information
      shopName: shopName,
      shopType: shopType,
      websiteUrl: websiteUrl,
      shopAddress: shopAddress,
      city: city,
      state: state,
      zipCode: zipCode,
      fullAddress: fullAddress,
      socialMediaLinks: socialMediaLinks,

      // Primary Contact Information
      contactFullName: fullName,
      contactFirstName: fullName.split(' ')[0] || fullName,
      contactLastName: fullName.split(' ').slice(1).join(' ') || '',
      contactTitle: titleRole,
      contactEmail: email,
      contactPhone: phone,

      // Business Verification
      yearsInBusiness: yearsInBusiness,
      hasRetailLocation: hasRetailLocation,
      hasRetailLocationText: hasRetailLocation === 'Yes' ? 'Yes - Has retail location' : 'No - Online only',
      resaleCertificate: resaleCertificate || '',
      hasResaleCertificate: resaleCertificate ? 'Yes' : 'No',

      // Summary
      businessSummary: `${shopType} - ${yearsInBusiness}`,

      // Metadata
      submissionDate: new Date().toISOString(),
      submissionDateFormatted: new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
      }),
      formType: 'Vendor Registration',
      source: 'E5 Wheels Website - Vendor Registration Form',
      sourceUrl: new URL(request.url).origin,
    };

    console.log('Sending vendor registration webhook data to GHL...');

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

    console.log('✅ Vendor registration webhook sent successfully to GHL');

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Vendor registration webhook sending error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send vendor registration webhook' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
