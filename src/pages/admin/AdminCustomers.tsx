import { useState, useEffect } from 'react';
import { Users, Mail, Phone, MapPin, Package, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
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
import { supabase } from '@/integrations/supabase/client';

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

const statusConfig: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/30',
  processing: 'bg-primary/10 text-primary border-primary/30',
  shipped: 'bg-info/10 text-info border-info/30',
  delivered: 'bg-success/10 text-success border-success/30',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Map orders to customers
      const customersWithOrders = (profiles || []).map((profile) => {
        const customerOrders = (orders || [])
          .filter((order) => order.user_id === profile.user_id)
          .map((order) => ({
            ...order,
            items: Array.isArray(order.items) 
              ? (order.items as unknown as OrderItem[]) 
              : [],
          }));

        return {
          ...profile,
          orders: customerOrders,
        };
      });

      setCustomers(customersWithOrders);
    } catch (error) {
      console.error('Error fetching customers:', error);
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
      customer.user_id.toLowerCase().includes(query)
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
              <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
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
                                <p className="font-medium">
                                  {customer.full_name || customer.username || 'Anonymous'}
                                </p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {customer.user_id.slice(0, 8)}...
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
                                {customer.shipping_address && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate max-w-32">
                                      {customer.shipping_address.split('\n')[0]}
                                    </span>
                                  </div>
                                )}
                                {!customer.phone && !customer.shipping_address && (
                                  <span className="text-sm text-muted-foreground">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{customer.orders.length}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="font-medium">${totalSpent.toFixed(2)}</span>
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
                                            ${Number(order.total).toFixed(2)}
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
