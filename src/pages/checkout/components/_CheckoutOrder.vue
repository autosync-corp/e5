<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { CartManager, calculateCartTotals, formatPrice, type CartItem } from '@/core/services/ProductService';
import { loadStripe, type Stripe, type StripeElements, type StripeCardNumberElement, type StripeCardExpiryElement, type StripeCardCvcElement } from '@stripe/stripe-js';
import type { Vehicle } from '@/core/services/VehicleService';
import { TERMS_ROUTE } from '@/core/constants/Routes';

// Props
const props = defineProps<{
  stripePublishableKey?: string;
  affirmPublicKey?: string;
  affirmJsUrl?: string;
  ghlWebhookUrl?: string;
}>();

// State
const cartItems = ref<CartItem[]>([]);
const appliedCoupon = ref<string | null>(null);
const appliedDiscount = ref<number>(0);
const appliedCouponInfo = ref<{ type: string; discount: number } | null>(null);
const isProcessing = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const cardNumberError = ref('');
const cardExpiryError = ref('');
const cardCvcError = ref('');
const cardBrand = ref('');
const selectedVehicle = ref<Vehicle | null>(null);
const vehicleDisplay = ref<string>('');
const selectedPaymentMethod = ref<'card' | 'affirm'>('card');
const customerState = ref<string>('');

// Stripe state
let stripe: Stripe | null = null;
let elements: StripeElements | null = null;
let cardNumberElement: StripeCardNumberElement | null = null;
let cardExpiryElement: StripeCardExpiryElement | null = null;
let cardCvcElement: StripeCardCvcElement | null = null;

// Affirm state
declare global {
  interface Window {
    affirm: any;
    _affirm_config: any;
  }
}
let affirmInitialized = false;

// Computed
const cartTotals = computed(() => {
  const base = calculateCartTotals(cartItems.value, customerState.value);
  return {
    ...base,
    discount: appliedDiscount.value,
    discountedSubtotal: base.subtotal - appliedDiscount.value,
    total: base.subtotal - appliedDiscount.value + base.tax,
    appliedCoupon: appliedCouponInfo.value,
  };
});

const isEmpty = computed(() => cartItems.value.length === 0);

// Methods
async function loadCart() {
  cartItems.value = CartManager.getCart();
  const savedCoupon = CartManager.getAppliedCoupon();
  if (savedCoupon) {
    const base = calculateCartTotals(cartItems.value);
    const res = await fetch('/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: savedCoupon, subtotal: base.subtotal }),
    });
    const data = await res.json();
    if (data.valid) {
      appliedCoupon.value = savedCoupon;
      appliedDiscount.value = data.discountAmount;
      appliedCouponInfo.value = data.coupon;
    } else {
      CartManager.removeCoupon();
    }
  }
}

function loadVehicle() {
  const VEHICLE_STORAGE_KEY = 'e5-selected-vehicle';
  const VEHICLE_DISPLAY_KEY = 'e5-selected-vehicle-display';
  const savedVehicle = localStorage.getItem(VEHICLE_STORAGE_KEY);
  const savedDisplay = localStorage.getItem(VEHICLE_DISPLAY_KEY);

  if (savedVehicle) {
    try {
      selectedVehicle.value = JSON.parse(savedVehicle);
    } catch (error) {
      console.error('Error loading saved vehicle:', error);
    }
  }

  if (savedDisplay) {
    vehicleDisplay.value = savedDisplay;
  }
}

