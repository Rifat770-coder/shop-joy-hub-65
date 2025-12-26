import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CartItem } from '@/types';
import { Json } from '@/integrations/supabase/types';

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

  const createOrder = async (items: CartItem[], total: number, shippingAddress: string) => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to place an order.',
        variant: 'destructive',
      });
      return null;
    }

    try {
      // Convert items to Json-compatible format
      const itemsJson = items.map(item => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
          category: item.product.category,
        },
        quantity: item.quantity,
      })) as unknown as Json;

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          items: itemsJson,
          total,
          shipping_address: shippingAddress,
        })
        .select()
        .single();

      if (error) throw error;

      const newOrder: Order = {
        id: data.id,
        items: (data.items as unknown as CartItem[]) || [],
        total: Number(data.total),
        status: data.status,
        shipping_address: data.shipping_address,
        created_at: data.created_at,
      };

      setOrders((prev) => [newOrder, ...prev]);
      toast({
        title: 'Order placed!',
        description: 'Your order has been successfully placed.',
      });
      return newOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to place order.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return { orders, loading, createOrder, refetch: fetchOrders };
}
