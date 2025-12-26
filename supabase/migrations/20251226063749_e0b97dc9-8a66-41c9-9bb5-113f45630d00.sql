-- Replace the increment_coupon_usage function with proper authorization checks
-- Only admins OR authenticated users who are placing an order can increment coupon usage
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  coupon_record RECORD;
BEGIN
  -- Require authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get coupon details to validate
  SELECT * INTO coupon_record FROM public.coupons WHERE id = coupon_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Coupon not found';
  END IF;
  
  -- Check if coupon is active
  IF NOT coupon_record.is_active THEN
    RAISE EXCEPTION 'Coupon is not active';
  END IF;
  
  -- Check if coupon has expired
  IF coupon_record.expires_at IS NOT NULL AND coupon_record.expires_at < now() THEN
    RAISE EXCEPTION 'Coupon has expired';
  END IF;
  
  -- Check if coupon hasn't started yet
  IF coupon_record.starts_at IS NOT NULL AND coupon_record.starts_at > now() THEN
    RAISE EXCEPTION 'Coupon is not yet valid';
  END IF;
  
  -- Check max uses limit
  IF coupon_record.max_uses IS NOT NULL AND coupon_record.used_count >= coupon_record.max_uses THEN
    RAISE EXCEPTION 'Coupon usage limit reached';
  END IF;
  
  -- Increment the usage count
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = coupon_id;
END;
$$;