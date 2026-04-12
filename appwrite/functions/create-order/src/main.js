import { Client, Databases, Query, ID } from 'node-appwrite';

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTIONS = {
  PRODUCTS: 'products',
  ORDERS: 'orders',
  COUPONS: 'coupons',
};

export default async ({ req, res, log, error }) => {
  try {
    // Parse request body
    const { items, shippingAddress, couponCode, shippingMethod } = JSON.parse(req.body);

    // Get user from headers (Appwrite automatically provides user context)
    const userId = req.headers['x-appwrite-user-id'];
    if (!userId) {
      return res.json({ error: 'Authentication required' }, 401);
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ error: 'At least one item is required' }, 400);
    }

    // Validate shipping address
    if (!shippingAddress || typeof shippingAddress !== 'string' || shippingAddress.trim().length < 10) {
      return res.json({ error: 'Valid shipping address is required' }, 400);
    }

    // Fetch all requested products from database
    const productIds = items.map(item => item.productId);
    const productsResponse = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PRODUCTS,
      [Query.equal('$id', productIds)]
    );

    const dbProducts = productsResponse.documents;
    const productMap = new Map(dbProducts.map(p => [p.$id, p]));

    // Validate and calculate order items with server-side prices
    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      // Validate product ID
      if (!item.productId || typeof item.productId !== 'string') {
        return res.json({ error: 'Invalid product ID' }, 400);
      }

      // Validate quantity
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        return res.json({ 
          error: `Invalid quantity for product ${item.productId}. Must be between 1 and 100.` 
        }, 400);
      }

      // Look up product in database
      const product = productMap.get(item.productId);
      if (!product) {
        return res.json({ error: `Product not found: ${item.productId}` }, 400);
      }

      // Check stock availability
      if (product.stock !== null && product.stock < quantity) {
        return res.json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}` 
        }, 400);
      }

      // Add to validated items with server-verified price
      validatedItems.push({
        product: {
          id: product.$id,
          name: product.name,
          price: Number(product.price),
          image: product.image || '',
          category: product.category,
        },
        quantity,
      });

      subtotal += Number(product.price) * quantity;
    }

    log('Validated items:', validatedItems.length, 'Subtotal:', subtotal);

    // Handle coupon if provided
    let discountAmount = 0;
    let couponId = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim().length > 0) {
      try {
        const couponResponse = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.COUPONS,
          [
            Query.equal('code', couponCode.trim().toUpperCase()),
            Query.equal('isActive', true)
          ]
        );

        if (couponResponse.documents.length === 0) {
          return res.json({ error: 'Invalid or expired coupon code' }, 400);
        }

        const coupon = couponResponse.documents[0];

        // Validate coupon dates
        const now = new Date();
        if (coupon.startsAt && new Date(coupon.startsAt) > now) {
          return res.json({ error: 'Coupon is not yet valid' }, 400);
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
          return res.json({ error: 'Coupon has expired' }, 400);
        }

        // Check max uses
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
          return res.json({ error: 'Coupon usage limit reached' }, 400);
        }

        // Check minimum order
        if (coupon.minimumOrder && subtotal < Number(coupon.minimumOrder)) {
          return res.json({ 
            error: `Minimum order of ${coupon.minimumOrder} required for this coupon` 
          }, 400);
        }

        // Calculate discount
        if (coupon.discountType === 'percentage') {
          discountAmount = subtotal * (Number(coupon.discountValue) / 100);
        } else {
          discountAmount = Number(coupon.discountValue);
        }

        // Cap discount at subtotal
        discountAmount = Math.min(discountAmount, subtotal);
        couponId = coupon.$id;

        log('Applied coupon:', couponCode, 'Discount:', discountAmount);
      } catch (couponError) {
        log('Coupon validation error:', couponError);
        return res.json({ error: 'Invalid or expired coupon code' }, 400);
      }
    }

    // Calculate final totals
    const subtotalAfterDiscount = subtotal - discountAmount;
    const tax = subtotalAfterDiscount * 0.1; // 10% tax
    const shippingCost = shippingMethod?.price || 0;
    const total = Math.round((subtotalAfterDiscount + tax + shippingCost) * 100) / 100;

    log('Final total:', total, 'Tax:', tax, 'Shipping:', shippingCost);

    // Create order
    const orderResponse = await databases.createDocument(
      DATABASE_ID,
      COLLECTIONS.ORDERS,
      ID.unique(),
      {
        userId: userId,
        items: validatedItems,
        total: total,
        status: 'pending',
        shippingAddress: shippingAddress.trim(),
        shippingMethod: shippingMethod || null,
      }
    );

    log('Order created:', orderResponse.$id);

    // Increment coupon usage if used
    if (couponId) {
      try {
        const coupon = await databases.getDocument(DATABASE_ID, COLLECTIONS.COUPONS, couponId);
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.COUPONS,
          couponId,
          { usedCount: coupon.usedCount + 1 }
        );
      } catch (couponUpdateError) {
        error('Error updating coupon usage:', couponUpdateError);
        // Don't fail the order for coupon update failure
      }
    }

    return res.json({
      success: true,
      orderId: orderResponse.$id,
      subtotal,
      discount: discountAmount,
      tax,
      total,
      itemCount: validatedItems.length,
    });
  } catch (err) {
    error('Unexpected error:', err);
    return res.json({ error: 'An unexpected error occurred' }, 500);
  }
};