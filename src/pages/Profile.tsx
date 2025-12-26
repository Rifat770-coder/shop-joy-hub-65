import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, Heart, Settings, LogOut, Save, Camera, Truck, MapPin, Eye } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useOrders } from '@/hooks/useOrders';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/integrations/supabase/client';
import { products } from '@/data/products';
import { ProductCard } from '@/components/products/ProductCard';
import { toast } from '@/hooks/use-toast';

interface Profile {
  username: string;
  full_name: string;
  phone: string;
  shipping_address: string;
  avatar_url: string;
}

const Profile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { orders, loading: ordersLoading } = useOrders();
  const { favorites, loading: favoritesLoading } = useFavorites();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<Profile>({
    username: '',
    full_name: '',
    phone: '',
    shipping_address: '',
    avatar_url: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setProfile({
            username: data.username || '',
            full_name: data.full_name || '',
            phone: data.phone || '',
            shipping_address: data.shipping_address || '',
            avatar_url: data.avatar_url || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          full_name: profile.full_name,
          phone: profile.phone,
          shipping_address: profile.shipping_address,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

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

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container max-w-5xl">
          {/* Profile Header */}
          <div className="flex items-center gap-6 mb-8">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-2xl gradient-primary text-primary-foreground">
                {profile.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {profile.full_name || 'Your Profile'}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="outline"
              className="ml-auto gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 max-w-md">
              <TabsTrigger value="orders" className="gap-2">
                <Package className="h-4 w-4" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-2">
                <Heart className="h-4 w-4" />
                Favorites
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Your Orders</CardTitle>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <p className="text-muted-foreground">Loading orders...</p>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No orders yet</p>
                      <Button
                        variant="default"
                        className="mt-4"
                        onClick={() => navigate('/products')}
                      >
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div
                          key={order.id}
                          className="p-4 border border-border rounded-lg space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()} •{' '}
                                {order.items.length} items
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">${order.total.toFixed(2)}</p>
                              <Badge className={`${getStatusColor(order.status)} border`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          
                          {/* Order Actions */}
                          <div className="pt-3 border-t border-border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate max-w-[200px]">
                                  {order.shipping_address.split('\n')[0]}
                                </span>
                              </div>
                              <Link to={`/orders/${order.id}`}>
                                <Button variant="outline" size="sm" className="gap-2">
                                  <Truck className="h-4 w-4" />
                                  Track Order
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle>Your Favorites</CardTitle>
                </CardHeader>
                <CardContent>
                  {favoritesLoading ? (
                    <p className="text-muted-foreground">Loading favorites...</p>
                  ) : favoriteProducts.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No favorites yet</p>
                      <Button
                        variant="default"
                        className="mt-4"
                        onClick={() => navigate('/products')}
                      >
                        Browse Products
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {favoriteProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {profileLoading ? (
                    <p className="text-muted-foreground">Loading profile...</p>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            value={profile.full_name}
                            onChange={(e) =>
                              setProfile({ ...profile, full_name: e.target.value })
                            }
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={profile.username}
                            onChange={(e) =>
                              setProfile({ ...profile, username: e.target.value })
                            }
                            placeholder="johndoe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            value={user.email || ''}
                            disabled
                            className="bg-muted"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={profile.phone}
                            onChange={(e) =>
                              setProfile({ ...profile, phone: e.target.value })
                            }
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Shipping Address</Label>
                        <Textarea
                          id="address"
                          value={profile.shipping_address}
                          onChange={(e) =>
                            setProfile({ ...profile, shipping_address: e.target.value })
                          }
                          placeholder="Enter your shipping address"
                          rows={3}
                        />
                      </div>

                      <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