async function initializeStripe() {
  // Initialize Stripe with your publishable key from props
  const stripeKey = props.stripePublishableKey;

  if (!stripeKey) {
    console.error('Stripe publishable key is not provided');
    return;
  }

  stripe = await loadStripe(stripeKey);

  if (!stripe) {
    console.error('Failed to load Stripe');
    return;
  }

  // Create Elements instance
  elements = stripe.elements();

  // Shared style for all elements
  const elementStyle = {
    base: {
      fontSize: '14px',
      color: '#0a0a0a',
      fontFamily: "'Franklin Gothic Book', sans-serif",
      '::placeholder': {
        color: '#999999',
      },
    },
    invalid: {
      color: '#d31d25',
    },
  };

  // Create separate elements for card number, expiry, and CVC
  cardNumberElement = elements.create('cardNumber', {
    style: elementStyle,
    placeholder: '1234 1234 1234 1234',
    showIcon: true, // Show card brand icon
  });

  cardExpiryElement = elements.create('cardExpiry', {
    style: elementStyle,
    placeholder: 'MM / YY',
  });

  cardCvcElement = elements.create('cardCvc', {
    style: elementStyle,
    placeholder: 'CVC',
  });

  // Mount the elements
  const cardNumberContainer = document.getElementById('card-number-element');
  const cardExpiryContainer = document.getElementById('card-expiry-element');
  const cardCvcContainer = document.getElementById('card-cvc-element');

  if (cardNumberContainer) {
    cardNumberElement.mount('#card-number-element');
  }
  if (cardExpiryContainer) {
    cardExpiryElement.mount('#card-expiry-element');
  }
  if (cardCvcContainer) {
    cardCvcElement.mount('#card-cvc-element');
  }

  // Add event listeners for real-time validation and card brand detection
  cardNumberElement.on('change', (event) => {
    if (event.error) {
      cardNumberError.value = event.error.message;
    } else {
      cardNumberError.value = '';
    }
    // Update card brand (visa, mastercard, amex, etc.)
    if (event.brand) {
      cardBrand.value = event.brand;
    }
  });

  cardExpiryElement.on('change', (event) => {
    if (event.error) {
      cardExpiryError.value = event.error.message;
    } else {
      cardExpiryError.value = '';
    }
  });

  cardCvcElement.on('change', (event) => {
    if (event.error) {
      cardCvcError.value = event.error.message;
    } else {
      cardCvcError.value = '';
    }
  });
}

function initializeAffirm() {
  // Load Affirm.js script
  if (affirmInitialized || typeof window.affirm !== 'undefined') {
    affirmInitialized = true;
    return;
  }

  // Get Affirm public key from props
  const affirmKey = props.affirmPublicKey;

  if (!affirmKey) {
    console.error('Affirm public key is not provided');
    return;
  }

  // Configure Affirm before loading script
  const jsUrl = props.affirmJsUrl || 'https://cdn1-sandbox.affirm.com/js/v2/affirm.js';

  window._affirm_config = {
    public_api_key: affirmKey,
    script: jsUrl,
  };

  const script = document.createElement('script');
  script.src = jsUrl;
  script.async = true;
  script.onload = () => {
    affirmInitialized = true;
    console.log('Affirm initialized');

    // Refresh Affirm UI to show promotional messaging
    if (window.affirm && window.affirm.ui && window.affirm.ui.refresh) {
      // Set the amount for promotional messaging
      const promoElement = document.querySelector('.affirm-as-low-as');
      if (promoElement) {
        promoElement.setAttribute('data-amount', (cartTotals.value.total * 100).toString());
      }
      window.affirm.ui.refresh();
    }
  };

  document.head.appendChild(script);
}

function handlePaymentMethodChange(method: 'card' | 'affirm') {
  selectedPaymentMethod.value = method;
  errorMessage.value = '';

  // Refresh Affirm promotional messaging when selected
  if (method === 'affirm' && window.affirm && window.affirm.ui) {
    setTimeout(() => {
      const promoElement = document.querySelector('.affirm-as-low-as');
      if (promoElement) {
        promoElement.setAttribute('data-amount', (cartTotals.value.total * 100).toString());
        promoElement.setAttribute('data-affirm-type', 'logo');
        promoElement.setAttribute('data-affirm-color', 'blue');
      }
      if (window.affirm.ui.refresh) {
        window.affirm.ui.refresh();
      }
    }, 100);
  }
}

