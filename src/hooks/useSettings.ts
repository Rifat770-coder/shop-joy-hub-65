import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

export interface StoreSettings {
  storeName: string;
  storeEmail: string;
  storePhone: string;
  storeAddress: string;
  currency: string;
  timezone: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  enabled: boolean;
}

export interface TaxSettings {
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

export function useSettings() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(defaultShippingOptions);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(defaultTaxSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*');

      if (error) throw error;

      if (data) {
        data.forEach((setting) => {
          if (setting.key === 'store') {
            setStoreSettings(setting.value as unknown as StoreSettings);
          } else if (setting.key === 'shipping') {
            setShippingOptions(setting.value as unknown as ShippingOption[]);
          } else if (setting.key === 'tax') {
            setTaxSettings(setting.value as unknown as TaxSettings);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      // Upsert store settings
      const { error: storeError } = await supabase
        .from('store_settings')
        .update({ value: storeSettings as unknown as Json })
        .eq('key', 'store');

      if (storeError) throw storeError;

      // Upsert shipping settings
      const { error: shippingError } = await supabase
        .from('store_settings')
        .update({ value: shippingOptions as unknown as Json })
        .eq('key', 'shipping');

      if (shippingError) throw shippingError;

      // Upsert tax settings
      const { error: taxError } = await supabase
        .from('store_settings')
        .update({ value: taxSettings as unknown as Json })
        .eq('key', 'tax');

      if (taxError) throw taxError;

      toast({
        title: 'Settings saved',
        description: 'Your settings have been saved successfully.',
      });
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

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

  return {
    storeSettings,
    shippingOptions,
    taxSettings,
    loading,
    saving,
    saveSettings,
    handleStoreChange,
    handleShippingChange,
    handleTaxChange,
    addShippingOption,
    removeShippingOption,
    refetch: fetchSettings,
  };
}
