import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Package, Clock, CheckCircle, Truck, XCircle, AlertCircle, MapPin, ArrowLeft, RefreshCw, Calendar } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { databases, realtime, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { addDays, format } from 'date-fns';
import { useCurrency } from '@/hooks/useCurrency';

interface OrderItem {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
  };
  quantity: number;
}

interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  refunded_amount: number;
  refund_reason: string;
  shipping_address: string;
  shipping_method: ShippingMethod | null;
  created_at: string;
  updated_at: string;
}

const normalizeOrder = (raw: Record<string, unknown>): Order => {
  const rawItems = raw.items;
  let parsedItems: OrderItem[] = [];

  if (Array.isArray(rawItems)) {
    parsedItems = rawItems as OrderItem[];
  } else if (typeof rawItems === 'string') {
    try {
      const candidate = JSON.parse(rawItems);
      if (Array.isArray(candidate)) {
        parsedItems = candidate as OrderItem[];
      }
    } catch {
      parsedItems = [];
    }
  }

  const rawShippingMethod =
    (raw.shipping_method as ShippingMethod | string | null | undefined) ??
    (raw.shippingMethod as ShippingMethod | string | null | undefined);

  let shippingMethod: ShippingMethod | null = null;
  if (rawShippingMethod && typeof rawShippingMethod === 'object') {
    shippingMethod = rawShippingMethod as ShippingMethod;
  } else if (typeof rawShippingMethod === 'string') {
    try {
      shippingMethod = JSON.parse(rawShippingMethod) as ShippingMethod;
    } catch {
      shippingMethod = null;
    }
  }

  return {
    id: (raw.$id as string) || (raw.id as string),
    items: parsedItems,
    total: Number(raw.total || 0),
    status: (raw.status as string) || 'pending',
    payment_method: ((raw.paymentMethod as string) || (raw.payment_method as string) || 'cod').toLowerCase(),
    payment_status: ((raw.paymentStatus as string) || (raw.payment_status as string) || 'pending').toLowerCase(),
    refunded_amount: Number((raw.refundedAmount as number) || (raw.refunded_amount as number) || 0),
    refund_reason: (raw.refundReason as string) || (raw.refund_reason as string) || '',
    shipping_address: (raw.shipping_address as string) || (raw.shippingAddress as string) || '',
    shipping_method: shippingMethod,
    created_at: (raw.created_at as string) || (raw.$createdAt as string) || new Date().toISOString(),
    updated_at: (raw.updated_at as string) || (raw.$updatedAt as string) || new Date().toISOString(),
  };
};

const paymentStatusColor: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground border-border',
  authorized: 'bg-info/10 text-info border-info/30',
  paid: 'bg-success/10 text-success border-success/30',
  failed: 'bg-destructive/10 text-destructive border-destructive/30',
  refunded: 'bg-warning/10 text-warning border-warning/30',
};

const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

const statusConfig: Record<string, { label: string; icon: React.ElementType; description: string }> = {
  pending: { 
    label: 'Order Placed', 
    icon: Clock, 
    description: 'Your order has been received and is awaiting processing'
  },
  processing: { 
    label: 'Processing', 
    icon: AlertCircle, 
    description: 'Your order is being prepared for shipment'
  },
  shipped: { 
    label: 'Shipped', 
    icon: Truck, 
    description: 'Your order is on its way to you'
  },
  delivered: { 
    label: 'Delivered', 
    icon: CheckCircle, 
    description: 'Your order has been delivered successfully'
  },
  cancelled: { 
    label: 'Cancelled', 
    icon: XCircle, 
    description: 'This order has been cancelled'
  },
};

