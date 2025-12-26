-- Create store_settings table
CREATE TABLE public.store_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (for checkout/shipping display)
CREATE POLICY "Anyone can read settings" 
ON public.store_settings 
FOR SELECT 
USING (true);

-- Admins can manage settings
CREATE POLICY "Admins can manage settings" 
ON public.store_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_store_settings_updated_at
BEFORE UPDATE ON public.store_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.store_settings (key, value) VALUES
('store', '{"storeName": "ShopHub", "storeEmail": "support@shophub.com", "storePhone": "+1 (555) 123-4567", "storeAddress": "123 Commerce Street, New York, NY 10001", "currency": "USD", "timezone": "America/New_York"}'::jsonb),
('shipping', '[{"id": "1", "name": "Standard Shipping", "price": 0, "estimatedDays": "5-7 business days", "enabled": true}, {"id": "2", "name": "Express Shipping", "price": 9.99, "estimatedDays": "2-3 business days", "enabled": true}, {"id": "3", "name": "Overnight Shipping", "price": 24.99, "estimatedDays": "1 business day", "enabled": true}, {"id": "4", "name": "International Shipping", "price": 29.99, "estimatedDays": "10-14 business days", "enabled": false}]'::jsonb),
('tax', '{"enableTax": true, "taxRate": 10, "taxName": "Sales Tax", "includeTaxInPrice": false}'::jsonb);