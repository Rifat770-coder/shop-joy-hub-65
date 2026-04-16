import { useState, useEffect } from 'react';
import { Search, Eye, MoreHorizontal, RefreshCw, AlertTriangle } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { PermissionError } from '@/components/PermissionError';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { databases, realtime, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Query } from 'appwrite';

interface DbOrder {
  id: string;
  user_id: string;
  items: unknown;
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  refunded_amount: number;
  refund_reason: string;
  refunded_at: string;
  shipping_address: string;
  shipping_method: unknown;
  created_at: string;
  updated_at: string;
}

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';

const normalizeOrder = (doc: Record<string, unknown>): DbOrder => {
  // Parse items — could be array or JSON string
  let parsedItems = [];
  const rawItems = doc.items;
  if (Array.isArray(rawItems)) {
    parsedItems = rawItems;
  } else if (typeof rawItems === 'string') {
    try { parsedItems = JSON.parse(rawItems); } catch { parsedItems = []; }
  }

  return {
    id: (doc.$id as string) || (doc.id as string),
    user_id: (doc.userId as string) || (doc.user_id as string) || '',
    items: parsedItems,
    total: Number(doc.total || 0),
    status: (doc.status as string) || 'pending',
    payment_method: ((doc.paymentMethod as string) || (doc.payment_method as string) || 'cod').toLowerCase(),
    payment_status: ((doc.paymentStatus as string) || (doc.payment_status as string) || 'pending').toLowerCase(),
    refunded_amount: Number((doc.refundedAmount as number) || (doc.refunded_amount as number) || 0),
    refund_reason: (doc.refundReason as string) || (doc.refund_reason as string) || '',
    refunded_at: (doc.refundedAt as string) || (doc.refunded_at as string) || '',
    shipping_address: (doc.shippingAddress as string) || (doc.shipping_address as string) || '',
    shipping_method: doc.shippingMethod ?? doc.shipping_method ?? null,
    created_at: (doc.$createdAt as string) || (doc.created_at as string) || new Date().toISOString(),
    updated_at: (doc.$updatedAt as string) || (doc.updated_at as string) || new Date().toISOString(),
  };
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'delivered':
      return 'bg-success/10 text-success border-success/30';
    case 'processing':
      return 'bg-info/10 text-info border-info/30';
    case 'shipped':
      return 'bg-warning/10 text-warning border-warning/30';
    case 'pending':
      return 'bg-muted text-muted-foreground border-border';
    case 'cancelled':
      return 'bg-destructive/10 text-destructive border-destructive/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-success/10 text-success border-success/30';
    case 'authorized':
      return 'bg-info/10 text-info border-info/30';
    case 'refunded':
      return 'bg-warning/10 text-warning border-warning/30';
    case 'failed':
      return 'bg-destructive/10 text-destructive border-destructive/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

export default function AdminOrders() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Check if Appwrite is configured
  const isConfigured = DATABASE_ID && DATABASE_ID !== 'your-appwrite-database-id';

  useEffect(() => {
    if (isConfigured && user && !authLoading) {
      fetchOrders();
    }
  }, [isConfigured, user, authLoading]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  // Show auth error if not logged in
  if (!user) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Orders</h1>
          <Card>
            <CardContent className="pt-6 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
                <p className="text-muted-foreground mb-4">
                  You need to be logged in as an admin to view orders.
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => window.location.href = '/auth'}>Log In</Button>
                <Button variant="outline" onClick={() => window.location.href = '/'}>
                  Back to Store
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const fetchOrders = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        [Query.orderDesc('$createdAt'), Query.limit(500)]
      );

      const sortedOrders = response.documents
        .map((doc) => normalizeOrder(doc as unknown as Record<string, unknown>))
        .sort((a, b) => {
          const dateA = new Date((a as any).created_at || (a as any).createdAt || 0).getTime();
          const dateB = new Date((b as any).created_at || (b as any).createdAt || 0).getTime();
          return dateB - dateA;
        });
      setOrders(sortedOrders);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAuthError = errorMessage.includes('unauthorized') || errorMessage.includes('401') || errorMessage.includes('Permission');
      
      console.error('Error fetching orders:', errorMessage);
      setOrders([]);
      setLoadError(
        isAuthError
          ? 'You do not have permission to access orders. Make sure you are logged in with an admin account.'
          : errorMessage || 'Failed to fetch orders'
      );
      
      toast({
        title: 'Error',
        description: isAuthError ? 'Permission Denied' : (errorMessage || 'Failed to fetch orders'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Real-time subscriptions are optional and may fail due to auth/config
    // Only attempt if properly configured
    if (!DATABASE_ID || DATABASE_ID === 'your-appwrite-database-id') {
      return;
    }

    let unsubscribe: (() => void) | null = null;
    
    try {
      // realtime.subscribe returns an unsubscribe function
      const subscriptionChannel = `databases.${DATABASE_ID}.collections.${COLLECTIONS.ORDERS}.documents`;
      
      unsubscribe = realtime.subscribe(subscriptionChannel, (response: any) => {
        try {
          if (response.events.includes('databases.*.collections.*.documents.*.create')) {
            const newOrder = response.payload;
            setOrders((prev) => [normalizeOrder(newOrder as unknown as Record<string, unknown>), ...prev]);
            toast({
              title: 'New Order!',
              description: `Order ${newOrder.$id.slice(0, 8)}... received`,
            });
          } else if (response.events.includes('databases.*.collections.*.documents.*.update')) {
            const updatedOrder = response.payload;
            setOrders((prev) =>
              prev.map((order) =>
                order.id === updatedOrder.$id
                  ? normalizeOrder(updatedOrder as unknown as Record<string, unknown>)
                  : order
              )
            );
          } else if (response.events.includes('databases.*.collections.*.documents.*.delete')) {
            const deletedOrder = response.payload;
            setOrders((prev) =>
              prev.filter((order) => order.id !== deletedOrder.$id)
            );
          }
        } catch (error) {
          console.error('Error processing realtime update:', error);
        }
      }) as unknown as (() => void) | null;
    } catch (error) {
      console.warn('Real-time subscription setup failed (this is optional):', error);
      // Real-time subscriptions are optional - app still works without them
    }

    return () => {
      if (typeof unsubscribe === 'function') {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from realtime:', error);
        }
      }
    };
  }, []);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        orderId,
        { status: newStatus }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast({
        title: 'Order updated',
        description: `Order status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update order status',
        variant: 'destructive',
      });
    }
  };

  const updatePaymentStatus = async (orderId: string, paymentStatus: PaymentStatus) => {
    try {
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        orderId,
        {
          paymentStatus,
          ...(paymentStatus !== 'refunded'
            ? {
                refundedAmount: 0,
                refundReason: '',
                refundedAt: null,
              }
            : {}),
        }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId
            ? {
                ...order,
                payment_status: paymentStatus,
                ...(paymentStatus !== 'refunded'
                  ? { refunded_amount: 0, refund_reason: '', refunded_at: '' }
                  : {}),
              }
            : order
        )
      );

      toast({
        title: 'Payment updated',
        description: `Payment status changed to ${paymentStatus}.`,
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    }
  };

  const handleRefund = async (order: DbOrder) => {
    const amountInput = window.prompt('Refund amount', order.total.toFixed(2));
    if (!amountInput) return;

    const refundAmount = Number(amountInput);
    if (!Number.isFinite(refundAmount) || refundAmount <= 0 || refundAmount > order.total) {
      toast({
        title: 'Invalid refund amount',
        description: 'Enter an amount between 0 and the order total.',
        variant: 'destructive',
      });
      return;
    }

    const refundReason = window.prompt('Refund reason', 'Customer requested refund')?.trim() || 'Refunded by admin';

    try {
      const refundedAt = new Date().toISOString();
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.ORDERS,
        order.id,
        {
          paymentStatus: 'refunded',
          refundedAmount: refundAmount,
          refundReason,
          refundedAt,
        }
      );

      setOrders((prev) =>
        prev.map((current) =>
          current.id === order.id
            ? {
                ...current,
                payment_status: 'refunded',
                refunded_amount: refundAmount,
                refund_reason: refundReason,
                refunded_at: refundedAt,
              }
            : current
        )
      );

      toast({
        title: 'Refund recorded',
        description: `Refunded $${refundAmount.toFixed(2)} for order ${order.id.slice(0, 8)}...`,
      });
    } catch (error) {
      console.error('Error recording refund:', error);
      toast({
        title: 'Error',
        description: 'Failed to process refund update',
        variant: 'destructive',
      });
    }
  };

  const getOrderItemsCount = (items: unknown): number => {
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        if (Array.isArray(parsed)) {
          return parsed.reduce((sum, item) => sum + (item?.quantity || 1), 0);
        }
      } catch {
        return 0;
      }
    }

    if (Array.isArray(items)) {
      return items.reduce((sum, item) => sum + (item?.quantity || 1), 0);
    }
    return 0;
  };

  // Show permission error if present
  if (loadError && loadError.includes('Permission')) {
    return (
      <AdminLayout>
        <PermissionError 
          title="Cannot Access Orders"
          description={loadError}
          onRetry={fetchOrders}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage customer orders (real-time updates enabled)
            </p>
          </div>
          <Button variant="outline" onClick={fetchOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="shipped">Shipped</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Order ID</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{getOrderItemsCount(order.items)} items</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {order.shipping_address.split('\n')[0]}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {Number(order.total).toFixed(2)} BDT
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(order.status)} border`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge className={`${getPaymentStatusColor(order.payment_status)} border`}>
                          {order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                        </Badge>
                        <p className="text-xs text-muted-foreground uppercase">{order.payment_method}</p>
                        {order.payment_status === 'refunded' && order.refunded_amount > 0 && (
                          <p className="text-xs text-warning">
                            -${order.refunded_amount.toFixed(2)} refunded
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateOrderStatus(order.id, 'processing')}
                          >
                            Mark as Processing
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateOrderStatus(order.id, 'shipped')}
                          >
                            Mark as Shipped
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updateOrderStatus(order.id, 'delivered')}
                          >
                            Mark as Delivered
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => updatePaymentStatus(order.id, 'paid')}
                          >
                            Mark Payment as Paid
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRefund(order)}
                          >
                            Process Refund
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          >
                            Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminLayout>
  );
}
