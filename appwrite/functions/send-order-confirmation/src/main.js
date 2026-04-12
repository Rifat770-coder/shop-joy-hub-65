export default async ({ req, res, log, error }) => {
  try {
    const {
      orderId,
      customerEmail,
      customerName,
      items,
      subtotal,
      discount = 0,
      tax,
      taxName = 'Tax',
      shippingCost = 0,
      shippingMethodName = 'Standard',
      total,
      shippingAddress,
    } = JSON.parse(req.body);

    log(`Sending order confirmation to ${customerEmail} for order ${orderId}`);

    // Build items HTML
    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <img src="${item.product.image}" alt="${item.product.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />
              <div>
                <p style="margin: 0; font-weight: 500; color: #1f2937;">${item.product.name}</p>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 14px;">Qty: ${item.quantity}</p>
              </div>
            </div>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">
            $${(item.product.price * item.quantity).toFixed(2)}
          </td>
        </tr>
      `
      )
      .join("");

    const discountHtml = discount > 0 
      ? `<tr>
          <td style="padding: 8px 0; color: #059669;">Discount</td>
          <td style="padding: 8px 0; text-align: right; color: #059669;">-$${discount.toFixed(2)}</td>
        </tr>`
      : '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Confirmation</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px 12px 0 0; padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px;">Order Confirmed! 🎉</h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Thank you for your purchase</p>
            </div>

            <!-- Main Content -->
            <div style="background: white; padding: 32px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                Hi ${customerName || 'there'},
              </p>
              <p style="margin: 0 0 24px; color: #374151; font-size: 16px;">
                We've received your order and it's being processed. Here's a summary of your purchase:
              </p>

              <!-- Order ID -->
              <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Order ID</p>
                <p style="margin: 4px 0 0; color: #1f2937; font-size: 18px; font-weight: 600; font-family: monospace;">${orderId.slice(0, 8).toUpperCase()}</p>
              </div>

              <!-- Items -->
              <h3 style="margin: 0 0 16px; color: #1f2937; font-size: 18px;">Order Items</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Order Summary -->
              <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <table style="width: 100%;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Subtotal</td>
                    <td style="padding: 8px 0; text-align: right;">$${subtotal.toFixed(2)}</td>
                  </tr>
                  ${discountHtml}
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">Shipping (${shippingMethodName})</td>
                    <td style="padding: 8px 0; text-align: right;${shippingCost === 0 ? ' color: #059669;' : ''}">
                      ${shippingCost === 0 ? 'Free' : '$' + shippingCost.toFixed(2)}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280;">${taxName}</td>
                    <td style="padding: 8px 0; text-align: right;">$${tax.toFixed(2)}</td>
                  </tr>
                  <tr style="border-top: 2px solid #e5e7eb;">
                    <td style="padding: 16px 0 8px; font-weight: 600; font-size: 18px; color: #1f2937;">Total</td>
                    <td style="padding: 16px 0 8px; text-align: right; font-weight: 600; font-size: 18px; color: #6366f1;">$${total.toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              <!-- Shipping Address -->
              <h3 style="margin: 0 0 12px; color: #1f2937; font-size: 18px;">Shipping Address</h3>
              <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #374151; white-space: pre-line; line-height: 1.6;">${shippingAddress}</p>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 12px; color: #6b7280; font-size: 14px;">
                  Questions? Reply to this email or contact our support team.
                </p>
                <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                  © ${new Date().getFullYear()} RealGadget BD. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

<<<<<<< Updated upstream:supabase/functions/send-order-confirmation/index.ts
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "ShopHub <noreply@easytobuy.fashion>",
        to: [customerEmail],
        subject: `Order Confirmed - #${orderId.slice(0, 8).toUpperCase()}`,
        html: emailHtml,
      }),
=======
    // In a real implementation, you would use an email service like Resend, SendGrid, etc.
    // For now, we'll just log the email content
    log('Email HTML generated successfully');
    log('Email would be sent to:', customerEmail);

    return res.json({ 
      success: true, 
      message: 'Order confirmation email prepared',
      emailPreview: emailHtml.substring(0, 200) + '...'
>>>>>>> Stashed changes:appwrite/functions/send-order-confirmation/src/main.js
    });
  } catch (err) {
    error('Error in send-order-confirmation function:', err);
    return res.json({ error: err.message }, 500);
  }
};