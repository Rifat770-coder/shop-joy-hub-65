import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Query, ID } from 'appwrite';
import { useProducts } from '@/hooks/useProducts';
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
  const { data: products = [] } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState<Profile>({
    username: '',
    full_name: '',
    phone: '',
    shipping_address: '',
    avatar_url: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');

  const isSetupMode = new URLSearchParams(location.search).get('setup') === '1';

  useEffect(() => {
    if (isSetupMode) {
      setActiveTab('settings');
    }
  }, [isSetupMode]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PROFILES,
          [Query.equal('userId', user.$id)]
        );

        const data = response.documents[0];

        if (data) {
          setProfile({
            username: data.username || '',
            full_name: data.fullName || '',
            phone: data.phone || '',
            shipping_address: data.shippingAddress || '',
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
      // Check if profile exists
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.equal('userId', user.$id)]
      );

      const profileData = {
        username: profile.username,
        fullName: profile.full_name,
        phone: profile.phone,
        shippingAddress: profile.shipping_address,
      };

      if (response.documents.length > 0) {
        // Update existing profile
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.PROFILES,
          response.documents[0].$id,
          profileData
        );
      } else {
        // Create new profile
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.PROFILES,
          ID.unique(),
          {
            ...profileData,
            userId: user.$id,
          }
        );
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });

      if (isSetupMode) {
        navigate('/', { replace: true });
      }
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
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 mb-8">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 shrink-0">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="text-xl sm:text-2xl gradient-primary text-primary-foreground">
                {profile.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">
                {profile.full_name || 'Your Profile'}
              </h1>
              <p className="text-muted-foreground text-sm truncate">{user.email}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 w-full sm:w-auto"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="orders" className="gap-1 text-xs sm:text-sm">
                <Package className="h-4 w-4" />
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-1 text-xs sm:text-sm">
                <Heart className="h-4 w-4" />
                <span>Favorites</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-1 text-xs sm:text-sm">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
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
                          key={order.$id}
                          className="p-3 sm:p-4 border border-border rounded-lg space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm sm:text-base">Order #{order.$id.slice(0, 8)}</p>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {new Date(order.$createdAt).toLocaleDateString()} •{' '}
                                {order.items.length} items
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-bold text-sm sm:text-base">{order.total.toFixed(2)} BDT</p>
                              <Badge className={`${getStatusColor(order.status)} border text-xs`}>
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                          </div>

                          {/* Order Actions */}
                          <div className="pt-3 border-t border-border">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground min-w-0">
                                <MapPin className="h-4 w-4 shrink-0" />
                                <span className="truncate">
                                  {order.shippingAddress.split('\n')[0]}
                                </span>
                              </div>
                              <Link to={`/orders/${order.$id}`} className="shrink-0">
                                <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto">
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
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="userId">User ID</Label>
                          <div className="flex gap-2">
                            <Input
                              id="userId"
                              value={user.$id}
                              readOnly
                              className="bg-muted text-xs sm:text-sm min-w-0"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="shrink-0"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(user.$id);
                                  toast({
                                    title: 'Copied',
                                    description: 'User ID copied to clipboard.',
                                  });
                                } catch (error) {
                                  console.error('Failed to copy user ID:', error);
                                  toast({
                                    title: 'Copy failed',
                                    description: 'Please copy the ID manually.',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
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
