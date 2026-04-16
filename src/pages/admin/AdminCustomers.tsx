import { useState, useEffect } from 'react';
import { Users, Mail, Phone, MapPin, Package, ChevronDown, ChevronUp, Search, Copy } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { AppwriteSetupGuide } from '@/components/AppwriteSetupGuide';
import { PermissionError } from '@/components/PermissionError';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Query } from 'appwrite';

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
}

interface Customer {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  phone: string | null;
  shipping_address: string | null;
  created_at: string;
  email?: string;
  orders: Order[];
}

const normalizeOrder = (doc: Record<string, unknown>): Order => {
  const rawItems = doc.items;
  return {
    id: (doc.$id as string) || (doc.id as string) || '',
    items: Array.isArray(rawItems) ? (rawItems as OrderItem[]) : [],
    total: Number(doc.total || 0),
    status: (doc.status as string) || 'pending',
    shipping_address: (doc.shippingAddress as string) || (doc.shipping_address as string) || '',
    created_at: (doc.$createdAt as string) || (doc.created_at as string) || new Date().toISOString(),
  };
};

const normalizeCustomer = (
  doc: Record<string, unknown>,
  allOrders: Order[]
): Customer => {
  const userId = (doc.userId as string) || (doc.user_id as string) || '';
  const orders = allOrders.filter((order) => {
    const orderUserId = ((order as unknown as Record<string, unknown>).user_id as string) || '';
    return orderUserId === userId;
  });

  return {
    id: (doc.$id as string) || (doc.id as string) || userId,
    user_id: userId,
    full_name: (doc.fullName as string) || (doc.full_name as string) || null,
    username: (doc.username as string) || null,
    phone: (doc.phone as string) || null,
    shipping_address: (doc.shippingAddress as string) || (doc.shipping_address as string) || null,
    created_at: (doc.$createdAt as string) || (doc.created_at as string) || new Date().toISOString(),
    email: (doc.email as string) || undefined,
    orders,
  };
};

