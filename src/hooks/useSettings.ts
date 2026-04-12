import { useState, useEffect, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { StoreSetting, StoreSettings, ShippingOption, TaxSettings } from '@/integrations/appwrite/types';
import { toast } from '@/hooks/use-toast';
import { Query, ID } from 'appwrite';

const defaultStoreSettings: StoreSettings = {
  storeName: 'RealGadget BD',
  storeEmail: 'support@realgadgetbd.com',
  storePhone: '+1 (555) 123-4567',
  storeAddress: '123 Commerce Street, New York, NY 10001',
  currency: 'USD',
  timezone: 'America/New_York',
  showFlashSale: true,
};

const defaultShippingOptions: ShippingOption[] = [
  { id: 'inside_dhaka', name: 'Inside Dhaka', price: 60, estimatedDays: '1-2 business days', enabled: true },
  { id: 'outside_dhaka', name: 'Outside Dhaka', price: 120, estimatedDays: '3-5 business days', enabled: true },
];

const defaultTaxSettings: TaxSettings = {
  enableTax: true,
  taxRate: 10,
  taxName: 'Sales Tax',
  includeTaxInPrice: false,
};

const parseSettingValue = <T>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const stringifySettingValue = (value: unknown): string => JSON.stringify(value);

export function useSettings() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(defaultStoreSettings);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(defaultShippingOptions);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>(defaultTaxSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STORE_SETTINGS
      );

      if (response.documents) {
        response.documents.forEach((setting: StoreSetting) => {
          if (setting.key === 'store') {
            const parsedStoreSettings = parseSettingValue<Partial<StoreSettings>>(
              setting.value,
              defaultStoreSettings
            );
            setStoreSettings({
              ...defaultStoreSettings,
              ...parsedStoreSettings,
            });
          } else if (setting.key === 'shipping') {
            setShippingOptions(
              parseSettingValue<ShippingOption[]>(setting.value, defaultShippingOptions)
            );
          } else if (setting.key === 'tax') {
            setTaxSettings(
              parseSettingValue<TaxSettings>(setting.value, defaultTaxSettings)
            );
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
      // Update store settings
      const storeResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STORE_SETTINGS,
        [Query.equal('key', 'store')]
      );

      if (storeResponse.documents.length > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.STORE_SETTINGS,
          storeResponse.documents[0].$id,
          { value: stringifySettingValue(storeSettings) }
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.STORE_SETTINGS,
          ID.unique(),
          { key: 'store', value: stringifySettingValue(storeSettings) }
        );
      }

      // Update shipping settings
      const shippingResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STORE_SETTINGS,
        [Query.equal('key', 'shipping')]
      );

      if (shippingResponse.documents.length > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.STORE_SETTINGS,
          shippingResponse.documents[0].$id,
          { value: stringifySettingValue(shippingOptions) }
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.STORE_SETTINGS,
          ID.unique(),
          { key: 'shipping', value: stringifySettingValue(shippingOptions) }
        );
      }

      // Update tax settings
      const taxResponse = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.STORE_SETTINGS,
        [Query.equal('key', 'tax')]
      );

      if (taxResponse.documents.length > 0) {
        await databases.updateDocument(
          DATABASE_ID,
          COLLECTIONS.STORE_SETTINGS,
          taxResponse.documents[0].$id,
          { value: stringifySettingValue(taxSettings) }
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.STORE_SETTINGS,
          ID.unique(),
          { key: 'tax', value: stringifySettingValue(taxSettings) }
        );
      }

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

  const handleStoreFieldChange = (field: keyof StoreSettings, value: StoreSettings[keyof StoreSettings]) => {
    setStoreSettings((prev) => ({ ...prev, [field]: value }));
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
    handleStoreFieldChange,
    handleShippingChange,
    handleTaxChange,
    addShippingOption,
    removeShippingOption,
    refetch: fetchSettings,
  };
}
