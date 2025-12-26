-- Add admin policies for coupon management (requires future admin role setup)
-- For now, allow authenticated users to manage coupons (admin check can be added later)
CREATE POLICY "Authenticated users can manage coupons"
ON public.coupons
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create function to increment coupon usage
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = coupon_id;
END;
$$;