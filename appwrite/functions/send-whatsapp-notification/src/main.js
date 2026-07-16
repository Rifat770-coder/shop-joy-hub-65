/**
 * send-whatsapp-notification
 *
 * Sends a WhatsApp notification to the configured admin personal number
 * via the Meta WhatsApp Cloud API when a new order is placed.
 *
 * Environment variables (set in Appwrite console or .env for local dev):
 *   WHATSAPP_ACCESS_TOKEN        – Permanent access token from Meta
 *   WHATSAPP_PHONE_NUMBER_ID     – Phone number ID in Meta Business Manager
 *   ADMIN_WHATSAPP_NUMBER        – Admin's personal WhatsApp number (incl. country code, no +)
 *   WHATSAPP_API_VERSION         – e.g. v22.0
 *   WHATSAPP_ORDER_TEMPLATE_NAME  – Template name approved in Meta Business Manager
 *   WHATSAPP_ORDER_TEMPLATE_LANGUAGE – e.g. en
 */

export default async ({ req, res, log, error }) => {
  try {
    // Parse body safely
    let body = {};
    try {
      body = req.body ? JSON.parse(req.body) : {};
    } catch {
      body = {};
    }

    const {
      orderId = '',
      customerName = 'Customer',
      total = 0,
      paymentMethod = 'cod',
      shippingAddress = '',
      items = [],
    } = body;

    if (!orderId) {
      return res.json({ success: false, error: 'orderId is required' }, 400);
    }

    // Read WhatsApp config from environment
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const adminNumber = process.env.ADMIN_WHATSAPP_NUMBER;
    const apiVersion = process.env.WHATSAPP_API_VERSION || 'v22.0';
    const templateName = process.env.WHATSAPP_ORDER_TEMPLATE_NAME;
    const templateLanguage = process.env.WHATSAPP_ORDER_TEMPLATE_LANGUAGE || 'en';

    if (!accessToken || !phoneNumberId || !adminNumber) {
      error('Missing WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, or ADMIN_WHATSAPP_NUMBER');
      return res.json({ success: false, error: 'WhatsApp not configured' }, 500);
    }

    log('Sending WhatsApp notification to admin for order ' + orderId);

    // Build short address (first line, max 60 chars)
    const shortAddress = shippingAddress
      ? shippingAddress.split('\n')[0].slice(0, 60)
      : 'N/A';

    const paymentLabel = { cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad' }[paymentMethod] || paymentMethod.toUpperCase();

    // Build template parameters — exactly 5 core params for order notification
    // (The template in Meta Business Manager must match these exact params)
    const templateBodyParams = [
      { type: 'text', text: orderId.slice(0, 8).toUpperCase() },
      { type: 'text', text: customerName },
      { type: 'text', text: total.toFixed(0) + ' BDT' },
      { type: 'text', text: paymentLabel },
      { type: 'text', text: shortAddress },
    ];

    // Build the WhatsApp message payload
    const payload = {
      messaging_product: 'whatsapp',
      to: adminNumber,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: templateLanguage,
        },
        components: [
          {
            type: 'body',
            parameters: templateBodyParams,
          },
        ],
      },
    };

    const apiUrl = 'https://graph.facebook.com/' + apiVersion + '/' + phoneNumberId + '/messages';

    log('Calling WhatsApp API: ' + apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.json();

    if (!response.ok) {
      error('WhatsApp API error: ' + JSON.stringify(responseBody));
      return res.json({
        success: false,
        error: responseBody.error?.message || 'WhatsApp API request failed',
        details: responseBody,
      }, 500);
    }

    log('WhatsApp notification sent successfully for order ' + orderId);
    return res.json({
      success: true,
      message: 'WhatsApp notification sent to admin',
      whatsappMessageId: responseBody.messages?.[0]?.id || null,
    });

  } catch (err) {
    error('Error sending WhatsApp notification: ' + (err.message || err));
    return res.json({ success: false, error: err.message || 'Unexpected error' }, 500);
  }
};
