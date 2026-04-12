import { useState, useEffect, useCallback } from 'react';
import { Save, Store, Truck, Percent, Shield, Trash2, UserPlus, Loader2, Zap } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Badge } from '@/components/ui/badge';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/context/AuthContext';
import { ID, Query } from 'appwrite';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

import { FlashSaleManager } from '@/components/admin/FlashSaleManager';

interface AdminUser {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  email: string;
  created_at: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export default function AdminSettings() {
  const { user } = useAuth();
  const {
    storeSettings,
    shippingOptions,
    taxSettings,
    loading,
    saving,
    saveSettings,
    handleStoreChange,
    handleStoreFieldChange,
    handleShippingChange,
    handleTaxChange,
    addShippingOption,
    removeShippingOption,
  } = useSettings();

  // User roles state
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  const findRoleByUserId = useCallback(async (userId: string) => {
    const currentField = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.USER_ROLES,
      [Query.equal('userId', userId), Query.equal('role', 'admin')]
    );

    if (currentField.documents[0]) {
      return currentField.documents[0];
    }

    try {
      const legacyField = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_ROLES,
        [Query.equal('user_id', userId), Query.equal('role', 'admin')]
      );

      return legacyField.documents[0];
    } catch (error) {
      console.warn('Legacy user_id query not available for user_roles:', error);
      return undefined;
    }
  }, []);

  const fetchProfileName = useCallback(async (userId: string) => {
    const profileByCurrentField = await databases.listDocuments(
      DATABASE_ID,
      COLLECTIONS.PROFILES,
      [Query.equal('userId', userId), Query.limit(1)]
    );

    const currentProfile = profileByCurrentField.documents[0];
    if (currentProfile) {
      return currentProfile.fullName || currentProfile.username || userId;
    }

    try {
      const profileByLegacyField = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.PROFILES,
        [Query.equal('user_id', userId), Query.limit(1)]
      );

      const legacyProfile = profileByLegacyField.documents[0];
      return legacyProfile?.fullName || legacyProfile?.username || userId;
    } catch (error) {
      console.warn('Legacy user_id query not available for profiles:', error);
      return userId;
    }
  }, []);

  const fetchAdminUsers = useCallback(async () => {
    setLoadingRoles(true);
    try {
      // Get all user roles with admin role from Appwrite
      const rolesResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.USER_ROLES,
        [Query.equal('role', 'admin')]
      );

      // Get profile info for each admin user
      const adminUsersWithDetails: AdminUser[] = [];
      
      for (const role of rolesResponse.documents || []) {
        const userId = role.userId || role.user_id;

        if (!userId) {
          continue;
        }

        let displayName = userId;
        try {
          displayName = await fetchProfileName(userId);
        } catch (profileError) {
          console.warn(`Could not fetch profile for user ${userId}:`, profileError);
          // Fall back to using userId if profile fetch fails
        }

        adminUsersWithDetails.push({
          id: role.$id,
          user_id: userId,
          role: role.role as 'admin',
          email: displayName,
          created_at: role.$createdAt || role.created_at,
        });
      }

      setAdminUsers(adminUsersWithDetails);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast({
        title: 'Error',
        description: 'Failed to load admin users',
        variant: 'destructive',
      });
    } finally {
      setLoadingRoles(false);
    }
  }, [fetchProfileName]);

  // Load admin users
  useEffect(() => {
    fetchAdminUsers();
  }, [fetchAdminUsers]);

  const addAdminRole = async () => {
    if (!newAdminEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a user ID',
        variant: 'destructive',
      });
      return;
    }

    setAddingAdmin(true);
    try {
      const userId = newAdminEmail.trim();

      // Check if user already has admin role
      const existingRole = await findRoleByUserId(userId);

      if (existingRole) {
        toast({
          title: 'Already Admin',
          description: 'This user already has admin privileges',
          variant: 'destructive',
        });
        return;
      }

      // Add admin role
      try {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.USER_ROLES,
          ID.unique(),
          {
            userId,
            role: 'admin',
          }
        );
      } catch {
        // Backward compatibility for older schema names.
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.USER_ROLES,
          ID.unique(),
          {
            user_id: userId,
            role: 'admin',
          }
        );
      }

      toast({
        title: 'Admin Added',
        description: 'Successfully granted admin privileges',
      });

      setNewAdminEmail('');
      fetchAdminUsers();
    } catch (error: unknown) {
      console.error('Error adding admin:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to add admin role'),
        variant: 'destructive',
      });
    } finally {
      setAddingAdmin(false);
    }
  };

  const removeAdminRole = async (roleId: string, userId: string) => {
    try {
      // Get current user from context
      const currentUser = user;
      
      if (currentUser?.$id === userId) {
        toast({
          title: 'Error',
          description: 'You cannot remove your own admin privileges',
          variant: 'destructive',
        });
        return;
      }

      await databases.deleteDocument(
        DATABASE_ID,
        COLLECTIONS.USER_ROLES,
        roleId
      );

      toast({
        title: 'Admin Removed',
        description: 'Successfully revoked admin privileges',
      });

      fetchAdminUsers();
    } catch (error: unknown) {
      console.error('Error removing admin:', error);
      toast({
        title: 'Error',
        description: getErrorMessage(error, 'Failed to remove admin role'),
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure your store settings and preferences
            </p>
          </div>
          <Button onClick={saveSettings} disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="store" className="space-y-6">
          <TabsList>
            <TabsTrigger value="store" className="gap-2">
              <Store className="h-4 w-4" />
              Store
            </TabsTrigger>
            <TabsTrigger value="flash-sale" className="gap-2">
              <Zap className="h-4 w-4" />
              Flash Sale
            </TabsTrigger>
            <TabsTrigger value="shipping" className="gap-2">
              <Truck className="h-4 w-4" />
              Shipping
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-2">
              <Percent className="h-4 w-4" />
              Tax
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              User Roles
            </TabsTrigger>
          </TabsList>

          {/* Store Settings */}
          <TabsContent value="store">
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>
                  Basic information about your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      name="storeName"
                      value={storeSettings.storeName}
                      onChange={handleStoreChange}
                      placeholder="Your Store Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail">Contact Email</Label>
                    <Input
                      id="storeEmail"
                      name="storeEmail"
                      type="email"
                      value={storeSettings.storeEmail}
                      onChange={handleStoreChange}
                      placeholder="support@example.com"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">Phone Number</Label>
                    <Input
                      id="storePhone"
                      name="storePhone"
                      value={storeSettings.storePhone}
                      onChange={handleStoreChange}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      name="currency"
                      value={storeSettings.currency}
                      onChange={handleStoreChange}
                      placeholder="USD"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storeAddress">Store Address</Label>
                  <Input
                    id="storeAddress"
                    name="storeAddress"
                    value={storeSettings.storeAddress}
                    onChange={handleStoreChange}
                    placeholder="123 Main Street, City, Country"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    name="timezone"
                    value={storeSettings.timezone}
                    onChange={handleStoreChange}
                    placeholder="America/New_York"
                  />
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* Flash Sale Settings */}
          <TabsContent value="flash-sale">
            <FlashSaleManager />
          </TabsContent>

          {/* Shipping Settings */}
          <TabsContent value="shipping">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Shipping Options</CardTitle>
                  <CardDescription>
                    Configure available shipping methods
                  </CardDescription>
                </div>
                <Button onClick={addShippingOption} variant="outline" size="sm">
                  Add Option
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {shippingOptions.map((option, index) => (
                  <div key={option.id}>
                    {index > 0 && <Separator className="mb-6" />}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={option.enabled}
                            onCheckedChange={(checked) =>
                              handleShippingChange(option.id, 'enabled', checked)
                            }
                          />
                          <span className={option.enabled ? '' : 'text-muted-foreground'}>
                            {option.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        {shippingOptions.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => removeShippingOption(option.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Shipping Method</Label>
                          <Input
                            value={option.name}
                            onChange={(e) =>
                              handleShippingChange(option.id, 'name', e.target.value)
                            }
                            placeholder="Shipping method name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Price ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={option.price}
                            onChange={(e) =>
                              handleShippingChange(option.id, 'price', parseFloat(e.target.value) || 0)
                            }
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Estimated Delivery</Label>
                          <Input
                            value={option.estimatedDays}
                            onChange={(e) =>
                              handleShippingChange(option.id, 'estimatedDays', e.target.value)
                            }
                            placeholder="3-5 business days"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Settings */}
          <TabsContent value="tax">
            <Card>
              <CardHeader>
                <CardTitle>Tax Configuration</CardTitle>
                <CardDescription>
                  Configure tax settings for your store
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                  <div>
                    <p className="font-medium">Enable Tax</p>
                    <p className="text-sm text-muted-foreground">
                      Apply tax to orders at checkout
                    </p>
                  </div>
                  <Switch
                    checked={taxSettings.enableTax}
                    onCheckedChange={(checked) => handleTaxChange('enableTax', checked)}
                  />
                </div>

                {taxSettings.enableTax && (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="taxName">Tax Name</Label>
                        <Input
                          id="taxName"
                          value={taxSettings.taxName}
                          onChange={(e) => handleTaxChange('taxName', e.target.value)}
                          placeholder="Sales Tax"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="taxRate">Tax Rate (%)</Label>
                        <Input
                          id="taxRate"
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={taxSettings.taxRate}
                          onChange={(e) =>
                            handleTaxChange('taxRate', parseFloat(e.target.value) || 0)
                          }
                          placeholder="10"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium">Include Tax in Price</p>
                        <p className="text-sm text-muted-foreground">
                          Display prices with tax already included
                        </p>
                      </div>
                      <Switch
                        checked={taxSettings.includeTaxInPrice}
                        onCheckedChange={(checked) =>
                          handleTaxChange('includeTaxInPrice', checked)
                        }
                      />
                    </div>

                    <div className="p-4 border border-border rounded-lg">
                      <h4 className="font-medium mb-2">Preview</h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Product Price: $100.00</p>
                        <p>
                          {taxSettings.taxName} ({taxSettings.taxRate}%): $
                          {(100 * (taxSettings.taxRate / 100)).toFixed(2)}
                        </p>
                        <Separator className="my-2" />
                        <p className="font-medium text-foreground">
                          Total: ${(100 * (1 + taxSettings.taxRate / 100)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Roles Settings */}
          <TabsContent value="roles">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Admin User Management</CardTitle>
                  <CardDescription>
                    Manage users with administrator privileges
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {/* Add new admin */}
                <div className="p-4 bg-secondary/50 rounded-lg space-y-4">
                  <h4 className="font-medium">Add New Admin</h4>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter user ID (UUID)"
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter the Appwrite User ID from Profile Settings
                      </p>
                    </div>
                    <Button 
                      onClick={addAdminRole} 
                      disabled={addingAdmin || !newAdminEmail.trim()}
                      className="gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      {addingAdmin ? 'Adding...' : 'Add Admin'}
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Current admins list */}
                <div className="space-y-4">
                  <h4 className="font-medium">Current Administrators</h4>
                  
                  {loadingRoles ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading administrators...
                    </div>
                  ) : adminUsers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No administrators found
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {adminUsers.map((admin) => (
                        <div
                          key={admin.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Shield className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{admin.email}</p>
                              <p className="text-sm text-muted-foreground">
                                ID: {admin.user_id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">Admin</Badge>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove Admin Privileges?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will revoke admin access for this user. They will no longer be able to access the admin dashboard or manage the store.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => removeAdminRole(admin.id, admin.user_id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remove Admin
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
