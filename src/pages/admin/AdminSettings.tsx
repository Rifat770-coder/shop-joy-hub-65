import { useState, useEffect } from 'react';
import { Save, Store, Truck, Percent, Check } from 'lucide-react';
import { AdminLayout } from './AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';

interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  timezone: string;
}

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  enabled: boolean;
}

interface TaxSettings {
  enableTax: boolean;
  taxRate: number;
  taxName: string;
  includeTaxInPrice: boolean;
}

const defaultStoreSettings: StoreSettings = {
  storeName: 'ShopHub',
  storeEmail: 'support@shophub.com',
  storePhone: '+1 (555) 123-4567',
  storeAddress: '123 Commerce Street, New York, NY 10001',
  currency: 'USD',
  timezone: 'America/New_York',
};

const defaultShippingOptions: ShippingOption[] = [
  { id: '1', name: 'Standard Shipping', price: 0, estimatedDays: '5-7 business days', enabled: true },
  { id: '2', name: 'Express Shipping', price: 9.99, estimatedDays: '2-3 business days', enabled: true },
  { id: '3', name: 'Overnight Shipping', price: 24.99, estimatedDays: '1 business day', enabled: true },
  { id: '4', name: 'International Shipping', price: 29.99, estimatedDays: '10-14 business days', enabled: false },
];

const defaultTaxSettings: TaxSettings = {
  enableTax: true,
  taxRate: 10,
  taxName: 'Sales Tax',
  includeTaxInPrice: false,
};

export default function AdminSettings() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(defaultShippingOptions);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(defaultTaxSettings);
  const [saving, setSaving] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedStore = localStorage.getItem('admin_store_settings');
    const savedShipping = localStorage.getItem('admin_shipping_options');
    const savedTax = localStorage.getItem('admin_tax_settings');

    if (savedStore) setStoreSettings(JSON.parse(savedStore));
    if (savedShipping) setShippingOptions(JSON.parse(savedShipping));
    if (savedTax) setTaxSettings(JSON.parse(savedTax));
  }, []);

  const handleStoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setStoreSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = (id: string, field: keyof ShippingOption, value: string | number | boolean) => {
    setShippingOptions((prev) =>
      prev.map((option) =>
        option.id === id ? { ...option, [field]: value } : option
      )
    );
  };

  const handleTaxChange = (field: keyof TaxSettings, value: string | number | boolean) => {
    setTaxSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveSettings = async () => {
    setSaving(true);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Save to localStorage
    localStorage.setItem('admin_store_settings', JSON.stringify(storeSettings));
    localStorage.setItem('admin_shipping_options', JSON.stringify(shippingOptions));
    localStorage.setItem('admin_tax_settings', JSON.stringify(taxSettings));

    toast({
      title: 'Settings saved',
      description: 'Your settings have been saved successfully.',
    });

    setSaving(false);
  };

  const addShippingOption = () => {
    const newOption: ShippingOption = {
      id: Date.now().toString(),
      name: 'New Shipping Option',
      price: 0,
      estimatedDays: '3-5 business days',
      enabled: true,
    };
    setShippingOptions((prev) => [...prev, newOption]);
  };

  const removeShippingOption = (id: string) => {
    setShippingOptions((prev) => prev.filter((option) => option.id !== id));
  };

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
              <>Saving...</>
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
            <TabsTrigger value="shipping" className="gap-2">
              <Truck className="h-4 w-4" />
              Shipping
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-2">
              <Percent className="h-4 w-4" />
              Tax
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
        </Tabs>
      </div>
    </AdminLayout>
  );
}
