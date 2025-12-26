-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  image TEXT,
  category TEXT NOT NULL,
  rating NUMERIC DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Everyone can view products
CREATE POLICY "Anyone can view products" 
ON public.products 
FOR SELECT 
USING (true);

-- Admins can manage products
CREATE POLICY "Admins can manage products" 
ON public.products 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial products
INSERT INTO public.products (name, description, price, image, category, rating, reviews, stock, featured) VALUES
('Premium Wireless Headphones', 'Experience crystal-clear audio with our top-of-the-line wireless headphones featuring active noise cancellation.', 199.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop', 'Electronics', 4.8, 124, 50, true),
('Smart Watch Pro', 'Stay connected with this feature-packed smartwatch. Track your fitness, receive notifications, and more.', 299.99, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop', 'Electronics', 4.6, 89, 35, true),
('Leather Messenger Bag', 'Handcrafted genuine leather messenger bag perfect for work or casual outings.', 149.99, 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop', 'Fashion', 4.9, 56, 25, true),
('Running Shoes Ultra', 'Lightweight and comfortable running shoes designed for maximum performance.', 129.99, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop', 'Sports', 4.7, 203, 100, true),
('Organic Coffee Beans', 'Premium organic coffee beans sourced from sustainable farms around the world.', 24.99, 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop', 'Food', 4.5, 312, 200, false),
('Wireless Earbuds', 'Compact wireless earbuds with premium sound quality and long battery life.', 89.99, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop', 'Electronics', 4.4, 178, 75, false),
('Yoga Mat Premium', 'Extra-thick yoga mat with non-slip surface for comfortable workouts.', 45.99, 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop', 'Sports', 4.6, 145, 60, false),
('Stainless Steel Water Bottle', 'Double-walled insulated water bottle keeps drinks cold for 24 hours.', 34.99, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop', 'Home', 4.3, 89, 150, false);