async function sendOrderToWebhook(paymentId: string, paymentMethod: string, customerData: any) {
  try {
    const webhookUrl = props.ghlWebhookUrl;

    if (!webhookUrl) {
      console.error('GHL Webhook URL is not configured');
      return;
    }

    // Generate unique order number from timestamp
    const orderNumber = Date.now().toString().slice(-6);

    const webhookData = {
      // Order Information
      orderId: paymentId,
      orderNumber: orderNumber,
      orderDate: new Date().toISOString(),
      orderDateFormatted: new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
      }),

      // Vehicle Information
      vehicle: selectedVehicle.value ? {
        year: selectedVehicle.value.Year,
        make: selectedVehicle.value.Make,
        model: selectedVehicle.value.Model,
        trim: selectedVehicle.value.Submodel,
        fullName: `${selectedVehicle.value.Year} ${selectedVehicle.value.Make} ${selectedVehicle.value.Model} ${selectedVehicle.value.Submodel}`,
        displayName: vehicleDisplay.value || `${selectedVehicle.value.Year} ${selectedVehicle.value.Make} ${selectedVehicle.value.Model} ${selectedVehicle.value.Submodel}`,
      } : null,

      // Customer Information (Billing)
      customer: customerData ? {
        firstName: customerData.billing.firstName,
        lastName: customerData.billing.lastName,
        fullName: `${customerData.billing.firstName} ${customerData.billing.lastName}`,
        email: customerData.billing.emailAddress,
        phone: customerData.billing.phoneNumber,
        company: customerData.billing.companyName,
      } : {},

      // Billing Address
      billingAddress: customerData ? {
        firstName: customerData.billing.firstName,
        lastName: customerData.billing.lastName,
        company: customerData.billing.companyName,
        address1: customerData.billing.streetAddress1,
        address2: customerData.billing.streetAddress2,
        city: customerData.billing.city,
        state: customerData.billing.state,
        zipCode: customerData.billing.zipCode,
        country: customerData.billing.country,
        fullAddress: `${customerData.billing.streetAddress1}${customerData.billing.streetAddress2 ? ', ' + customerData.billing.streetAddress2 : ''}, ${customerData.billing.city}, ${customerData.billing.state} ${customerData.billing.zipCode}, ${customerData.billing.country}`,
      } : {},

      // Shipping Address
      shippingAddress: customerData && customerData.shipping ? {
        firstName: customerData.shipping.firstName,
        lastName: customerData.shipping.lastName,
        company: customerData.shipping.companyName,
        address1: customerData.shipping.streetAddress1,
        address2: customerData.shipping.streetAddress2,
        city: customerData.shipping.city,
        state: customerData.shipping.state,
        zipCode: customerData.shipping.zipCode,
        country: customerData.shipping.country,
        fullAddress: `${customerData.shipping.streetAddress1}${customerData.shipping.streetAddress2 ? ', ' + customerData.shipping.streetAddress2 : ''}, ${customerData.shipping.city}, ${customerData.shipping.state} ${customerData.shipping.zipCode}, ${customerData.shipping.country}`,
      } : (customerData ? {
        // Use billing as shipping if not different
        firstName: customerData.billing.firstName,
        lastName: customerData.billing.lastName,
        company: customerData.billing.companyName,
        address1: customerData.billing.streetAddress1,
        address2: customerData.billing.streetAddress2,
        city: customerData.billing.city,
        state: customerData.billing.state,
        zipCode: customerData.billing.zipCode,
        country: customerData.billing.country,
        fullAddress: `${customerData.billing.streetAddress1}${customerData.billing.streetAddress2 ? ', ' + customerData.billing.streetAddress2 : ''}, ${customerData.billing.city}, ${customerData.billing.state} ${customerData.billing.zipCode}, ${customerData.billing.country}`,
      } : {}),

      // Order Notes
      orderNotes: customerData ? customerData.orderNotes : '',

      // Products/Items
      items: cartItems.value.map((item, index) => {
        // Build complete finish name
        const finishParts: string[] = [];
        if (item.product.Finish) finishParts.push(item.product.Finish);
        if (item.product.Color) finishParts.push(item.product.Color);
        if (item.product.Accent) finishParts.push(item.product.Accent);
        const finishName = finishParts.length > 0 ? finishParts.join(' ') : 'Standard';

        return {
          lineNumber: index + 1,
          partNumber: item.product.Pn || item.product.Id || `${item.product.Model}-${item.product.Diameter}x${item.product.Width}`,
          productId: item.product.Id,
          productName: item.product.Model,
          productModel: item.product.Model,
          quantity: item.quantity,
          configuration: item.frontWheels > 0 && item.rearWheels > 0
            ? `${item.frontWheels} Front + ${item.rearWheels} Rear`
            : item.frontWheels > 0
              ? `${item.frontWheels} Front`
              : `${item.rearWheels} Rear`,
          pricePerWheel: item.product.Price,
          pricePerWheelFormatted: `$${item.product.Price.toFixed(2)}`,
          itemSubtotal: ((item.frontWheels + item.rearWheels) * item.product.Price).toFixed(2),
          itemSubtotalFormatted: `$${((item.frontWheels + item.rearWheels) * item.product.Price).toFixed(2)}`,
          finish: finishName,
          diameter: item.product.Diameter,
          width: item.product.Width,
          size: `${item.product.Diameter}"x${item.product.Width}"`,
          vehicleModel: item.vehicleModel || 'C8 Corvette',
          boltPattern: '5x130',
          offset: item.frontWheels > 0 ? '+25mm Front / +20mm Rear' : '+20mm Rear',
        };
      }),

      // Generate HTML table
      items_html: `
        <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
          <thead>
            <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
              <th style="padding: 12px; text-align: left;">Product</th>
              <th style="padding: 12px; text-align: left;">Part Number</th>
              <th style="padding: 12px; text-align: center;">Configuration</th>
              <th style="padding: 12px; text-align: right;">Price/Wheel</th>
              <th style="padding: 12px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${cartItems.value.map((item) => {
              const finishParts: string[] = [];
              if (item.product.Finish) finishParts.push(item.product.Finish);
              if (item.product.Color) finishParts.push(item.product.Color);
              if (item.product.Accent) finishParts.push(item.product.Accent);
              const finishName = finishParts.length > 0 ? finishParts.join(' ') : 'Standard';
              const partNumber = item.product.Pn || item.product.Id || `${item.product.Model}-${item.product.Diameter}x${item.product.Width}`;
              const configuration = item.frontWheels > 0 && item.rearWheels > 0
                ? `${item.frontWheels} Front + ${item.rearWheels} Rear`
                : item.frontWheels > 0
                  ? `${item.frontWheels} Front`
                  : `${item.rearWheels} Rear`;
              const itemTotal = (item.frontWheels + item.rearWheels) * item.product.Price;

              return `
                <tr style="border-bottom: 1px solid #eee;">
                  <td style="padding: 12px;">
                    <strong>${item.product.Model}</strong><br/>
                    <span style="color: #666; font-size: 13px;">${finishName}</span><br/>
                    <span style="color: #666; font-size: 13px;">${item.product.Diameter}"x${item.product.Width}"</span>
                  </td>
                  <td style="padding: 12px; color: #666;">${partNumber}</td>
                  <td style="padding: 12px; text-align: center;">${configuration}</td>
                  <td style="padding: 12px; text-align: right;">$${item.product.Price.toFixed(2)}</td>
                  <td style="padding: 12px; text-align: right;"><strong>$${itemTotal.toFixed(2)}</strong></td>
                </tr>
              `;
            }).join('')}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid #ddd;">
              <td colspan="4" style="padding: 12px; text-align: right;"><strong>Subtotal:</strong></td>
              <td style="padding: 12px; text-align: right;"><strong>$${cartTotals.value.subtotal.toFixed(2)}</strong></td>
            </tr>
            <tr>
              <td colspan="4" style="padding: 12px; text-align: right;">Tax (7%):</td>
              <td style="padding: 12px; text-align: right;">$${cartTotals.value.tax.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="4" style="padding: 12px; text-align: right;">Shipping:</td>
              <td style="padding: 12px; text-align: right;">FREE</td>
            </tr>
            <tr style="background-color: #f5f5f5; border-top: 2px solid #ddd;">
              <td colspan="4" style="padding: 12px; text-align: right; font-size: 16px;"><strong>Order Total:</strong></td>
              <td style="padding: 12px; text-align: right; font-size: 16px;"><strong>$${cartTotals.value.total.toFixed(2)}</strong></td>
            </tr>
          </tfoot>
        </table>
      `.trim(),

      // Order Totals
      subtotal: (cartTotals.value.subtotal).toFixed(2),
      subtotalFormatted: `$${(cartTotals.value.subtotal).toFixed(2)}`,
      tax: (cartTotals.value.tax).toFixed(2),
      taxFormatted: `$${(cartTotals.value.tax).toFixed(2)}`,
      taxRate: '7%',
      shipping: '0.00',
      shippingFormatted: '$0.00 (Free Shipping)',
      orderTotal: (cartTotals.value.total).toFixed(2),
      orderTotalFormatted: `$${(cartTotals.value.total).toFixed(2)}`,
      orderTotalCents: Math.round(cartTotals.value.total * 100),

      // Payment Information
      payment: {
        paymentId: paymentId,
        paymentIntentId: paymentId,
        paymentMethod: paymentMethod,
        paymentMethodType: paymentMethod.toLowerCase(),
        paymentStatus: 'succeeded',
        paymentProcessor: paymentMethod,
        currency: 'USD',
        amountPaid: (cartTotals.value.total).toFixed(2),
        amountPaidCents: Math.round(cartTotals.value.total * 100),
      },

      // Summary
      summary: {
        itemCount: cartItems.value.length,
        totalWheels: cartItems.value.reduce((sum, item) => sum + item.frontWheels + item.rearWheels, 0),
        productNames: cartItems.value.map(item => item.product.Model).join(', '),
      },

      // Metadata
      metadata: {
        source: 'E5 Wheels Website',
        sourceUrl: window.location.origin,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    console.log('Order data sent to Go High Level successfully', webhookData);
  } catch (webhookError) {
    console.error('Failed to send to Go High Level webhook:', webhookError);
    // Don't fail the order if webhook fails
  }
}

