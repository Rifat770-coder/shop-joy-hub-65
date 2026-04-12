import { useState, useCallback } from 'react';
import { databases, functions, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { Coupon } from '@/integrations/appwrite/types';
import { toast } from '@/hooks/use-toast';
import { Query } from 'appwrite';

// Simplified coupon info returned from validation
export interface ValidatedCoupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
}

export interface AppliedCoupon {
  coupon: ValidatedCoupon;
  discountAmount: number;
}

interface ValidateCouponResponse {
  valid: boolean;
  message: string;
  couponId?: string;
  code?: string;
  discountType?: string;
  discountValue?: number;
  discountAmount?: number;
}

export function useCoupons() {
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const validateCoupon = useCallback(async (code: string, orderTotal: number): Promise<AppliedCoupon | null> => {
    if (!code.trim()) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a coupon code.',
        variant: 'destructive',
      });
      return null;
    }

    setLoading(true);

    try {
      // Use Appwrite function for coupon validation
      const response = await functions.createExecution(
        'validate-coupon', // Function ID
        JSON.stringify({
          code: code,
          orderTotal: orderTotal
        }),
        false, // async
        '/', // path
        'POST' // method
      );

      const result = JSON.parse(response.responseBody) as ValidateCouponResponse;

      if (!result.valid) {
        toast({
          title: 'Invalid coupon',
          description: result.message,
          variant: 'destructive',
        });
        return null;
      }

      const applied: AppliedCoupon = {
        coupon: {
          id: result.couponId!,
          code: result.code!,
          discountType: result.discountType as 'percentage' | 'fixed',
          discountValue: result.discountValue!,
        },
        discountAmount: result.discountAmount!,
      };

      setAppliedCoupon(applied);

      toast({
        title: 'Coupon applied!',
        description: `You saved $${result.discountAmount!.toFixed(2)}`,
      });

      return applied;
    } catch (error: any) {
      console.error('Error validating coupon:', error);
      toast({
        title: 'Error',
        description: 'Failed to validate coupon.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    toast({
      title: 'Coupon removed',
      description: 'The coupon has been removed from your order.',
    });
  }, []);

  const incrementCouponUsage = useCallback(async (couponId: string) => {
    try {
      // Get current coupon and increment usage
      const coupon = await databases.getDocument(DATABASE_ID, COLLECTIONS.COUPONS, couponId) as Coupon;
      await databases.updateDocument(
        DATABASE_ID,
        COLLECTIONS.COUPONS,
        couponId,
        { usedCount: coupon.usedCount + 1 }
      );
    } catch (error) {
      console.error('Error incrementing coupon usage:', error);
    }
  }, []);

  return {
    loading,
    appliedCoupon,
    validateCoupon,
    removeCoupon,
    incrementCouponUsage,
    setAppliedCoupon,
  };
}