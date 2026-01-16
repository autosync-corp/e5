# Stripe Payment Integration

This document explains how the Stripe payment integration works in the E5 Wheels checkout system.

## Overview

The checkout system uses **Stripe Elements** to securely collect payment information and process payments through the Stripe API. This integration includes:

- Secure card input with Stripe Elements
- Server-side payment intent creation
- Payment confirmation and success handling
- Environment variable configuration for API keys

## Files Modified/Created

### 1. **CheckoutOrder.vue** (`src/pages/checkout/components/CheckoutOrder.vue`)
   - Integrated Stripe Elements for secure card input
   - Added payment processing logic
   - Handles success/error states
   - Clears cart after successful payment

### 2. **API Endpoint** (`src/pages/api/create-payment-intent.ts`)
   - Creates Stripe PaymentIntent on the server
   - Calculates order total and handles cart items
   - Returns client secret for payment confirmation

### 3. **Success Page** (`src/pages/order-success.astro`)
   - Displays order confirmation after successful payment
   - Provides navigation back to shopping

### 4. **Environment Variables** (`.env`)
   - Stores Stripe API keys securely
   - Separates public and secret keys

## Setup Instructions

### 1. Install Dependencies

The required packages are already installed:
```bash
npm install @stripe/stripe-js stripe
```

### 2. Configure Environment Variables

Your `.env` file should be set up with your test keys from Stripe Dashboard:

```env
# Public key (used in the browser)
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Secret key (used on the server)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

**Important:** The `.env` file is added to `.gitignore` to prevent accidentally committing secrets to version control.

### 3. Testing the Integration

#### Test Card Numbers (Stripe Test Mode)

Use these test cards to simulate different payment scenarios:

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0027 6000 3184` | Requires authentication (3D Secure) |

- Use any **future expiration date** (e.g., `12/34`)
- Use any **3-digit CVC** (e.g., `123`)
- Use any **ZIP code** (e.g., `12345`)

### 4. Run the Development Server

```bash
npm run dev
```

Navigate to the checkout page and test the payment flow.

## Payment Flow

1. **Customer adds items to cart**
   - Items are stored in local storage via `CartManager`

2. **Customer goes to checkout**
   - Fills out billing/shipping information in `AddressForm`
   - Reviews order in `CheckoutOrder` component

3. **Stripe Elements loads**
   - Card input field is securely loaded from Stripe
   - All card data is handled by Stripe, never touches your server

4. **Customer clicks "Place Order"**
   - Frontend calls `/api/create-payment-intent` with order total
   - Backend creates a PaymentIntent and returns `clientSecret`

5. **Payment confirmation**
   - Frontend uses Stripe.js to confirm payment with the card details
   - Stripe handles 3D Secure authentication if required

6. **Success handling**
   - Cart is cleared
   - Customer is redirected to `/order-success`
   - Order confirmation email would be sent (to be implemented)

## Security Features

✅ **PCI Compliance**
- Card details never touch your server
- Stripe Elements handles all sensitive data

✅ **Environment Variables**
- API keys stored in `.env` file
- `.env` is git-ignored to prevent leaks

✅ **Server-side Validation**
- Payment intents created on the server
- Amount validation before creating charge

✅ **HTTPS Required**
- Stripe requires HTTPS in production
- Test mode works on localhost

## Going to Production

### 1. Get Production Keys

1. Log in to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Toggle from "Test mode" to "Live mode"
3. Go to Developers > API keys
4. Copy your live keys

### 2. Update Environment Variables

Update your production `.env` file:

```env
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
```

### 3. Enable HTTPS

Stripe requires HTTPS for production. Make sure your deployment platform provides SSL certificates.

### 4. Webhook Setup (Optional but Recommended)

Set up webhooks to handle:
- Payment success notifications
- Failed payments
- Refunds
- Disputes

Webhook endpoint: `https://yourdomain.com/api/stripe-webhook`

## Additional Features to Implement

### Recommended Enhancements:

1. **Order Confirmation Emails**
   - Send email after successful payment
   - Include order details and receipt

2. **Order Management**
   - Store orders in a database
   - Create customer accounts
   - Order history page

3. **Webhook Handler**
   - Listen for Stripe events
   - Update order status automatically
   - Handle failed payments

4. **Apple Pay / Google Pay**
   - Already partially configured in UI
   - Stripe supports Payment Request API

5. **Shipping Calculation**
   - Currently hardcoded as "Free Shipping"
   - Integrate with shipping providers

6. **Tax Calculation**
   - Currently uses fixed FL sales tax
   - Use Stripe Tax for automatic calculation

## Troubleshooting

### Payment Intent Creation Fails

- Check that `STRIPE_SECRET_KEY` is set correctly
- Verify the API version in `create-payment-intent.ts`
- Check server console for error messages

### Card Element Not Appearing

- Check browser console for errors
- Verify `PUBLIC_STRIPE_PUBLISHABLE_KEY` is accessible
- Ensure Stripe.js script is loading

### Payment Confirmation Fails

- Check that the amount is in cents (multiply by 100)
- Verify card details are valid test cards
- Check network tab for API errors

## Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
- [Testing Stripe](https://stripe.com/docs/testing)

## Summary

Your E5 Wheels checkout now has a fully functional Stripe payment integration with:

✅ Secure card input with Stripe Elements
✅ Server-side payment processing
✅ Test and production environment support
✅ Success/error handling
✅ Cart clearing after purchase
✅ Professional success page

The integration is ready for testing in test mode. When you're ready to accept real payments, simply update the environment variables with your live keys!