async function handleAffirmPayment() {
  try {
    isProcessing.value = true;
    errorMessage.value = '';

    if (cartItems.value.length === 0) {
      errorMessage.value = 'Your cart is empty';
      return;
    }

    // Get customer data from billing form
    const customerData = (window as any).getCheckoutFormData ? (window as any).getCheckoutFormData() : null;

    if (!customerData) {
      errorMessage.value = 'Please fill in your billing information';
      return;
    }

    // Build shipping address
    const shippingAddr = customerData.shipping || customerData.billing;
    const billingAddr = customerData.billing;

    // Save order data to sessionStorage for when Affirm redirects back
    const orderData = {
      cartItems: cartItems.value,
      customerData: customerData,
      vehicle: selectedVehicle.value,
      vehicleDisplay: vehicleDisplay.value,
      totals: {
        subtotal: cartTotals.value.subtotal,
        tax: cartTotals.value.tax,
        total: cartTotals.value.total,
      }
    };
    sessionStorage.setItem('pendingOrderData', JSON.stringify(orderData));
    console.log('✅ Saved order data to sessionStorage');

    // Open Affirm checkout modal directly
    window.affirm.checkout({
      merchant: {
        user_confirmation_url: `${window.location.origin}/order-success?affirm=true`,
        user_cancel_url: `${window.location.origin}/checkout`,
        user_confirmation_url_action: 'GET',
        name: 'E5 Wheels',
      },
      shipping: {
        name: {
          first: shippingAddr.firstName,
          last: shippingAddr.lastName,
        },
        address: {
          line1: shippingAddr.streetAddress1,
          line2: shippingAddr.streetAddress2 || '',
          city: shippingAddr.city,
          state: shippingAddr.state,
          zipcode: shippingAddr.zipCode,
          country: 'USA',
        },
        phone_number: shippingAddr.phoneNumber || customerData.billing.phoneNumber,
        email: customerData.billing.emailAddress,
      },
      billing: {
        name: {
          first: billingAddr.firstName,
          last: billingAddr.lastName,
        },
        address: {
          line1: billingAddr.streetAddress1,
          line2: billingAddr.streetAddress2 || '',
          city: billingAddr.city,
          state: billingAddr.state,
          zipcode: billingAddr.zipCode,
          country: 'USA',
        },
        phone_number: billingAddr.phoneNumber,
        email: billingAddr.emailAddress,
      },
      items: cartItems.value.map((item) => ({
        display_name: `${item.product.Model} - ${item.product.Diameter}"x${item.product.Width}"`,
        sku: item.product.Pn || item.product.Id.toString(),
        unit_price: Math.round(item.product.Price * 100),
        qty: item.frontWheels + item.rearWheels,
        item_url: `${window.location.origin}/shop/${item.product.Model.toLowerCase()}`,
      })),
      metadata: {
        vehicle: vehicleDisplay.value || (selectedVehicle.value ? `${selectedVehicle.value.Year} ${selectedVehicle.value.Make} ${selectedVehicle.value.Model}` : ''),
      },
      order_id: `ORDER-${Date.now()}`,
      shipping_amount: 0,
      tax_amount: Math.round(cartTotals.value.tax * 100),
      total: Math.round(cartTotals.value.total * 100),
      currency: 'USD',
    });

    // Set up callbacks
    window.affirm.checkout.open({
      onFail: (error: any) => {
        console.error('Affirm checkout failed:', error);
        errorMessage.value = 'Affirm checkout failed. Please try again.';
        isProcessing.value = false;
      },
      onSuccess: async (checkoutData: any) => {
        console.log('✅ Affirm checkout success callback triggered');
        console.log('Checkout data received:', checkoutData);

        try {
          // Capture the charge
          console.log('Sending capture request to /api/affirm-capture...');
          const captureResponse = await fetch('/api/affirm-capture', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              checkoutToken: checkoutData.checkout_token,
            }),
          });

          console.log('Capture response status:', captureResponse.status);

          if (!captureResponse.ok) {
            const errorText = await captureResponse.text();
            console.error('Capture failed:', errorText);
            throw new Error(`Failed to capture Affirm payment: ${errorText}`);
          }

          const captureData = await captureResponse.json();
          console.log('✅ Affirm payment captured:', captureData);

          // Send to GHL webhook (same as Stripe)
          console.log('Sending order to GHL webhook...');
          await sendOrderToWebhook(captureData.chargeId, 'Affirm', customerData);
          console.log('✅ Webhook sent successfully');

          successMessage.value = 'Payment successful! Thank you for your order.';

          // Clear cart
          CartManager.clearCart();
          cartItems.value = [];

          // Redirect to success page
          setTimeout(() => {
            window.location.href = '/order-success?affirm=true';
          }, 2000);
        } catch (error: any) {
          console.error('❌ Error in Affirm success handler:', error);
          errorMessage.value = error.message || 'Failed to process Affirm payment';
          isProcessing.value = false;
        }
      },
    });
  } catch (error: any) {
    console.error('Affirm payment error:', error);
    errorMessage.value = error.message || 'Affirm payment failed. Please try again.';
    isProcessing.value = false;
  }
}