const OrderTracking = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) {
        setError('Order ID not provided');
        setLoading(false);
        return;
      }

      try {
        const data = (await databases.getDocument(
          DATABASE_ID,
          COLLECTIONS.ORDERS,
          id
        )) as unknown as Record<string, unknown>;

        if (!data) {
          setError('Order not found');
          setLoading(false);
          return;
        }

        // Check if the order belongs to the current user
        const orderUserId = (data.userId as string) || (data.user_id as string);
        if (user && orderUserId && orderUserId !== user.$id) {
          setError('You do not have permission to view this order');
          setLoading(false);
          return;
        }

        setOrder(normalizeOrder(data));
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, user]);

  // Real-time subscription for order updates
  useEffect(() => {
    if (!id) return;

    const subscription = realtime.subscribe(
      `databases.${DATABASE_ID}.collections.${COLLECTIONS.ORDERS}.documents.${id}`,
      (response) => {
        if (response.events.includes('databases.*.collections.*.documents.*.update')) {
          const updatedData = response.payload;
          setOrder((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              status: updatedData.status,
              updated_at: updatedData.$updatedAt,
            };
          });
          toast({
            title: 'Order Updated',
            description: `Order status changed to ${statusConfig[updatedData.status]?.label || updatedData.status}`,
          });
        }
      }
    );

    return () => {
      if (typeof subscription === 'function') {
        subscription();
      } else if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, [id]);

  const getCurrentStepIndex = (status: string) => {
    if (status === 'cancelled') return -1;
    return statusSteps.indexOf(status);
  };

  // Calculate estimated delivery date from shipping method
  const getEstimatedDeliveryDate = () => {
    if (!order?.shipping_method?.estimatedDays) return null;
    
    const orderDate = new Date(order.created_at);
    const daysText = order.shipping_method.estimatedDays;
    
    // Parse "5-7 business days" or "1 business day" format
    const match = daysText.match(/(\d+)(?:-(\d+))?/);
    if (!match) return null;
    
    const minDays = parseInt(match[1], 10);
    const maxDays = match[2] ? parseInt(match[2], 10) : minDays;
    
    const minDate = addDays(orderDate, minDays);
    const maxDate = addDays(orderDate, maxDays);
    
    if (minDays === maxDays) {
      return format(minDate, 'MMMM d, yyyy');
    }
    
    return `${format(minDate, 'MMM d')} - ${format(maxDate, 'MMM d, yyyy')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container max-w-4xl">
            <Skeleton className="h-8 w-48 mb-4" />
            <Skeleton className="h-4 w-32 mb-8" />
            <div className="bg-card border border-border rounded-xl p-6">
              <Skeleton className="h-24 w-full mb-6" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">{error || 'Order not found'}</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't find the order you're looking for.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/orders">
                <Button variant="outline">View All Orders</Button>
              </Link>
              <Link to="/products">
                <Button>Continue Shopping</Button>
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const currentStepIndex = getCurrentStepIndex(order.status);
  const isCancelled = order.status === 'cancelled';
  const estimatedDelivery = getEstimatedDeliveryDate();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-4xl">
          {/* Back Button */}
          <Link to="/orders" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>

          {/* Order Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-muted-foreground">
                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin-slow" />
              <span className="text-sm text-muted-foreground">Live updates enabled</span>
            </div>
          </div>

          {/* Estimated Delivery Banner */}
          {estimatedDelivery && !isCancelled && order.status !== 'delivered' && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6 flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-primary">Estimated Delivery</p>
                <p className="text-sm text-muted-foreground">
                  {estimatedDelivery}
                  {order.shipping_method && (
                    <span className="ml-2">• {order.shipping_method.name}</span>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <Badge
              variant="outline"
              className={paymentStatusColor[order.payment_status] || paymentStatusColor.pending}
            >
              Payment {order.payment_status} via {order.payment_method.toUpperCase()}
            </Badge>
            {order.payment_status === 'refunded' && order.refunded_amount > 0 && (
              <p className="text-sm text-warning mt-2">
                Refunded {formatCurrency(order.refunded_amount)}{order.refund_reason ? ` • ${order.refund_reason}` : ''}
              </p>
            )}
          </div>

          {/* Status Timeline */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold mb-6">Order Status</h2>
            
            {isCancelled ? (
              <div className="flex items-center gap-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <div className="p-3 bg-destructive/20 rounded-full">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="font-semibold text-destructive">Order Cancelled</p>
                  <p className="text-sm text-muted-foreground">This order has been cancelled</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-border" />
                <div 
                  className="absolute left-6 top-6 w-0.5 bg-primary transition-all duration-500"
                  style={{ height: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
                />

                {/* Steps */}
                <div className="space-y-6">
                  {statusSteps.map((step, index) => {
                    const config = statusConfig[step];
                    const Icon = config.icon;
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;

                    return (
                      <div key={step} className="flex items-start gap-4 relative">
                        <div
                          className={`relative z-10 p-3 rounded-full transition-all duration-300 ${
                            isCompleted
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-muted-foreground'
                          } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 pt-2">
                          <p className={`font-semibold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {config.label}
                          </p>
                          <p className="text-sm text-muted-foreground">{config.description}</p>
                          {isCurrent && (
                            <Badge variant="outline" className="mt-2 bg-primary/10 text-primary border-primary/30">
                              Current Status
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Order Items */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
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
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency((item.product?.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(Number(order.total))}
                </span>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </h2>
              <div className="bg-secondary/30 rounded-lg p-4">
                <p className="text-sm whitespace-pre-line">{order.shipping_address}</p>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono">{order.id.slice(0, 8).toUpperCase()}</span>
                </div>
                {order.shipping_method && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping Method</span>
                      <span>{order.shipping_method.name}</span>
                    </div>
                    {order.shipping_method.price > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping Cost</span>
                        <span>{formatCurrency(order.shipping_method.price)}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>
                    {new Date(order.updated_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 bg-secondary/30 border border-border rounded-xl p-6 text-center">
            <h3 className="font-semibold mb-2">Need Help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              If you have any questions about your order, please contact our support team.
            </p>
            <Button variant="outline">Contact Support</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderTracking;
