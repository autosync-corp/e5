import type { APIRoute } from 'astro';

// Mark this page as server-rendered
export const prerender = false;

// Get Affirm credentials from environment variables
const affirmPublicKey = import.meta.env.PUBLIC_AFFIRM_PUBLIC_KEY;
const affirmPrivateKey = import.meta.env.AFFIRM_PRIVATE_KEY;
const affirmApiUrl = import.meta.env.AFFIRM_API_URL || 'https://sandbox.affirm.com/api/v1/transactions';

if (!affirmPublicKey || !affirmPrivateKey) {
  throw new Error('Affirm API keys are not set in environment variables');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Affirm capture API endpoint called');

    let body;
    try {
      const text = await request.text();
      console.log('Request body:', text);
      body = JSON.parse(text);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body: ' + parseError.message }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { checkoutToken } = body;

    console.log('Checkout Token:', checkoutToken);

    if (!checkoutToken) {
      return new Response(
        JSON.stringify({ error: 'Missing checkout token' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Create Basic Auth header
    const authHeader = 'Basic ' + Buffer.from(`${affirmPublicKey}:${affirmPrivateKey}`).toString('base64');

    console.log('Authorizing Affirm charge with checkout token:', checkoutToken);

    // Step 1: Authorize the charge using the checkout token
    // Note: The checkout was already created by the client-side SDK
    // We just need to authorize it with the token
    const authorizeResponse = await fetch(`https://sandbox.affirm.com/api/v2/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        checkout_token: checkoutToken,
      }),
    });

    const authorizeText = await authorizeResponse.text();
    console.log('Affirm authorize response:', authorizeText);

    if (!authorizeResponse.ok) {
      console.error('Affirm authorize error:', authorizeResponse.status, authorizeText);
      throw new Error(`Affirm authorization failed: ${authorizeResponse.status} - ${authorizeText}`);
    }

    const authorizeData = JSON.parse(authorizeText);
    const chargeId = authorizeData.id;

    console.log('Affirm charge authorized:', chargeId);

    // Step 2: Capture the charge
    console.log('Capturing Affirm charge...');

    const captureResponse = await fetch(`https://sandbox.affirm.com/api/v2/charges/${chargeId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const captureText = await captureResponse.text();
    console.log('Affirm capture response:', captureText);

    if (!captureResponse.ok) {
      console.error('Affirm capture error:', captureResponse.status, captureText);
      throw new Error(`Affirm capture failed: ${captureResponse.status} - ${captureText}`);
    }

    const captureData = JSON.parse(captureText);
    console.log('Affirm charge captured successfully:', captureData);

    return new Response(
      JSON.stringify({
        success: true,
        chargeId: chargeId,
        transactionId: captureData.transaction_id || chargeId,
        amount: authorizeData.amount,
        status: 'captured',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Affirm capture error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to capture Affirm payment' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
