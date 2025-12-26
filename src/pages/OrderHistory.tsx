import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle, AlertCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  shipping_address: string;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: 'Pending', icon: Clock, color: 'bg-warning/10 text-warning border-warning/30' },
  processing: { label: 'Processing', icon: AlertCircle, color: 'bg-primary/10 text-primary border-primary/30' },
  shipped: { label: 'Shipped', icon: Truck, color: 'bg-info/10 text-info border-info/30' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'bg-success/10 text-success border-success/30' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-destructive/10 text-destructive border-destructive/30' },
};

const OrderHistory = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
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

        // Parse items from jsonb - cast through unknown for type safety
        const parsedOrders = (data || []).map((order) => ({
          ...order,
          items: Array.isArray(order.items) 
            ? (order.items as unknown as OrderItem[]) 
            : [],
        })) as Order[];

        setOrders(parsedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || statusConfig.pending;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to view orders</h1>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to view your order history.
            </p>
            <Link to="/auth">
              <Button>Sign In</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Order History</h1>
            <p className="text-muted-foreground">
              View and track all your past orders
            </p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't placed any orders. Start shopping to see your orders here!
              </p>
              <Link to="/products">
                <Button>Browse Products</Button>
              </Link>
            </div>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;

                return (
                  <AccordionItem
                    key={order.id}
                    value={order.id}
                    className="bg-card border border-border rounded-xl overflow-hidden"
                  >
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-secondary/50">
                      <div className="flex flex-1 items-center justify-between pr-4">
                        <div className="text-left">
                          <p className="font-medium">
                            Order #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold">
                            ${Number(order.total).toFixed(2)}
                          </span>
                          <Badge
                            variant="outline"
                            className={`gap-1 ${statusInfo.color}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6">
                      <Separator className="mb-4" />

                      {/* Order Items */}
                      <div className="space-y-4 mb-6">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                          Items
                        </h4>
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-3 bg-secondary/30 rounded-lg"
                          >
                            <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={item.product?.image || '/placeholder.svg'}
                                alt={item.product?.name || 'Product'}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/products/${item.product?.id}`}
                                className="font-medium hover:text-primary transition-colors line-clamp-1"
                              >
                                {item.product?.name || 'Unknown Product'}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">
                              ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Shipping Address */}
                      <div className="mb-6">
                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                          Shipping Address
                        </h4>
                        <p className="text-sm bg-secondary/30 p-3 rounded-lg">
                          {order.shipping_address}
                        </p>
                      </div>

                      {/* Order Summary */}
                      <div className="flex justify-between items-center pt-4 border-t border-border">
                        <span className="font-medium">Total</span>
                        <span className="text-xl font-bold text-primary">
                          ${Number(order.total).toFixed(2)}
                        </span>
                      </div>

                      {/* Track Order Button */}
                      <div className="mt-4 pt-4 border-t border-border">
                        <Link to={`/orders/${order.id}`}>
                          <Button className="w-full gap-2">
                            <Truck className="h-4 w-4" />
                            Track Order
                          </Button>
                        </Link>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderHistory;