async function handlePlaceOrder() {
  // Route to appropriate payment handler
  if (selectedPaymentMethod.value === 'affirm') {
    await handleAffirmPayment();
    return;
  }

  // Original Stripe payment flow
  if (!stripe || !cardNumberElement) {
    errorMessage.value = 'Stripe not initialized';
    return;
  }

  if (cartItems.value.length === 0) {
    errorMessage.value = 'Your cart is empty';
    return;
  }

  isProcessing.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    // Create payment intent on the server
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(cartTotals.value.total * 100), // Convert to cents
        currency: 'usd',
        cartItems: cartItems.value,
      }),
    });

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }

    const responseText = await response.text();
    console.log('API Response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse JSON:', responseText);
      throw new Error('Invalid response from server');
    }

    const { clientSecret, error } = data;

    if (error) {
      throw new Error(error);
    }

    // Confirm the payment with Stripe using cardNumber element
    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardNumberElement,
      },
    });

    if (stripeError) {
      throw new Error(stripeError.message);
    }

    if (paymentIntent.status === 'succeeded') {
      successMessage.value = 'Payment successful! Thank you for your order.';

      // Get customer data from billing form
      const customerData = (window as any).getCheckoutFormData ? (window as any).getCheckoutFormData() : null;

      // Send order data to Go High Level webhook
      await sendOrderToWebhook(paymentIntent.id, 'Stripe', customerData);

      // Clear cart
      CartManager.clearCart();
      cartItems.value = [];

      // Redirect to success page after 2 seconds
      setTimeout(() => {
        window.location.href = '/order-success';
      }, 2000);
    }
  } catch (error: any) {
    errorMessage.value = error.message || 'Payment failed. Please try again.';
  } finally {
    isProcessing.value = false;
  }
}

