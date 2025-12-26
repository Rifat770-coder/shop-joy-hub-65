-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Anyone can read settings" ON public.store_settings;

-- Create a new policy that allows only authenticated users to read settings
CREATE POLICY "Authenticated users can read settings" 
ON public.store_settings 
FOR SELECT 
TO authenticated
USING (true);