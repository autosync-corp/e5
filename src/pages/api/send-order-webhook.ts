import type { APIRoute } from 'astro';
import { Redis } from '@upstash/redis';
import { sendFbPurchaseEvent } from '@/core/utils/fbConversions';

// Mark this page as server-rendered
export const prerender = false;

const ghlWebhookUrl = import.meta.env.GHL_WEBHOOK_URL || 'https://services.leadconnectorhq.com/hooks/KqlpMLqMB6avqxiT2xPx/webhook-trigger/68181ce2-c728-4127-9f12-87c621adf287';

let redis: Redis | null = null;
try {
  if (import.meta.env.KV_REST_API_URL && import.meta.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: import.meta.env.KV_REST_API_URL,
      token: import.meta.env.KV_REST_API_TOKEN,
    });
  }
} catch {
  // Redis unavailable — order numbers will fall back to timestamp
}

const ORDER_COUNTER_KEY = 'e5:order-counter';

async function getNextOrderNumber(): Promise<string> {
  if (!redis) return Date.now().toString().slice(-6);
  try {
    const orderNumber = await redis.incr(ORDER_COUNTER_KEY);
    return orderNumber.toString();
  } catch {
    return Date.now().toString().slice(-6);
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Send order webhook API endpoint called');

    const body = await request.json();
    const { chargeId, paymentMethod, cartItems, customerData, vehicle, vehicleDisplay, totals } = body;

    console.log('Received data:', { chargeId, paymentMethod, cartItems: cartItems?.length });

    if (!chargeId || !paymentMethod || !cartItems || !customerData) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate sequential order number from Upstash counter
    const orderNumber = await getNextOrderNumber();

    // Build webhook data
    const webhookData = {
      // Order Information
      orderId: chargeId,
      orderNumber: orderNumber,
      orderDate: new Date().toISOString(),
      orderDateFormatted: new Date().toLocaleString('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
      }),

      // Vehicle Information
      vehicle: vehicle ? {
        year: vehicle.Year,
        make: vehicle.Make,
        model: vehicle.Model,
        trim: vehicle.Submodel,
        fullName: `${vehicle.Year} ${vehicle.Make} ${vehicle.Model} ${vehicle.Submodel}`,
        displayName: vehicleDisplay || vehicle.displayName || `${vehicle.Year} ${vehicle.Make} ${vehicle.Model} ${vehicle.Submodel}`,
      } : null,

      // Customer Information
      customer: {
        firstName: customerData.billing.firstName,
        lastName: customerData.billing.lastName,
        fullName: `${customerData.billing.firstName} ${customerData.billing.lastName}`,
        email: customerData.billing.emailAddress,
        phone: customerData.billing.phoneNumber,
        company: customerData.billing.companyName,
      },

      // Billing Address
      billingAddress: {
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
      },

      // Shipping Address
      shippingAddress: customerData.shipping ? {
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
      } : {
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
      },

      // Order Notes
      orderNotes: customerData.orderNotes || '',

      // Products/Items
      items: cartItems.map((item: any, index: number) => {
        // Build complete finish name
        const finishParts: string[] = [];
        if (item.product.ShortFinish) finishParts.push(item.product.ShortFinish);
        else if (item.product.Finish) finishParts.push(item.product.Finish);
        if (item.product.ShortColor) finishParts.push(item.product.ShortColor);
        else if (item.product.Color) finishParts.push(item.product.Color);
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
          itemSubtotal: (item.quantity * item.product.Price).toFixed(2),
          itemSubtotalFormatted: `$${(item.quantity * item.product.Price).toFixed(2)}`,
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
      items_html: generateItemsHtml(cartItems, totals),

      // Order Totals
      subtotal: (totals.subtotal).toFixed(2),
      subtotalFormatted: `$${(totals.subtotal).toFixed(2)}`,
      discount: totals.discount > 0 ? totals.discount.toFixed(2) : null,
      discountFormatted: totals.discount > 0 ? `-$${totals.discount.toFixed(2)}` : null,
      couponCode: totals.couponCode || null,
      couponType: totals.couponInfo?.type || null,
      couponDiscount: totals.couponInfo?.discount || null,
      tax: (totals.tax).toFixed(2),
      taxFormatted: `$${(totals.tax).toFixed(2)}`,
      taxRate: totals.tax > 0 ? '7%' : null,
      shipping: '0.00',
      shippingFormatted: '$0.00 (Free Shipping)',
      orderTotal: (totals.total).toFixed(2),
      orderTotalFormatted: `$${(totals.total).toFixed(2)}`,
      orderTotalCents: Math.round(totals.total * 100),

      // Payment Information
      payment: {
        paymentId: chargeId,
        paymentIntentId: chargeId,
        paymentMethod: paymentMethod,
        paymentMethodType: paymentMethod.toLowerCase(),
        paymentStatus: 'succeeded',
        paymentProcessor: paymentMethod,
        currency: 'USD',
        amountPaid: (totals.total).toFixed(2),
        amountPaidCents: Math.round(totals.total * 100),
      },

      // Summary
      summary: {
        itemCount: cartItems.length,
        totalWheels: cartItems.reduce((sum: number, item: any) => sum + item.frontWheels + item.rearWheels, 0),
        productNames: cartItems.map((item: any) => item.product.Model).join(', '),
      },

      // Metadata
      metadata: {
        source: 'E5 Wheels Website',
        sourceUrl: new URL(request.url).origin,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('Sending webhook data to GHL...');

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

    console.log('✅ Webhook sent successfully to GHL');

    // Fire Facebook Conversions API purchase event
    await sendFbPurchaseEvent({
      orderNumber: webhookData.orderNumber,
      total: webhookData.orderTotal,
      email: webhookData.customer?.email,
      phone: webhookData.customer?.phone,
      firstName: webhookData.customer?.firstName,
      lastName: webhookData.customer?.lastName,
      sourceUrl: new URL(request.url).origin + '/checkout',
    });

    // Save order summary for admin panel
    try {
      const origin = new URL(request.url).origin;
      await fetch(`${origin}/api/save-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNumber: webhookData.orderNumber,
          orderDate: webhookData.orderDate,
          customer: webhookData.customer,
          vehicle: webhookData.vehicle?.displayName || webhookData.vehicle?.fullName || null,
          items: webhookData.items.map((item: any) => ({
            model: item.productModel,
            finish: item.finish,
            config: item.configuration,
            size: item.size,
          })),
          total: webhookData.orderTotal,
          paymentMethod: webhookData.payment.paymentMethod,
        }),
      });
    } catch {
      // Non-critical
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Webhook sending error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to send webhook' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

function generateItemsHtml(cartItems: any[], totals: any): string {
  const rows = cartItems.map((item: any) => {
    const finishParts: string[] = [];
    if (item.product.ShortFinish) finishParts.push(item.product.ShortFinish);
    else if (item.product.Finish) finishParts.push(item.product.Finish);
    if (item.product.ShortColor) finishParts.push(item.product.ShortColor);
    else if (item.product.Color) finishParts.push(item.product.Color);
    if (item.product.Accent) finishParts.push(item.product.Accent);
    const finishName = finishParts.length > 0 ? finishParts.join(' ') : 'Standard';
    const partNumber = item.product.Pn || item.product.Id || `${item.product.Model}-${item.product.Diameter}x${item.product.Width}`;
    const configuration = item.frontWheels > 0 && item.rearWheels > 0
      ? `${item.frontWheels} Front + ${item.rearWheels} Rear`
      : item.frontWheels > 0
        ? `${item.frontWheels} Front`
        : `${item.rearWheels} Rear`;
    const itemTotal = item.quantity * item.product.Price;

    const vehicleInfo = item.vehicleModel ? `<br/><span style="color: #c41e3a; font-size: 13px; font-weight: 600;">FOR: ${item.vehicleModel}</span>` : '';

    return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px;">
          <strong>${item.product.Model}</strong><br/>
          <span style="color: #666; font-size: 13px;">${finishName}</span><br/>
          <span style="color: #666; font-size: 13px;">${item.product.Diameter}"x${item.product.Width}"</span>${vehicleInfo}
        </td>
        <td style="padding: 12px; color: #666;">${partNumber}</td>
        <td style="padding: 12px; text-align: center;">${configuration}</td>
        <td style="padding: 12px; text-align: right;">$${item.product.Price.toFixed(2)}</td>
        <td style="padding: 12px; text-align: right;"><strong>$${itemTotal.toFixed(2)}</strong></td>
      </tr>
    `;
  }).join('');

  return `
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
        ${rows}
      </tbody>
      <tfoot>
        <tr style="border-top: 2px solid #ddd;">
          <td colspan="4" style="padding: 12px; text-align: right;"><strong>Subtotal:</strong></td>
          <td style="padding: 12px; text-align: right;"><strong>$${totals.subtotal.toFixed(2)}</strong></td>
        </tr>
        ${totals.discount > 0 ? `
        <tr style="color: #16a34a;">
          <td colspan="4" style="padding: 12px; text-align: right;">Discount (${totals.couponCode}):</td>
          <td style="padding: 12px; text-align: right;">-$${totals.discount.toFixed(2)}</td>
        </tr>` : ''}
        <tr>
          <td colspan="4" style="padding: 12px; text-align: right;">Tax${totals.tax > 0 ? ' (7%)' : ''}:</td>
          <td style="padding: 12px; text-align: right;">$${totals.tax.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="4" style="padding: 12px; text-align: right;">Shipping:</td>
          <td style="padding: 12px; text-align: right;">FREE</td>
        </tr>
        <tr style="background-color: #f5f5f5; border-top: 2px solid #ddd;">
          <td colspan="4" style="padding: 12px; text-align: right; font-size: 16px;"><strong>Order Total:</strong></td>
          <td style="padding: 12px; text-align: right; font-size: 16px;"><strong>$${totals.total.toFixed(2)}</strong></td>
        </tr>
      </tfoot>
    </table>
  `.trim();
}
