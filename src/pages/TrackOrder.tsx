import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Clock, CheckCircle, Truck, XCircle, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { useCurrency } from '@/hooks/useCurrency';
import { getPrimaryImage } from '@/lib/image-utils';

interface OrderItem {
  product: { id: string; name: string; price: number; image: string };
  quantity: number;
}
interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
  payment_method: string;
  payment_status: string;
  shipping_address: string;
  created_at: string;
}

const normalizeOrder = (raw: Record<string, unknown>): Order => {
  let parsedItems: OrderItem[] = [];
  const rawItems = raw.items;
  if (Array.isArray(rawItems)) parsedItems = rawItems as OrderItem[];
  else if (typeof rawItems === 'string') {
    try { const c = JSON.parse(rawItems); if (Array.isArray(c)) parsedItems = c; } catch {}
  }
  return {
    id: (raw.$id as string) || '',
    items: parsedItems,
    total: Number(raw.total || 0),
    status: (raw.status as string) || 'pending',
    payment_method: ((raw.paymentMethod as string) || 'cod').toLowerCase(),
    payment_status: ((raw.paymentStatus as string) || 'pending').toLowerCase(),
    shipping_address: (raw.shippingAddress as string) || (raw.shipping_address as string) || '',
    created_at: (raw.$createdAt as string) || new Date().toISOString(),
  };
};

const statusSteps = ['pending', 'processing', 'shipped', 'delivered'];

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string; description: string }> = {
  pending:    { label: 'Order Placed',  icon: Clock,         color: 'bg-warning/10 text-warning border-warning/30',         description: 'আপনার অর্ডার পাওয়া হয়েছে' },
  processing: { label: 'Processing',   icon: AlertCircle,   color: 'bg-primary/10 text-primary border-primary/30',         description: 'অর্ডার প্রস্তুত করা হচ্ছে' },
  shipped:    { label: 'Shipped',       icon: Truck,         color: 'bg-info/10 text-info border-info/30',                  description: 'অর্ডার পাঠানো হয়েছে' },
  delivered:  { label: 'Delivered',    icon: CheckCircle,   color: 'bg-success/10 text-success border-success/30',         description: 'অর্ডার ডেলিভারি হয়েছে' },
  cancelled:  { label: 'Cancelled',    icon: XCircle,       color: 'bg-destructive/10 text-destructive border-destructive/30', description: 'অর্ডার বাতিল হয়েছে' },
};

const paymentStatusColor: Record<string, string> = {
  pending:    'bg-muted text-muted-foreground border-border',
  authorized: 'bg-info/10 text-info border-info/30',
  paid:       'bg-success/10 text-success border-success/30',
  failed:     'bg-destructive/10 text-destructive border-destructive/30',
};

