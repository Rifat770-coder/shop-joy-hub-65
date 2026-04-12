import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { databases, DATABASE_ID, COLLECTIONS, isAppwriteConfigured } from '@/integrations/appwrite/config';
import { FlashSaleSettings, FlashSaleCountdown } from '@/types/flashSale';
import { Query, ID } from 'appwrite';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

/**
 * Hook to get Flash Sale settings
 */
export const useFlashSaleSettings = () => {
  return useQuery<FlashSaleSettings | null>({
    queryKey: ['flash-sale-settings'],
    queryFn: async () => {
      try {
        if (!isAppwriteConfigured) {
          return null;
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.FLASH_SALE,
          [Query.orderDesc('$createdAt'), Query.limit(1)]
        );

        if (response.documents.length > 0) {
          const doc = response.documents[0];
          return {
            id: doc.$id,
            isActive: doc.isActive || false,
            title: doc.title || 'Flash Sale',
            subtitle: doc.subtitle || 'Limited time offer!',
            discountPercentage: doc.discountPercentage || 50,
            startDate: doc.startDate || new Date().toISOString(),
            endDate: doc.endDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            backgroundColor: doc.backgroundColor || 'from-orange-400 via-pink-400 to-purple-500',
            textColor: doc.textColor || 'text-white',
            buttonText: doc.buttonText || 'Shop Now',
            targetUrl: doc.targetUrl || '/deals',
            categories: doc.categories || [],
            products: doc.products || [],
            createdAt: doc.$createdAt,
            updatedAt: doc.$updatedAt,
          } as FlashSaleSettings;
        }

        return null;
      } catch (error) {
        console.error('Error fetching flash sale settings:', error);
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to update Flash Sale settings
 */
export const useUpdateFlashSale = () => {
  const queryClient = useQueryClient();
  const FLASH_SALE_FIELDS: Array<keyof FlashSaleSettings> = [
    'isActive',
    'title',
    'subtitle',
    'discountPercentage',
    'startDate',
    'endDate',
    'backgroundColor',
    'textColor',
    'buttonText',
    'targetUrl',
    'categories',
    'products',
  ];

  const buildPayload = (settings: Partial<FlashSaleSettings>) => {
    const payload: Partial<FlashSaleSettings> = {};

    for (const key of FLASH_SALE_FIELDS) {
      const value = settings[key];
      if (value !== undefined) {
        payload[key] = value;
      }
    }

    return payload;
  };

  return useMutation({
    mutationFn: async (settings: Partial<FlashSaleSettings>) => {
      try {
        if (!isAppwriteConfigured) {
          throw new Error('Appwrite is not configured. Please check your .env settings.');
        }

        const payload = buildPayload(settings);
        const explicitId = settings.id;
        const cached = queryClient.getQueryData<FlashSaleSettings | null>([
          'flash-sale-settings',
        ]);
        const cachedId = cached?.id;
        const updateId = explicitId || cachedId;

        if (updateId) {
          return await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.FLASH_SALE,
            updateId,
            payload
          );
        }

        // Get existing settings
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.FLASH_SALE,
          [Query.limit(1)]
        );

        if (response.documents.length > 0) {
          // Update existing
          const docId = response.documents[0].$id;
          return await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.FLASH_SALE,
            docId,
            payload
          );
        } else {
          // Create new
          const docId = ID.unique();
          return await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.FLASH_SALE,
            docId,
            {
              ...payload,
              isActive: settings.isActive || false,
              title: settings.title || 'Flash Sale',
              subtitle: settings.subtitle || 'Limited time offer!',
              discountPercentage: settings.discountPercentage || 50,
              startDate: settings.startDate || new Date().toISOString(),
              endDate: settings.endDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              backgroundColor: settings.backgroundColor || 'from-orange-400 via-pink-400 to-purple-500',
              textColor: settings.textColor || 'text-white',
              buttonText: settings.buttonText || 'Shop Now',
              targetUrl: settings.targetUrl || '/deals',
              categories: settings.categories || [],
              products: settings.products || [],
            }
          );
        }
      } catch (error) {
        console.error('Error updating flash sale settings:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flash-sale-settings'] });
      toast({
        title: 'Flash Sale Updated',
        description: 'Flash sale settings have been updated successfully.',
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'Failed to update flash sale settings.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook to calculate countdown timer
 */
export const useFlashSaleCountdown = (endDate: string): FlashSaleCountdown => {
  const [countdown, setCountdown] = useState<FlashSaleCountdown>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const difference = end - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({
          days,
          hours,
          minutes,
          seconds,
          isExpired: false,
        });
      } else {
        setCountdown({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
        });
      }
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endDate]);

  return countdown;
};

/**
 * Hook to check if flash sale is currently active
 */
export const useIsFlashSaleActive = () => {
  const { data: settings } = useFlashSaleSettings();

  if (!settings || !settings.isActive) {
    return false;
  }

  const now = new Date().getTime();
  const start = new Date(settings.startDate).getTime();
  const end = new Date(settings.endDate).getTime();

  return now >= start && now <= end;
};