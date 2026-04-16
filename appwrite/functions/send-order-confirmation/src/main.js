import nodemailer from 'nodemailer';

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
      customerEmail = '',
      customerName = 'Customer',
      items = [],
      subtotal = 0,
      discount = 0,
      shippingCost = 0,
      total = 0,
      shippingAddress = '',
      paymentMethod = 'cod',
    } = body;

    if (!customerEmail) {
      return res.json({ success: false, error: 'Customer email is required' }, 400);
    }

    log(`Sending order confirmation to ${customerEmail} for order ${orderId}`);

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (!gmailUser || !gmailPass) {
      error('Missing GMAIL_USER or GMAIL_APP_PASSWORD env variables');
      return res.json({ success: false, error: 'Email service not configured' }, 500);
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: gmailUser, pass: gmailPass },
    });

    // Build items rows
    const itemsHtml = items.map((item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
          <strong style="color:#1f2937;">${item.product?.name || 'Product'}</strong>
          <br/><span style="color:#6b7280;font-size:13px;">Qty: ${item.quantity}</span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;font-weight:600;">
          ${((item.product?.price || 0) * item.quantity).toFixed(0)} BDT
        </td>
      </tr>
    `).join('');

    const paymentLabel = { cod: '💵 Cash on Delivery', bkash: '📱 bKash', nagad: '📱 Nagad' }[paymentMethod] || paymentMethod.toUpperCase();

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="max-width:580px;margin:24px auto;padding:0 16px;">
    <div style="background:linear-gradient(135deg,#f97316,#ea580c);border-radius:12px 12px 0 0;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:26px;">✅ অর্ডার কনফার্ম হয়েছে!</h1>
      <p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:15px;">আপনার অর্ডারটি সফলভাবে গ্রহণ করা হয়েছে</p>
    </div>
    <div style="background:#fff;padding:28px 32px;border-radius:0 0 12px 12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      <p style="margin:0 0 20px;color:#374151;font-size:15px;">
        প্রিয় <strong>${customerName}</strong>,<br/>
        আপনার অর্ডারটি আমরা পেয়েছি এবং প্রক্রিয়া শুরু হয়েছে।
      </p>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0;color:#9a3412;font-size:13px;font-weight:600;">ORDER ID</p>
        <p style="margin:4px 0 0;color:#1f2937;font-size:20px;font-weight:700;font-family:monospace;">${orderId.slice(0, 8).toUpperCase()}</p>
        <p style="margin:4px 0 0;color:#6b7280;font-size:12px;">এই ID দিয়ে আপনার অর্ডার ট্র্যাক করুন</p>
      </div>
      <h3 style="margin:0 0 12px;color:#1f2937;font-size:16px;">অর্ডারের পণ্য</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
        <tbody>${itemsHtml}</tbody>
      </table>
      <div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">সাব টোটাল</td><td style="padding:6px 0;text-align:right;font-size:14px;">${subtotal.toFixed(0)} BDT</td></tr>
          ${discount > 0 ? `<tr><td style="padding:6px 0;color:#059669;font-size:14px;">ছাড়</td><td style="padding:6px 0;text-align:right;color:#059669;font-size:14px;">-${discount.toFixed(0)} BDT</td></tr>` : ''}
          <tr><td style="padding:6px 0;color:#6b7280;font-size:14px;">ডেলিভারি চার্জ</td><td style="padding:6px 0;text-align:right;font-size:14px;">${shippingCost === 0 ? 'Free' : shippingCost.toFixed(0) + ' BDT'}</td></tr>
          <tr style="border-top:2px solid #e5e7eb;">
            <td style="padding:12px 0 4px;font-weight:700;font-size:17px;color:#1f2937;">সর্বমোট</td>
            <td style="padding:12px 0 4px;text-align:right;font-weight:700;font-size:17px;color:#f97316;">${total.toFixed(0)} BDT</td>
          </tr>
        </table>
      </div>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:20px;">
        <p style="margin:0;color:#166534;font-size:14px;"><strong>পেমেন্ট পদ্ধতি:</strong> ${paymentLabel}</p>
      </div>
      <h3 style="margin:0 0 10px;color:#1f2937;font-size:16px;">📍 ডেলিভারি ঠিকানা</h3>
      <div style="background:#f9fafb;border-radius:8px;padding:14px 16px;margin-bottom:24px;">
        <p style="margin:0;color:#374151;white-space:pre-line;line-height:1.7;font-size:14px;">${shippingAddress}</p>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://realgadgetbd.com/track-order" style="display:inline-block;background:#f97316;color:#fff;font-weight:700;font-size:15px;padding:12px 32px;border-radius:8px;text-decoration:none;">
          🔍 অর্ডার ট্র্যাক করুন
        </a>
      </div>
      <div style="text-align:center;padding-top:20px;border-top:1px solid #e5e7eb;">
        <p style="margin:0 0 6px;color:#6b7280;font-size:13px;">কোনো সমস্যা হলে আমাদের সাথে যোগাযোগ করুন</p>
        <p style="margin:0;color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} RealGadget BD. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

    await transporter.sendMail({
      from: `"RealGadget BD" <${gmailUser}>`,
      to: customerEmail,
      subject: `✅ অর্ডার কনফার্ম - #${orderId.slice(0, 8).toUpperCase()} | RealGadget BD`,
      html: emailHtml,
    });

    log(`Email sent successfully to ${customerEmail}`);
    return res.json({ success: true, message: 'Order confirmation email sent' });

  } catch (err) {
    error('Error sending order confirmation:', err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
