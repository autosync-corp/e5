import type { APIRoute } from 'astro';
import Stripe from 'stripe';

// Mark this page as server-rendered
export const prerender = false;

// Initialize Stripe with your secret key from environment variables
const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
});

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('API endpoint called');

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

    const { amount, currency = 'usd', cartItems } = body;

    console.log('Amount:', amount, 'Currency:', currency);

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Creating payment intent...');

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Amount in cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        cartItems: JSON.stringify(cartItems.map((item: any) => ({
          model: item.product.Model,
          quantity: item.quantity,
          frontWheels: item.frontWheels,
          rearWheels: item.rearWheels,
          price: item.product.Price,
        }))),
      },
    });

    console.log('Payment intent created:', paymentIntent.id);

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create payment intent' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
