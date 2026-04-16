import { Client, Databases, Query, ID } from 'node-appwrite';

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTIONS = { PRODUCTS: 'products', ORDERS: 'orders', COUPONS: 'coupons' };

export default async ({ req, res, log, error }) => {
  try {
    // Safe body parse
    let body = {};
    try {
      body = req.body ? JSON.parse(req.body) : {};
    } catch {
      return res.json({ error: 'Invalid request body' }, 400);
    }

    const {
      items,
      shippingAddress,
      couponCode,
      shippingMethod,
      paymentMethod = 'cod',
      paymentStatus = 'pending',
      transactionId,
      guestName,
      guestPhone,
      discount: clientDiscount = 0,
    } = body;

    // Allow guest orders — userId optional
    const userId = req.headers['x-appwrite-user-id'] || 'guest';

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.json({ error: 'At least one item is required' }, 400);
    }

    if (!shippingAddress || typeof shippingAddress !== 'string' || shippingAddress.trim().length < 3) {
      return res.json({ error: 'Valid shipping address is required' }, 400);
    }

    // Fetch products
    const productIds = items.map(i => i.productId);
    const productsResponse = await databases.listDocuments(
      DATABASE_ID, COLLECTIONS.PRODUCTS, [Query.equal('$id', productIds)]
    );
    const productMap = new Map(productsResponse.documents.map(p => [p.$id, p]));

    const validatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        return res.json({ error: `Invalid quantity for product ${item.productId}` }, 400);
      }

      const product = productMap.get(item.productId);
      if (!product) {
        return res.json({ error: `Product not found: ${item.productId}` }, 400);
      }

      if (product.stock !== null && product.stock < quantity) {
        return res.json({ error: `Insufficient stock for ${product.name}. Available: ${product.stock}` }, 400);
      }

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

    // Coupon handling
    let discountAmount = Number(clientDiscount) || 0;
    let couponId = null;

    if (couponCode && typeof couponCode === 'string' && couponCode.trim().length > 0) {
      try {
        const couponResponse = await databases.listDocuments(
          DATABASE_ID, COLLECTIONS.COUPONS,
          [Query.equal('code', couponCode.trim().toUpperCase()), Query.equal('isActive', true)]
        );

        if (couponResponse.documents.length > 0) {
          const coupon = couponResponse.documents[0];
          const now = new Date();

          if ((!coupon.startsAt || new Date(coupon.startsAt) <= now) &&
              (!coupon.expiresAt || new Date(coupon.expiresAt) >= now) &&
              (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
              (!coupon.minimumOrder || subtotal >= Number(coupon.minimumOrder))) {

            if (coupon.discountType === 'percentage') {
              discountAmount = subtotal * (Number(coupon.discountValue) / 100);
            } else {
              discountAmount = Number(coupon.discountValue);
            }
            discountAmount = Math.min(discountAmount, subtotal);
            couponId = coupon.$id;
          }
        }
      } catch (couponError) {
        log('Coupon error (non-fatal):', couponError);
      }
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    const shippingCost = shippingMethod?.price || 0;
    const total = Math.round((subtotalAfterDiscount + shippingCost) * 100) / 100;

    log('Total:', total, 'Shipping:', shippingCost, 'Discount:', discountAmount);

    // Create order — items as JSON string for Appwrite
    const orderResponse = await databases.createDocument(
      DATABASE_ID, COLLECTIONS.ORDERS, ID.unique(),
      {
        userId,
        items: JSON.stringify(validatedItems),
        total,
        status: 'pending',
        paymentMethod,
        paymentStatus,
        transactionId: transactionId || null,
        shippingAddress: shippingAddress.trim(),
        shippingMethod: shippingMethod ? JSON.stringify(shippingMethod) : null,
      }
    );

    log('Order created:', orderResponse.$id);

    // Deduct stock
    for (const item of validatedItems) {
      try {
        const product = productMap.get(item.product.id);
        if (product && product.stock !== null) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, item.product.id, { stock: newStock });
          log(`Stock: ${item.product.name} ${product.stock} → ${newStock}`);
        }
      } catch (stockErr) {
        error('Stock update failed (non-fatal):', stockErr);
      }
    }

    // Increment coupon usage
    if (couponId) {
      try {
        const coupon = await databases.getDocument(DATABASE_ID, COLLECTIONS.COUPONS, couponId);
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.COUPONS, couponId, { usedCount: coupon.usedCount + 1 });
      } catch (e) { error('Coupon update failed:', e); }
    }

    return res.json({
      success: true,
      orderId: orderResponse.$id,
      subtotal,
      discount: discountAmount,
      tax: 0,
      total,
      itemCount: validatedItems.length,
    });

  } catch (err) {
    error('Unexpected error:', err.message || err);
    return res.json({ success: false, error: err.message || 'An unexpected error occurred' }, 500);
  }
};
