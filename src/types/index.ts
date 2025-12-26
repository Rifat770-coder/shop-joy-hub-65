export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  originalPrice?: number;
  image: string | null;
  category: string;
  rating: number;
  reviews: number;
  stock: number;
  featured?: boolean;
  created_at?: string;
  updated_at?: string;
  // Legacy field for compatibility
  createdAt?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  productCount: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}
