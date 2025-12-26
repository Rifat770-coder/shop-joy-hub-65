import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Full Coupon type for admin pages (fetched directly from DB by admins)
export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  minimum_order: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Simplified coupon info returned from secure RPC validation
export interface ValidatedCoupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}

export interface AppliedCoupon {
  coupon: ValidatedCoupon;
  discountAmount: number;
}

interface ValidateCouponResponse {
  valid: boolean;
  message: string;
  coupon_id?: string;
  code?: string;
  discount_type?: string;
  discount_value?: number;
  discount_amount?: number;
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
      // Use secure RPC function instead of direct SELECT
      const { data, error } = await supabase.rpc('validate_coupon_code', {
        p_code: code,
        p_order_total: orderTotal
      });

      if (error) throw error;

      const result = data as unknown as ValidateCouponResponse;

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
          id: result.coupon_id!,
          code: result.code!,
          discount_type: result.discount_type as 'percentage' | 'fixed',
          discount_value: result.discount_value!,
        },
        discountAmount: result.discount_amount!,
      };

      setAppliedCoupon(applied);

      toast({
        title: 'Coupon applied!',
        description: `You saved $${result.discount_amount!.toFixed(2)}`,
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
      // Use the existing RPC function for incrementing usage
      await supabase.rpc('increment_coupon_usage', { coupon_id: couponId });
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
