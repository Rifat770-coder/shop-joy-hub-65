import { useState, useEffect, useCallback } from 'react';
import { databases, functions, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Order, OrderItem } from '@/integrations/appwrite/types';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Query } from 'appwrite';

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
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [
          Query.equal('userId', user.$id),
          Query.orderDesc('$createdAt')
        ]
      );
      
      setOrders(response.documents as Order[]);
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
    items: OrderItem[], 
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

      // Use Appwrite function for order creation
      const response = await functions.createExecution(
        'create-order', // Function ID
        JSON.stringify({
          items: orderItems,
          shippingAddress,
          couponCode,
        }),
        false, // async
        '/', // path
        'POST' // method
      );

      const result = JSON.parse(response.responseBody);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create order');
      }

      // Fetch the created order
      const orderResponse = await databases.getDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        result.orderId
      );

      const newOrder = orderResponse as Order;
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
