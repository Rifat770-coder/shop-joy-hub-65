import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw, Smartphone, Clock } from 'lucide-react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Query } from 'appwrite';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

interface PendingOrder {
  id: string;
  userId: string;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
  shippingAddress: string;
  createdAt: string;
  items: unknown;
}

const normalizeOrder = (doc: Record<string, unknown>): PendingOrder => ({
  id: doc.$id as string,
  userId: (doc.userId as string) || '',
  total: Number(doc.total || 0),
  paymentMethod: ((doc.paymentMethod as string) || '').toLowerCase(),
  paymentStatus: ((doc.paymentStatus as string) || 'pending').toLowerCase(),
  transactionId: (doc.transactionId as string) || '',
  shippingAddress: (doc.shippingAddress as string) || '',
  createdAt: (doc.$createdAt as string) || new Date().toISOString(),
  items: doc.items ?? [],
});

export function PaymentApprovalManager() {
  const [orders, setOrders] = useState<PendingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
        Query.equal('paymentStatus', 'pending'),
      ]);

      const mobilePending = response.documents
        .map((d) => normalizeOrder(d as unknown as Record<string, unknown>))
        .filter((o) => (o.paymentMethod === 'bkash' || o.paymentMethod === 'nagad') && o.transactionId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setOrders(mobilePending);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      toast({ title: 'Error', description: 'Failed to load pending payments', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const approvePayment = async (orderId: string) => {
    setProcessing(orderId);
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId, {
        paymentStatus: 'paid',
        status: 'processing',
      });
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast({ title: 'Payment approved', description: 'Order is now confirmed and processing.' });
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({ title: 'Error', description: 'Failed to approve payment', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const rejectPayment = async (orderId: string) => {
    setProcessing(orderId);
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId, {
        paymentStatus: 'failed',
        status: 'cancelled',
      });
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      toast({ title: 'Payment rejected', description: 'Order has been cancelled.' });
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({ title: 'Error', description: 'Failed to reject payment', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const getItemCount = (items: unknown): number => {
    if (typeof items === 'string') {
      try {
        const parsed = JSON.parse(items);
        if (Array.isArray(parsed)) return parsed.reduce((s, i) => s + (i?.quantity || 1), 0);
      } catch { return 0; }
    }
    if (Array.isArray(items)) return items.reduce((s, i) => s + (i?.quantity || 1), 0);
    return 0;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-primary" />
          Pending Payment Approvals
          {orders.length > 0 && (
            <Badge className="bg-destructive/10 text-destructive border-destructive/30 border ml-2">
              {orders.length}
            </Badge>
          )}
        </CardTitle>
        <Button variant="outline" size="sm" onClick={fetchPendingOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading pending payments...</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>No pending bKash / Nagad payments</p>
          </div>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Order ID</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.id.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          order.paymentMethod === 'bkash'
                            ? 'bg-[#E2136E]/10 text-[#E2136E] border-[#E2136E]/30 border'
                            : 'bg-[#F6921E]/10 text-[#F6921E] border-[#F6921E]/30 border'
                        }
                      >
                        {order.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
                        {order.transactionId}
                      </code>
                    </TableCell>
                    <TableCell>{getItemCount(order.items)} items</TableCell>
                    <TableCell className="font-medium">৳{order.total.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          className="bg-success/10 text-success hover:bg-success/20 border border-success/30"
                          onClick={() => approvePayment(order.id)}
                          disabled={processing === order.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30"
                          onClick={() => rejectPayment(order.id)}
                          disabled={processing === order.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
