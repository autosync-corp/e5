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
    console.log('Affirm checkout API endpoint called');

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

    const {
      amount,
      cartItems,
      customer,
      billingAddress,
      shippingAddress,
      vehicle
    } = body;

    console.log('Amount:', amount, 'Customer:', customer);

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Build Affirm checkout object
    const affirmCheckout = {
      merchant: {
        user_confirmation_url: `${new URL(request.url).origin}/order-success?affirm=true`,
        user_cancel_url: `${new URL(request.url).origin}/checkout`,
        user_confirmation_url_action: 'GET',
        name: 'E5 Wheels',
      },
      shipping: shippingAddress ? {
        name: {
          first: shippingAddress.firstName || '',
          last: shippingAddress.lastName || '',
        },
        address: {
          line1: shippingAddress.address1 || '',
          line2: shippingAddress.address2 || '',
          city: shippingAddress.city || '',
          state: shippingAddress.state || '',
          zipcode: shippingAddress.zipCode || '',
          country: shippingAddress.country || 'USA',
        },
        phone_number: customer?.phone || '',
        email: customer?.email || '',
      } : undefined,
      billing: billingAddress ? {
        name: {
          first: billingAddress.firstName || '',
          last: billingAddress.lastName || '',
        },
        address: {
          line1: billingAddress.address1 || '',
          line2: billingAddress.address2 || '',
          city: billingAddress.city || '',
          state: billingAddress.state || '',
          zipcode: billingAddress.zipCode || '',
          country: billingAddress.country || 'USA',
        },
        phone_number: customer?.phone || '',
        email: customer?.email || '',
      } : undefined,
      items: cartItems.map((item: any) => ({
        display_name: `${item.product.Model} - ${item.product.Diameter}"x${item.product.Width}"`,
        sku: item.product.Pn || item.product.Id,
        unit_price: Math.round((item.product.Price ?? 0) * 100), // Convert to cents
        qty: item.frontWheels + item.rearWheels,
        item_image_url: item.product.ImageUrl || '',
        item_url: `${new URL(request.url).origin}/shop/${item.product.Model.toLowerCase()}`,
      })),
      metadata: {
        vehicle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}` : '',
        order_source: 'E5 Wheels Website',
      },
      order_id: `ORDER-${Date.now()}`, // Temporary order ID
      shipping_amount: 0, // Free shipping
      tax_amount: Math.round((amount * 0.07) * 100), // 7% tax in cents
      total: Math.round(amount * 100), // Total in cents
      currency: 'USD',
    };

    console.log('Creating Affirm checkout with data:', JSON.stringify(affirmCheckout, null, 2));

    // Create Basic Auth header
    const authHeader = 'Basic ' + Buffer.from(`${affirmPublicKey}:${affirmPrivateKey}`).toString('base64');

    // Call Affirm API to create checkout
    const affirmResponse = await fetch(affirmApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(affirmCheckout),
    });

    const responseText = await affirmResponse.text();
    console.log('Affirm API Response:', responseText);

    if (!affirmResponse.ok) {
      console.error('Affirm API Error:', affirmResponse.status, responseText);
      throw new Error(`Affirm API error: ${affirmResponse.status} - ${responseText}`);
    }

    const affirmData = JSON.parse(responseText);
    console.log('Affirm checkout created:', affirmData);

    return new Response(
      JSON.stringify({
        checkoutToken: affirmData.checkout_token || affirmData.token,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Affirm checkout creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create Affirm checkout' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
