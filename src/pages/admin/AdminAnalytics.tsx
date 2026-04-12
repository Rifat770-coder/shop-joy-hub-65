import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  Calendar
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  user_id: string;
  items?: unknown;
}

interface Profile {
  id: string;
  created_at: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--info))', 'hsl(var(--destructive))'];

export default function AdminAnalytics() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, profilesRes] = await Promise.all([
        databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS),
        databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES),
      ]);

      // Transform Appwrite documents to match expected format
      const orders = ordersRes.documents.map(doc => ({
        id: doc.$id,
        total: doc.total,
        status: doc.status,
        created_at: doc.$createdAt,
        user_id: doc.userId,
        items: doc.items,
      }));

      const profiles = profilesRes.documents.map(doc => ({
        id: doc.$id,
        created_at: doc.$createdAt,
      }));

      setOrders(orders);
      setProfiles(profiles);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByTimeRange = <T extends { created_at: string }>(data: T[]) => {
    const days = parseInt(timeRange);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    return data.filter((item) => new Date(item.created_at) >= cutoff);
  };

  const filteredOrders = useMemo(() => filterByTimeRange(orders), [orders, timeRange]);
  const filteredProfiles = useMemo(() => filterByTimeRange(profiles), [profiles, timeRange]);

  const previousPeriod = useMemo(() => {
    const days = parseInt(timeRange);
    const now = new Date();
    const currentStart = new Date(now);
    currentStart.setDate(currentStart.getDate() - days);

    const previousStart = new Date(currentStart);
    previousStart.setDate(previousStart.getDate() - days);

    const previousOrders = orders.filter((order) => {
      const created = new Date(order.created_at);
      return created >= previousStart && created < currentStart;
    });

    const previousProfiles = profiles.filter((profile) => {
      const created = new Date(profile.created_at);
      return created >= previousStart && created < currentStart;
    });

    return { previousOrders, previousProfiles };
  }, [orders, profiles, timeRange]);

  // Revenue over time
  const revenueData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + Number(order.total);
    });
    return Object.entries(grouped).map(([date, revenue]) => ({ date, revenue }));
  }, [filteredOrders]);

  // Orders over time
  const ordersData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, orders]) => ({ date, orders }));
  }, [filteredOrders]);

  // Customers over time
  const customersData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredProfiles.forEach((profile) => {
      const date = new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, customers]) => ({ date, customers }));
  }, [filteredProfiles]);

  // Order status distribution
  const statusData = useMemo(() => {
    const grouped: Record<string, number> = {};
    filteredOrders.forEach((order) => {
      grouped[order.status] = (grouped[order.status] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
  }, [filteredOrders]);

  const customerInsights = useMemo(() => {
    const total = filteredOrders.length;
    const orderCountByUser = filteredOrders.reduce<Record<string, number>>((acc, order) => {
      if (!order.user_id) return acc;
      acc[order.user_id] = (acc[order.user_id] || 0) + 1;
      return acc;
    }, {});

    const returningCustomers = Object.values(orderCountByUser).filter((count) => count > 1).length;
    const activeCustomers = Object.keys(orderCountByUser).length;
    const newCustomers = Math.max(0, activeCustomers - returningCustomers);

    return {
      activeCustomers,
      returningCustomers,
      newCustomers,
      returningRate: activeCustomers > 0 ? (returningCustomers / activeCustomers) * 100 : 0,
      avgOrdersPerCustomer: activeCustomers > 0 ? total / activeCustomers : 0,
    };
  }, [filteredOrders]);

  const productPerformance = useMemo(() => {
    const aggregate = new Map<string, { name: string; quantity: number; revenue: number }>();

    filteredOrders.forEach((order) => {
      const rawItems = order.items;
      let items: Array<{ product?: { id?: string; name?: string; price?: number }; quantity?: number }> = [];

      if (Array.isArray(rawItems)) {
        items = rawItems as Array<{ product?: { id?: string; name?: string; price?: number }; quantity?: number }>;
      } else if (typeof rawItems === 'string') {
        try {
          const parsed = JSON.parse(rawItems);
          if (Array.isArray(parsed)) {
            items = parsed as Array<{ product?: { id?: string; name?: string; price?: number }; quantity?: number }>;
          }
        } catch {
          items = [];
        }
      }

      items.forEach((item) => {
        const productId = item.product?.id;
        if (!productId) return;

        const quantity = Number(item.quantity || 0);
        const price = Number(item.product?.price || 0);
        const name = item.product?.name || 'Unknown Product';

        const current = aggregate.get(productId) || { name, quantity: 0, revenue: 0 };
        aggregate.set(productId, {
          name,
          quantity: current.quantity + quantity,
          revenue: current.revenue + quantity * price,
        });
      });
    });

    return Array.from(aggregate.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [filteredOrders]);

  // Stats calculations
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalOrders = filteredOrders.length;
  const totalCustomers = filteredProfiles.length;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const previousRevenue = previousPeriod.previousOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const previousOrdersCount = previousPeriod.previousOrders.length;
  const previousCustomersCount = previousPeriod.previousProfiles.length;
  const previousAvgOrderValue = previousOrdersCount > 0 ? previousRevenue / previousOrdersCount : 0;

  // Calculate trends (compare to previous period)
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const stats = [
    {
      title: 'Total Revenue',
      value: `$${totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      trend: calculateTrend(totalRevenue, previousRevenue),
      color: 'text-success',
    },
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      icon: ShoppingCart,
      trend: calculateTrend(totalOrders, previousOrdersCount),
      color: 'text-primary',
    },
    {
      title: 'New Customers',
      value: totalCustomers.toString(),
      icon: Users,
      trend: calculateTrend(totalCustomers, previousCustomersCount),
      color: 'text-info',
    },
    {
      title: 'Avg Order Value',
      value: `$${avgOrderValue.toFixed(2)}`,
      icon: Package,
      trend: calculateTrend(avgOrderValue, previousAvgOrderValue),
      color: 'text-warning',
    },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name === 'revenue' ? `$${entry.value.toFixed(2)}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Track your store's performance and trends
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-4 w-20 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={stat.title} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <stat.icon className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {stat.trend >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                    <span className={`text-sm ${stat.trend >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {stat.trend >= 0 ? '+' : ''}{stat.trend.toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground">vs last period</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="status">Order Status</TabsTrigger>
            <TabsTrigger value="customer-insights">Customer Insights</TabsTrigger>
            <TabsTrigger value="products">Product Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>Daily revenue for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : revenueData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No revenue data available for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `$${value}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#revenueGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders Over Time</CardTitle>
                <CardDescription>Daily order count for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : ordersData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No order data available for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={ordersData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers">
            <Card>
              <CardHeader>
                <CardTitle>New Customers Over Time</CardTitle>
                <CardDescription>Daily customer signups for the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-80 w-full" />
                ) : customersData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No customer data available for this period
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={customersData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="customers"
                        stroke="hsl(var(--info))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--info))', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                  <CardDescription>Breakdown of orders by status</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-80 w-full" />
                  ) : statusData.length === 0 ? (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      No order data available
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Breakdown</CardTitle>
                  <CardDescription>Detailed view of order statuses</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : statusData.length === 0 ? (
                    <div className="h-80 flex items-center justify-center text-muted-foreground">
                      No order data available
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {statusData.map((status, index) => {
                        const percentage = totalOrders > 0 ? (status.value / totalOrders) * 100 : 0;
                        return (
                          <div key={status.name} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="font-medium">{status.name}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {status.value} ({percentage.toFixed(1)}%)
                              </div>
                            </div>
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${percentage}%`,
                                  backgroundColor: COLORS[index % COLORS.length],
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="customer-insights">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Active Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{customerInsights.activeCustomers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">New Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{customerInsights.newCustomers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Returning Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{customerInsights.returningCustomers}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Retention Snapshot</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{customerInsights.returningRate.toFixed(1)}%</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Orders per Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{customerInsights.avgOrdersPerCustomer.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Top Product Performance</CardTitle>
                <CardDescription>Revenue and quantity contribution by product</CardDescription>
              </CardHeader>
              <CardContent>
                {productPerformance.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-muted-foreground">
                    No product sales data available for this period
                  </div>
                ) : (
                  <div className="space-y-3">
                    {productPerformance.map((product) => (
                      <div
                        key={product.name}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.quantity} units sold</p>
                        </div>
                        <p className="font-semibold">${product.revenue.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
