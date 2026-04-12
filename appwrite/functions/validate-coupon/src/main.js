import { Client, Databases, Query } from 'node-appwrite';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTIONS = {
  COUPONS: 'coupons',
};

export default async ({ req, res, log, error }) => {
  try {
    // Parse request body
    const { code, orderTotal } = JSON.parse(req.body);

    // Validate inputs
    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return res.json({
        valid: false,
        message: 'Coupon code is required',
      });
    }

    if (!orderTotal || typeof orderTotal !== 'number' || orderTotal <= 0) {
      return res.json({
        valid: false,
        message: 'Valid order total is required',
      });
    }

    log('Validating coupon:', code, 'for order total:', orderTotal);

    // Find coupon in database
    const couponResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.COUPONS,
      [
        Query.equal('code', code.trim().toUpperCase()),
        Query.equal('isActive', true)
      ]
    );

    if (couponResponse.documents.length === 0) {
      return res.json({
        valid: false,
        message: 'Invalid or expired coupon code',
      });
    }

    const coupon = couponResponse.documents[0];

    // Validate coupon dates
    const now = new Date();
    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      return res.json({
        valid: false,
        message: 'Coupon is not yet valid',
      });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      return res.json({
        valid: false,
        message: 'Coupon has expired',
      });
    }

    // Check max uses
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      return res.json({
        valid: false,
        message: 'Coupon usage limit reached',
      });
    }

    // Check minimum order
    if (coupon.minimumOrder && orderTotal < Number(coupon.minimumOrder)) {
      return res.json({
        valid: false,
        message: `Minimum order of $${coupon.minimumOrder} required for this coupon`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = orderTotal * (Number(coupon.discountValue) / 100);
    } else {
      discountAmount = Number(coupon.discountValue);
    }

    // Cap discount at order total
    discountAmount = Math.min(discountAmount, orderTotal);

    log('Coupon validated successfully. Discount:', discountAmount);

    return res.json({
      valid: true,
      message: 'Coupon is valid',
      couponId: coupon.$id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount: Math.round(discountAmount * 100) / 100,
    });
  } catch (err) {
    error('Unexpected error:', err);
    return res.json({
      valid: false,
      message: 'An error occurred while validating the coupon',
    });
  }
};