const statusConfig: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  processing: 'bg-primary/10 text-primary border-primary/30',
  shipped: 'bg-info/10 text-info border-info/30',
  delivered: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function AdminCustomers() {
  // Check if Appwrite is properly configured
  const isConfigured = DATABASE_ID && DATABASE_ID !== 'your-appwrite-database-id';
  const { user, loading: authLoading } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  useEffect(() => {
    if (isConfigured && user && !authLoading) {
      fetchCustomers();
    }
  }, [isConfigured, user, authLoading]);

  // Show setup guide if Appwrite is not configured
  if (!isConfigured) {
    return <AppwriteSetupGuide />;
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Customers</h1>
              <p className="text-muted-foreground mt-1">Loading...</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Customers</h1>
              <p className="text-muted-foreground mt-1">
                Manage your customers and view their order history
              </p>
            </div>
          </div>
          <Card>
            <CardContent className="p-12 text-center space-y-4">
              <Users className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  You need to be logged in to view customers. Please log in to your account to continue.
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

  const fetchCustomers = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (!DATABASE_ID || DATABASE_ID === 'your-appwrite-database-id') {
        throw new Error('Appwrite database is not configured.');
      }

      const [profilesResponse, ordersResponse] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES, [Query.limit(500)]),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS, [Query.orderDesc('$createdAt'), Query.limit(500)]),
      ]);

      const normalizedOrders = ordersResponse.documents.map((orderDoc) => {
        const doc = orderDoc as unknown as Record<string, unknown>;
        const normalized = normalizeOrder(doc);
        return {
          ...normalized,
          user_id: (doc.userId as string) || (doc.user_id as string) || '',
          shippingAddress: (doc.shippingAddress as string) || '',
          paymentMethod: (doc.paymentMethod as string) || '',
          email: (doc.email as string) || '',
        };
      }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Registered customers from profiles
      const registeredCustomers = profilesResponse.documents.map((profileDoc) =>
        normalizeCustomer(
          profileDoc as unknown as Record<string, unknown>,
          normalizedOrders as unknown as Order[]
        )
      );

      // Guest customers — orders where userId === 'guest' or no matching profile
      const registeredUserIds = new Set(registeredCustomers.map((c) => c.user_id));
      const guestOrders = normalizedOrders.filter(
        (o) => o.user_id === 'guest' || (!registeredUserIds.has(o.user_id) && o.user_id !== '')
      );

      // Group guest orders by phone number (parsed from shippingAddress)
      const guestMap = new Map<string, typeof guestOrders>();
      for (const order of guestOrders) {
        const addr = order.shippingAddress || '';
        // Parse phone from "Name\nPhone: 01XXXXXXXXX\nAddress"
        const phoneMatch = addr.match(/Phone:\s*([^\n]+)/i);
        const phone = phoneMatch ? phoneMatch[1].trim() : addr.split('\n')[0] || order.id;
        const key = phone;
        if (!guestMap.has(key)) guestMap.set(key, []);
        guestMap.get(key)!.push(order);
      }

      const guestCustomers: Customer[] = Array.from(guestMap.entries()).map(([phone, orders]) => {
        const firstOrder = orders[0];
        const addr = firstOrder.shippingAddress || '';
        const lines = addr.split('\n').map((l: string) => l.trim()).filter(Boolean);
        const name = lines[0] || 'Guest';
        // Filter out Phone, Email, Note lines from address
        const addressLine = lines
          .filter((l: string) =>
            !l.startsWith('Phone:') &&
            !l.startsWith('Email:') &&
            !l.startsWith('Note:')
          )
          .slice(1) // skip name line
          .join(', ');
        
        // Extract email if provided in any order's shippingAddress or email field
        const emailOrder = orders.find((o) => {
          const addr = o.shippingAddress || '';
          return o.email || addr.match(/Email:\s*([^\n]+)/i);
        });
        const emailFromAddr = emailOrder?.shippingAddress?.match(/Email:\s*([^\n]+)/i)?.[1]?.trim();
        const guestEmail = emailOrder?.email || emailFromAddr || undefined;

        return {
          id: `guest-${phone}`,
          user_id: `guest-${phone}`,
          full_name: name,
          username: null,
          phone: phone.replace(/^Phone:\s*/i, ''),
          shipping_address: addressLine || lines.slice(2).join(', '),
          created_at: firstOrder.created_at,
          email: guestEmail,
          orders: orders as unknown as Order[],
        };
      });

      const allCustomers = [...registeredCustomers, ...guestCustomers]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setCustomers(allCustomers);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isAuthError = errorMessage.includes('unauthorized') || errorMessage.includes('401');
      console.error('Error fetching customers:', errorMessage);
      setCustomers([]);
      if (isAuthError) {
        setLoadError('You do not have permission to view customers.');
      } else {
        setLoadError(errorMessage || 'Failed to load customers.');
      }
      toast({ title: 'Error', description: errorMessage || 'Failed to fetch customers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.full_name?.toLowerCase().includes(query) ||
      customer.username?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.user_id.toLowerCase().includes(query) ||
      customer.shipping_address?.toLowerCase().includes(query)
    );
  });

  const totalOrders = customers.reduce((sum, c) => sum + c.orders.length, 0);
  const totalRevenue = customers.reduce(
    (sum, c) => sum + c.orders.reduce((orderSum, o) => orderSum + Number(o.total), 0),
    0
  );

  const toggleExpanded = (customerId: string) => {
    setExpandedCustomer((prev) => (prev === customerId ? null : customerId));
  };

  // Show permission error if present
  if (loadError && loadError.includes('Permission')) {
    return (
      <AdminLayout>
        <PermissionError 
          title="Cannot Access Customers"
          description={loadError}
          onRetry={fetchCustomers}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage your customers and view their order history
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{customers.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Orders
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </CardTitle>
              <span className="text-muted-foreground">$</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRevenue.toFixed(2)} BDT</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Customers Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <div className="p-12 text-center space-y-4">
                <Users className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">Could not load customers</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap text-left max-w-prose mx-auto">
                    {loadError}
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={fetchCustomers}>Retry</Button>
                  <Button variant="outline" onClick={() => window.location.href = '/admin'}>
                    Back to Dashboard
                  </Button>
                </div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No customers found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Try adjusting your search query'
                    : 'Customers will appear here when they sign up'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => {
                    const isExpanded = expandedCustomer === customer.id;
                    const totalSpent = customer.orders.reduce(
                      (sum, o) => sum + Number(o.total),
                      0
                    );

                    return (
                      <Collapsible key={customer.id} open={isExpanded} asChild>
                        <>
                          <TableRow className="hover:bg-muted/50">
                            <TableCell>
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {(customer.full_name || customer.username || 'U')
                                    .charAt(0)
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium flex items-center gap-2">
                                  {customer.full_name || customer.username || 'Anonymous'}
                                  {customer.user_id.startsWith('guest-') && (
                                    <span className="text-[10px] bg-orange-100 text-orange-600 border border-orange-200 rounded-full px-1.5 py-0.5 font-semibold">Guest</span>
                                  )}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {customer.user_id.startsWith('guest-') ? 'Guest Order' : customer.user_id.slice(0, 8) + '...'}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {customer.phone && (
                                  <div className="flex items-center gap-1 text-sm">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    {customer.phone}
                                  </div>
                                )}
                                {customer.email && (
                                  <div
                                    className="flex items-center gap-1 text-sm text-muted-foreground cursor-pointer hover:text-primary group"
                                    title="Click to copy email"
                                    onClick={async () => {
                                      await navigator.clipboard.writeText(customer.email!);
                                      toast({ title: 'Copied', description: customer.email });
                                    }}
                                  >
                                    <Mail className="h-3 w-3 shrink-0" />
                                    <span className="truncate max-w-40 group-hover:underline">{customer.email}</span>
                                    <Copy className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                )}
                                {customer.shipping_address && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-32">
                                      {customer.shipping_address.split('\n')[0]}
                                    </span>
                                  </div>
                                )}
                                {!customer.phone && !customer.shipping_address && !customer.email && (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{customer.orders.length}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">{totalSpent.toFixed(2)} BDT</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {new Date(customer.created_at).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              {customer.orders.length > 0 && (
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => toggleExpanded(customer.id)}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                              )}
                            </TableCell>
                          </TableRow>
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                              <TableCell colSpan={7} className="p-0">
                                <div className="p-4 pl-16">
                                  <h4 className="font-medium mb-3">Order History</h4>
                                  <div className="space-y-3">
                                    {customer.orders.map((order) => (
                                      <div
                                        key={order.id}
                                        className="flex items-center justify-between bg-background rounded-lg p-3 border border-border"
                                      >
                                        <div className="flex items-center gap-4">
                                          <div className="flex -space-x-2">
                                            {order.items.slice(0, 3).map((item, idx) => (
                                              <img
                                                key={idx}
                                                src={item.product?.image || '/placeholder.svg'}
                                                alt={item.product?.name || 'Product'}
                                                className="w-8 h-8 rounded-md object-cover border-2 border-background"
                                              />
                                            ))}
                                            {order.items.length > 3 && (
                                              <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center text-xs font-medium border-2 border-background">
                                                +{order.items.length - 3}
                                              </div>
                                            )}
                                          </div>
                                          <div>
                                            <p className="font-medium text-sm">
                                              Order #{order.id.slice(0, 8).toUpperCase()}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {new Date(order.created_at).toLocaleDateString()} •{' '}
                                              {order.items.length} item
                                              {order.items.length !== 1 ? 's' : ''}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                          <Badge
                                            variant="outline"
                                            className={statusConfig[order.status] || ''}
                                          >
                                            {order.status.charAt(0).toUpperCase() +
                                              order.status.slice(1)}
                                          </Badge>
                                          <span className="font-semibold">
                                            {Number(order.total).toFixed(2)} BDT
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        </>
                      </Collapsible>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