export default function TrackOrder() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { formatCurrency } = useCurrency();
  const navigate = useNavigate();

  const handleTrack = async () => {
    const trimmed = orderId.trim();
    if (!trimmed) { setError('অর্ডার ID দিন'); return; }
    setError('');
    setLoading(true);
    setOrder(null);
    try {
      // Try direct lookup first (full UUID)
      const data = await databases.getDocument(DATABASE_ID, COLLECTIONS.ORDERS, trimmed) as unknown as Record<string, unknown>;
      setOrder(normalizeOrder(data));
    } catch {
      // If not found, try searching by prefix (short ID)
      try {
        const { Query } = await import('appwrite');
        const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [
          Query.limit(100),
          Query.orderDesc('$createdAt'),
        ]);
        // Match by $id starting with the trimmed input (case-insensitive)
        const match = res.documents.find((d) =>
          d.$id.toLowerCase().startsWith(trimmed.toLowerCase()) ||
          d.$id.toLowerCase().replace(/-/g, '').startsWith(trimmed.toLowerCase().replace(/-/g, ''))
        );
        if (match) {
          setOrder(normalizeOrder(match as unknown as Record<string, unknown>));
        } else {
          setError('অর্ডার পাওয়া যায়নি। সঠিক Order ID দিন।');
        }
      } catch {
        setError('অর্ডার পাওয়া যায়নি। সঠিক Order ID দিন।');
      }
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? (order.status === 'cancelled' ? -1 : statusSteps.indexOf(order.status)) : -1;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">অর্ডার ট্র্যাক করুন</h1>
            <p className="text-muted-foreground">আপনার Order ID দিয়ে অর্ডারের অবস্থা জানুন</p>
          </div>

          {/* Search Box */}
          <div className="bg-card border border-border rounded-xl p-6 mb-6">
            <label className="block text-sm font-medium mb-2">Order ID</label>
            <div className="flex gap-3">
              <input
                className="flex-1 border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors font-mono"
                placeholder="Order ID বা প্রথম ৮ অক্ষর লিখুন (যেমন: 69E08C81)"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              />
              <Button onClick={handleTrack} disabled={loading} className="gap-2 shrink-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Track
              </Button>
            </div>
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            <p className="text-xs text-muted-foreground mt-3">
              💡 অর্ডার করার পর confirmation page-এ Order ID পাবেন। প্রথম ৮ অক্ষর দিলেও কাজ করবে।
            </p>
          </div>

          {/* Order Result */}
          {order && (
            <div className="space-y-4 animate-fade-in">
              {/* Order Header */}
              <div className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Order ID</p>
                    <p className="font-mono font-bold text-sm">{order.id.slice(0, 8).toUpperCase()}...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(order.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`${statusConfig[order.status]?.color || ''} border mb-1`}>
                      {statusConfig[order.status]?.label || order.status}
                    </Badge>
                    <br />
                    <Badge variant="outline" className={`${paymentStatusColor[order.payment_status] || ''} border text-xs`}>
                      {order.payment_method.toUpperCase()} • {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold mb-5">অর্ডারের অবস্থা</h2>
                {order.status === 'cancelled' ? (
                  <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <XCircle className="h-6 w-6 text-destructive shrink-0" />
                    <div>
                      <p className="font-semibold text-destructive">অর্ডার বাতিল হয়েছে</p>
                      <p className="text-sm text-muted-foreground">এই অর্ডারটি বাতিল করা হয়েছে</p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border" />
                    <div
                      className="absolute left-5 top-5 w-0.5 bg-primary transition-all duration-500"
                      style={{ height: `${currentStepIndex >= 0 ? (currentStepIndex / (statusSteps.length - 1)) * 100 : 0}%` }}
                    />
                    <div className="space-y-5">
                      {statusSteps.map((step, index) => {
                        const config = statusConfig[step];
                        const Icon = config.icon;
                        const isCompleted = index <= currentStepIndex;
                        const isCurrent = index === currentStepIndex;
                        return (
                          <div key={step} className="flex items-start gap-4 relative">
                            <div className={`relative z-10 p-2.5 rounded-full transition-all ${
                              isCompleted ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                            } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 pt-1.5">
                              <p className={`font-medium text-sm ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {config.label}
                              </p>
                              <p className="text-xs text-muted-foreground">{config.description}</p>
                              {isCurrent && (
                                <Badge variant="outline" className="mt-1.5 bg-primary/10 text-primary border-primary/30 text-xs">
                                  বর্তমান অবস্থা
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

              {/* Order Items */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-semibold mb-4">অর্ডারের পণ্য</h2>
                <div className="space-y-3">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <img src={getPrimaryImage(item.product?.image)} alt={item.product?.name}
                        className="w-12 h-12 rounded-lg object-cover shrink-0 bg-muted"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product?.name || 'Product'}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold shrink-0">
                        {formatCurrency((item.product?.price || 0) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <Separator className="my-3" />
                <div className="flex justify-between font-bold">
                  <span>মোট</span>
                  <span className="text-primary">{formatCurrency(order.total)}</span>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <div className="bg-card border border-border rounded-xl p-5">
                  <h2 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> ডেলিভারি ঠিকানা
                  </h2>
                  <p className="text-sm text-muted-foreground whitespace-pre-line bg-secondary/30 rounded-lg p-3">
                    {order.shipping_address}
                  </p>
                </div>
              )}

              {/* Full tracking link */}
              <Button variant="outline" className="w-full" onClick={() => navigate(`/orders/${order.id}`)}>
                বিস্তারিত ট্র্যাকিং দেখুন
              </Button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
