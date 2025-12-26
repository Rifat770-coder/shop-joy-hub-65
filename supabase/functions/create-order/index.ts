import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Products catalog - server-side source of truth for prices
const products: Record<string, { name: string; price: number; image: string; category: string }> = {
  "1": {
    name: "Premium Wireless Headphones",
    price: 199.99,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    category: "Electronics",
  },
  "2": {
    name: "Smart Watch Pro",
    price: 349.99,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    category: "Electronics",
  },
  "3": {
    name: "Designer Leather Handbag",
    price: 159.99,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    category: "Fashion",
  },
  "4": {
    name: "Running Shoes Ultra",
    price: 129.99,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    category: "Sports",
  },
  "5": {
    name: "Organic Skincare Set",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
    category: "Beauty",
  },
  "6": {
    name: "Mechanical Keyboard RGB",
    price: 149.99,
    image: "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=400&h=400&fit=crop",
    category: "Electronics",
  },
  "7": {
    name: "Cozy Throw Blanket",
    price: 49.99,
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop",
    category: "Home & Garden",
  },
  "8": {
    name: "Bestseller Novel Collection",
    price: 39.99,
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
    category: "Books",
  },
};

interface OrderItem {
  productId: string;
  quantity: number;
}

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

interface CreateOrderRequest {
  items: OrderItem[];
  shippingAddress: string;
  couponCode?: string;
  shippingMethod?: ShippingMethod | null;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.log("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    // Parse request body
    const body: CreateOrderRequest = await req.json();
    const { items, shippingAddress, couponCode, shippingMethod } = body;

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "At least one item is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate shipping address
    if (!shippingAddress || typeof shippingAddress !== "string" || shippingAddress.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Valid shipping address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate and calculate order items with server-side prices
    const validatedItems: Array<{
      product: { id: string; name: string; price: number; image: string; category: string };
      quantity: number;
    }> = [];
    let subtotal = 0;

    for (const item of items) {
      // Validate product ID
      if (!item.productId || typeof item.productId !== "string") {
        return new Response(
          JSON.stringify({ error: "Invalid product ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate quantity
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
        return new Response(
          JSON.stringify({ error: `Invalid quantity for product ${item.productId}. Must be between 1 and 100.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Look up product in server-side catalog
      const product = products[item.productId];
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.productId}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Add to validated items with server-verified price
      validatedItems.push({
        product: {
          id: item.productId,
          name: product.name,
          price: product.price,
          image: product.image,
          category: product.category,
        },
        quantity,
      });

      subtotal += product.price * quantity;
    }

    console.log("Validated items:", validatedItems.length, "Subtotal:", subtotal);

    // Handle coupon if provided
    let discountAmount = 0;
    let couponId: string | null = null;

    if (couponCode && typeof couponCode === "string" && couponCode.trim().length > 0) {
      const { data: coupon, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_active", true)
        .single();

      if (couponError || !coupon) {
        console.log("Invalid coupon code:", couponCode);
        return new Response(
          JSON.stringify({ error: "Invalid or expired coupon code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Validate coupon dates
      const now = new Date();
      if (coupon.starts_at && new Date(coupon.starts_at) > now) {
        return new Response(
          JSON.stringify({ error: "Coupon is not yet valid" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (coupon.expires_at && new Date(coupon.expires_at) < now) {
        return new Response(
          JSON.stringify({ error: "Coupon has expired" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check max uses
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        return new Response(
          JSON.stringify({ error: "Coupon usage limit reached" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check minimum order
      if (coupon.minimum_order && subtotal < Number(coupon.minimum_order)) {
        return new Response(
          JSON.stringify({ error: `Minimum order of $${coupon.minimum_order} required for this coupon` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Calculate discount
      if (coupon.discount_type === "percentage") {
        discountAmount = subtotal * (Number(coupon.discount_value) / 100);
      } else {
        discountAmount = Number(coupon.discount_value);
      }

      // Cap discount at subtotal
      discountAmount = Math.min(discountAmount, subtotal);
      couponId = coupon.id;

      console.log("Applied coupon:", couponCode, "Discount:", discountAmount);
    }

    // Calculate final totals
    const subtotalAfterDiscount = subtotal - discountAmount;
    const tax = subtotalAfterDiscount * 0.1; // 10% tax
    const shippingCost = shippingMethod?.price || 0;
    const total = Math.round((subtotalAfterDiscount + tax + shippingCost) * 100) / 100;

    console.log("Final total:", total, "Tax:", tax, "Shipping:", shippingCost);

    // Create order with service role to bypass RLS
    const supabaseAdmin = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        items: validatedItems,
        total,
        status: "pending",
        shipping_address: shippingAddress.trim(),
        shipping_method: shippingMethod || null,
      })
      .select("id")
      .single();

    if (orderError) {
      console.error("Error creating order:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order created:", order.id);

    // Increment coupon usage if used
    if (couponId) {
      const { error: couponUpdateError } = await supabaseAdmin.rpc("increment_coupon_usage", {
        coupon_id: couponId,
      });

      if (couponUpdateError) {
        console.error("Error updating coupon usage:", couponUpdateError);
        // Don't fail the order for coupon update failure
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        subtotal,
        discount: discountAmount,
        tax,
        total,
        itemCount: validatedItems.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
