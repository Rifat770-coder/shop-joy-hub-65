-- Drop the public read policy that exposes coupon codes
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;

-- Create a secure RPC function to validate coupons without exposing all coupon data
CREATE OR REPLACE FUNCTION public.validate_coupon_code(p_code TEXT, p_order_total NUMERIC)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_discount NUMERIC;
BEGIN
  -- Lookup coupon by code (case insensitive)
  SELECT * INTO v_coupon FROM coupons 
  WHERE code = UPPER(TRIM(p_code)) AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'message', 'Invalid coupon code');
  END IF;
  
  -- Check if coupon has started
  IF v_coupon.starts_at IS NOT NULL AND v_coupon.starts_at > NOW() THEN
    RETURN json_build_object('valid', false, 'message', 'This coupon is not yet active');
  END IF;
  
  -- Check if coupon has expired
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN json_build_object('valid', false, 'message', 'This coupon has expired');
  END IF;
  
  -- Check usage limit
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.used_count >= v_coupon.max_uses THEN
    RETURN json_build_object('valid', false, 'message', 'This coupon has reached its usage limit');
  END IF;
  
  -- Check minimum order
  IF p_order_total < v_coupon.minimum_order THEN
    RETURN json_build_object(
      'valid', false, 
      'message', 'Minimum order of $' || v_coupon.minimum_order::TEXT || ' required'
    );
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := (p_order_total * v_coupon.discount_value) / 100;
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_order_total);
  END IF;
  
  -- Return valid result with only necessary info (not the full coupon details)
  RETURN json_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'discount_amount', v_discount,
    'message', 'Coupon applied successfully'
  );
END;
$$;