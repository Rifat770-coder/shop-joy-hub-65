import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CartItem } from '@/types';

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: string;
  shipping_address: string;
  created_at: string;
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type the data properly
      const typedOrders: Order[] = (data || []).map((order) => ({
        id: order.id,
        items: (order.items as unknown as CartItem[]) || [],
        total: Number(order.total),
        status: order.status,
        shipping_address: order.shipping_address,
        created_at: order.created_at,
      }));
      
      setOrders(typedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = async (
    items: CartItem[], 
    shippingAddress: string,
    couponCode?: string
  ) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to place an order.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      // Send only product IDs and quantities - prices validated server-side
      const orderItems = items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      // Use secure edge function for order creation
      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          items: orderItems,
          shippingAddress,
          couponCode,
        },
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Fetch the created order
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', data.orderId)
        .single();

      if (fetchError) throw fetchError;

      const newOrder: Order = {
        id: orderData.id,
        items: (orderData.items as unknown as CartItem[]) || [],
        total: Number(orderData.total),
        status: orderData.status,
        shipping_address: orderData.shipping_address,
        created_at: orderData.created_at,
      };

      setOrders((prev) => [newOrder, ...prev]);
      toast({
        title: 'Order placed!',
        description: 'Your order has been successfully placed.',
      });
      return newOrder;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to place order.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return { orders, loading, createOrder, refetch: fetchOrders };
}
