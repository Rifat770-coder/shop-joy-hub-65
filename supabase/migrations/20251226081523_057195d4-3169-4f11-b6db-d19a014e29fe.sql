-- Drop existing SELECT policies on orders
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

-- Recreate with explicit authentication requirement
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'));