onMounted(() => {
  loadCart();
  loadVehicle();
  initializeStripe();
  initializeAffirm();

  // Listen for billing state changes to update tax calculation
  window.addEventListener('billing-state-changed', (event: any) => {
    customerState.value = event.detail.state;
  });
});
</script>

<template>
  <div class="e5CheckoutOrderWrapper">
    <h2 class="e5CheckoutOrderTitle">YOUR ORDER</h2>

    <!-- Empty State -->
    <div v-if="isEmpty" class="e5CheckoutEmptyState">
      <p class="e5CheckoutEmptyText">Your cart is empty</p>
    </div>

    <!-- Product Info -->
    <div v-else>
      <div class="e5CheckoutOrderSection">
        <div class="e5CheckoutOrderRow">
          <span class="e5CheckoutOrderLabel">Product</span>
          <span class="e5CheckoutOrderLabel">Subtotal</span>
        </div>

        <!-- Cart Items -->
        <div v-for="item in cartItems" :key="`${item.product.Id}-${item.frontWheels}-${item.rearWheels}`" class="e5CheckoutProductItem">
          <div>
            <p class="e5CheckoutProductName">
              {{ item.product.Model.toUpperCase() }} × {{ item.quantity }}
            </p>
            <p class="e5CheckoutProductDetail">
              {{ item.frontWheels > 0 && item.rearWheels === 0 ? `${item.frontWheels} x FRONT` : item.frontWheels === 0 && item.rearWheels > 0 ? `${item.rearWheels} x REAR` : `${item.frontWheels} x FRONT + ${item.rearWheels} x REAR` }} {{ item.product.Diameter }}"x{{ item.product.Width }}"
            </p>
            <p class="e5CheckoutProductDetail">
              FINISH: {{ [item.product.Finish, item.product.Color, item.product.Accent].filter(Boolean).join(' ') || 'Standard' }}
            </p>
            <p v-if="item.vehicleModel" class="e5CheckoutProductDetail">
              MODEL: {{ item.vehicleModel }}
            </p>
          </div>
          <span class="e5CheckoutProductPrice">
            {{ formatPrice(
              (item.frontWheels > 0 && item.rearWheels === 0) || (item.frontWheels === 0 && item.rearWheels > 0)
                ? item.product.Price * item.quantity
                : item.product.Price * (item.frontWheels + item.rearWheels) * item.quantity
            ) }}
          </span>
        </div>
      </div>

      <!-- Totals -->
      <div class="e5CheckoutOrderSection">
        <div class="e5CheckoutOrderRow">
          <span class="e5CheckoutOrderLabel">Subtotal</span>
          <span class="e5CheckoutOrderValue">{{ formatPrice(cartTotals.subtotal) }}</span>
        </div>

        <!-- Discount (if applied) -->
        <div v-if="cartTotals.discount > 0" class="e5CheckoutOrderRow" style="color: #16a34a;">
          <span class="e5CheckoutOrderLabel">
            Discount ({{ appliedCoupon }})
            <span v-if="cartTotals.appliedCoupon" style="font-size: 11px; opacity: 0.8;">
              {{ cartTotals.appliedCoupon.type === 'percentage' ? `${cartTotals.appliedCoupon.discount}% off` : `$${cartTotals.appliedCoupon.discount} off` }}
            </span>
          </span>
          <span class="e5CheckoutOrderValue">-{{ formatPrice(cartTotals.discount) }}</span>
        </div>

        <div class="e5CheckoutOrderRow">
          <span class="e5CheckoutOrderLabel">Free Shipping</span>
          <span class="e5CheckoutOrderValue">$0.00</span>
        </div>

        <div class="e5CheckoutOrderRow">
          <span class="e5CheckoutOrderLabel">Sales Tax{{ customerState ? (customerState.toUpperCase() === 'FL' || customerState.toUpperCase() === 'FLORIDA' ? ' (FL)' : '') : ' (if applicable)' }}</span>
          <span class="e5CheckoutOrderValue">{{ formatPrice(cartTotals.tax) }}</span>
        </div>

        <div class="e5CheckoutOrderRow e5CheckoutOrderTotal">
          <span class="e5CheckoutOrderLabel">TOTAL</span>
          <span class="e5CheckoutOrderValue">{{ formatPrice(cartTotals.total) }}</span>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="e5CheckoutPaymentSection">
        <!-- Credit/Debit Cards -->
        <div class="e5CheckoutPaymentOption">
          <input
            type="radio"
            name="payment"
            id="card"
            value="card"
            v-model="selectedPaymentMethod"
            @change="handlePaymentMethodChange('card')"
            class="e5CheckoutRadio"
          />
          <label for="card" class="e5CheckoutPaymentLabel">
            <span>Credit/Debit Cards</span>
            <div class="e5CheckoutCardIcons">
              <img src="/assets/images/cart/visa.svg" alt="Visa" class="e5CheckoutCardImage" />
              <img src="/assets/images/cart/mastercard.svg" alt="Mastercard" class="e5CheckoutCardImage" />
              <img src="/assets/images/cart/amex.svg" alt="American Express" class="e5CheckoutCardImage" />
              <img src="/assets/images/cart/discover.svg" alt="Discover" class="e5CheckoutCardImage" />
              <img src="/assets/images/cart/diners.svg" alt="Diners Club" class="e5CheckoutCardImage" />
              <img src="/assets/images/cart/jcb.svg" alt="JCB" class="e5CheckoutCardImage" />
              <img src="/assets/images/cart/maestro.svg" alt="Maestro" class="e5CheckoutCardImage" />
              <img src="/assets/images/cart/china_union_pay.svg" alt="China UnionPay" class="e5CheckoutCardImage" />
            </div>
          </label>
        </div>

        <!-- Card Details Form with Stripe Elements -->
        <div v-if="selectedPaymentMethod === 'card'" class="e5CheckoutCardForm">
          <div class="e5CheckoutFormGroup">
            <label class="e5CheckoutLabel">CARD NUMBER</label>
            <div id="card-number-element" class="e5StripeCardElement" :class="{ 'e5StripeCardElement--error': cardNumberError }"></div>
            <div v-if="cardNumberError" class="e5StripeCardError">{{ cardNumberError }}</div>
          </div>

          <div class="e5CheckoutFormRow">
            <div class="e5CheckoutFormGroup">
              <label class="e5CheckoutLabel">EXPIRATION DATE</label>
              <div id="card-expiry-element" class="e5StripeCardElement" :class="{ 'e5StripeCardElement--error': cardExpiryError }"></div>
              <div v-if="cardExpiryError" class="e5StripeCardError">{{ cardExpiryError }}</div>
            </div>
            <div class="e5CheckoutFormGroup">
              <label class="e5CheckoutLabel">SECURITY CODE</label>
              <div id="card-cvc-element" class="e5StripeCardElement" :class="{ 'e5StripeCardElement--error': cardCvcError }"></div>
              <div v-if="cardCvcError" class="e5StripeCardError">{{ cardCvcError }}</div>
            </div>
          </div>

          <div class="e5CheckoutCheckboxGroup">
            <input type="checkbox" id="saveCard" class="e5CheckoutCheckbox" />
            <label for="saveCard" class="e5CheckoutCheckboxLabel">Save Card</label>
          </div>
        </div>

        <!-- Affirm Pay Over Time -->
        <div class="e5CheckoutPaymentOption">
          <input
            type="radio"
            name="payment"
            id="affirm"
            value="affirm"
            v-model="selectedPaymentMethod"
            @change="handlePaymentMethodChange('affirm')"
            class="e5CheckoutRadio"
          />
          <label for="affirm" class="e5CheckoutPaymentLabel">
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span>Affirm Pay Over Time</span>
              <span style="font-size: 12px; color: #666;">As low as 0% APR with Affirm</span>
            </div>
            <img src="/assets/images/578fa0d18bbca3760015bb5ca95a185ccb50b0f2.webp" alt="Affirm" class="e5CheckoutAffirmLogo" />
          </label>
        </div>

        <!-- Affirm Promotional Message -->
        <div v-if="selectedPaymentMethod === 'affirm'" class="e5CheckoutAffirmPromo">
          <p
            class="affirm-as-low-as"
            :data-amount="Math.round(cartTotals.total * 100)"
            data-affirm-type="logo"
            data-affirm-color="blue"
          ></p>
          <p style="margin-top: 8px; font-size: 13px; color: #666;">
            Pay over time with Affirm. Get instant approval and flexible payment options.
          </p>
        </div>

      </div>

      <!-- Error Message -->
      <div v-if="errorMessage" class="e5CheckoutErrorMessage">
        {{ errorMessage }}
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="e5CheckoutSuccessMessage">
        {{ successMessage }}
      </div>

      <!-- Privacy Notice -->
      <p class="e5CheckoutPrivacyText">
        Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our <a :href="TERMS_ROUTE" class="e5CheckoutPrivacyLink">Terms and Conditions</a>.
      </p>

      <!-- Place Order Button -->
      <button
        @click="handlePlaceOrder"
        :disabled="isProcessing || isEmpty"
        class="e5CheckoutPlaceOrderBtn"
        :class="{ 'e5CheckoutPlaceOrderBtnDisabled': isProcessing || isEmpty }"
      >
        {{ isProcessing ? 'PROCESSING...' : 'PLACE ORDER' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.e5StripeCardElement {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d5d5d5;
  border-radius: 4px;
  background: #ffffff;
  min-height: 44px;
  transition: border-color 0.2s ease;
}

.e5StripeCardElement:focus-within {
  border-color: #4a90e2;
  outline: none;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

.e5StripeCardElement--error {
  border-color: #d31d25 !important;
  background: #fff5f5;
}

.e5StripeCardError {
  color: #d31d25;
  font-family: 'Franklin Gothic Book', sans-serif;
  font-size: 12px;
  margin-top: 6px;
  display: block;
}

.e5CheckoutErrorMessage {
  padding: 12px 16px;
  background: #fee;
  border: 1px solid #d31d25;
  border-radius: 4px;
  color: #d31d25;
  font-family: 'Franklin Gothic Book', sans-serif;
  font-size: 14px;
  margin-top: 16px;
}

.e5CheckoutSuccessMessage {
  padding: 12px 16px;
  background: #efe;
  border: 1px solid #2d9;
  border-radius: 4px;
  color: #2d9;
  font-family: 'Franklin Gothic Book', sans-serif;
  font-size: 14px;
  margin-top: 16px;
}

.e5CheckoutPlaceOrderBtnDisabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.e5CheckoutPlaceOrderBtnDisabled:hover {
  background: #d31d25 !important;
}

.e5CheckoutAffirmPromo {
  padding: 16px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-top: 12px;
  font-family: 'Franklin Gothic Book', sans-serif;
}

.e5CheckoutAffirmPromo .affirm-as-low-as {
  font-size: 16px;
  font-weight: bold;
  color: #0a0a0a;
  margin: 0;
}
</style>
