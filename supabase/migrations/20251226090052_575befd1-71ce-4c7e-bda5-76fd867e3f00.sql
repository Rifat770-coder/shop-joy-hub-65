-- Add shipping_method column to orders table
ALTER TABLE public.orders 
ADD COLUMN shipping_method JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.orders.shipping_method IS 'Stores shipping option: {id, name, price, estimatedDays}';