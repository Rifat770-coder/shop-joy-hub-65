import { useEffect, useMemo, useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  ArrowUpRight,
} from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';

interface DashboardOrder {
  $id: string;
  total: number;
  status: string;
  userId?: string;
  $createdAt: string;
}

interface DashboardProduct {
  $id: string;
  name: string;
  category: string;
  image?: string;
  price: number;
  stock: number;
  reviews?: number;
}

interface DashboardProfile {
  userId?: string;
  fullName?: string;
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'bg-success/10 text-success';
    case 'processing':
      return 'bg-info/10 text-info';
    case 'shipped':
      return 'bg-warning/10 text-warning';
    case 'pending':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function Dashboard() {
  const [orders, setOrders] = useState<DashboardOrder[]>([]);
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [profiles, setProfiles] = useState<DashboardProfile[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ordersRes, productsRes, profilesRes] = await Promise.all([
          databases.listDocuments(DATABASE_ID, COLLECTIONS.ORDERS),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.PRODUCTS),
          databases.listDocuments(DATABASE_ID, COLLECTIONS.PROFILES),
        ]);

        setOrders(ordersRes.documents as unknown as DashboardOrder[]);
        setProducts(productsRes.documents as unknown as DashboardProduct[]);
        setProfiles(profilesRes.documents as unknown as DashboardProfile[]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setOrders([]);
        setProducts([]);
        setProfiles([]);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    return [
      {
        title: 'Total Revenue',
        value: `${totalRevenue.toFixed(2)} BDT`,
        icon: DollarSign,
      },
      {
        title: 'Orders',
        value: orders.length.toString(),
        icon: ShoppingCart,
      },
      {
        title: 'Products',
        value: products.length.toString(),
        icon: Package,
      },
      {
        title: 'Customers',
        value: profiles.length.toString(),
        icon: Users,
      },
    ];
  }, [orders, products, profiles]);

  const profileNameByUserId = useMemo(() => {
    return new Map(
      profiles
        .filter((profile) => profile.userId)
        .map((profile) => [profile.userId as string, profile.fullName || 'Customer'])
    );
  }, [profiles]);

  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime())
      .slice(0, 5)
      .map((order) => ({
        id: order.$id,
        customer: order.userId ? profileNameByUserId.get(order.userId) || 'Customer' : 'Customer',
        total: `${Number(order.total || 0).toFixed(2)} BDT`,
        status: order.status || 'pending',
      }));
  }, [orders, profileNameByUserId]);

  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => Number(b.reviews || 0) - Number(a.reviews || 0))
      .slice(0, 5);
  }, [products]);

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's what's happening with your store.
          </p>
        </div>

        {/* Stats Grid */}
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
                <div className="text-sm text-muted-foreground mt-1">Live data from Appwrite</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <a href="/admin/orders" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders.length === 0 && (
                  <p className="text-sm text-muted-foreground">No real orders found.</p>
                )}
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="font-medium">{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-sm text-muted-foreground">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{order.total}</p>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Top Products</CardTitle>
              <a href="/admin/products" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.length === 0 && (
                  <p className="text-sm text-muted-foreground">No real products found.</p>
                )}
                {topProducts.map((product) => (
                  <div
                    key={product.$id}
                    className="flex items-center gap-4 py-2 border-b border-border last:border-0"
                  >
                    <img
                      src={product.image || '/placeholder.svg'}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{product.price.toFixed(2)} BDT</p>
                      <p className="text-sm text-muted-foreground">{product.stock} in stock</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
