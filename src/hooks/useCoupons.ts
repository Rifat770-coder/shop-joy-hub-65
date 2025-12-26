import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

export interface AppliedCoupon {
  coupon: Coupon;
  discountAmount: number;
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
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (!coupon) {
        toast({
          title: 'Invalid coupon',
          description: 'This coupon code is not valid.',
          variant: 'destructive',
        });
        return null;
      }

      // Check if coupon has started
      if (coupon.starts_at && new Date(coupon.starts_at) > new Date()) {
        toast({
          title: 'Coupon not active',
          description: 'This coupon is not yet active.',
          variant: 'destructive',
        });
        return null;
      }

      // Check if coupon has expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast({
          title: 'Coupon expired',
          description: 'This coupon has expired.',
          variant: 'destructive',
        });
        return null;
      }

      // Check usage limit
      if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
        toast({
          title: 'Coupon exhausted',
          description: 'This coupon has reached its usage limit.',
          variant: 'destructive',
        });
        return null;
      }

      // Check minimum order
      if (orderTotal < coupon.minimum_order) {
        toast({
          title: 'Minimum not met',
          description: `This coupon requires a minimum order of $${coupon.minimum_order.toFixed(2)}.`,
          variant: 'destructive',
        });
        return null;
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmount = (orderTotal * coupon.discount_value) / 100;
      } else {
        discountAmount = Math.min(coupon.discount_value, orderTotal);
      }

      const applied: AppliedCoupon = {
        coupon: coupon as Coupon,
        discountAmount,
      };

      setAppliedCoupon(applied);

      toast({
        title: 'Coupon applied!',
        description: `You saved $${discountAmount.toFixed(2)}`,
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
      const { error } = await supabase.rpc('increment_coupon_usage', { coupon_id: couponId });
      if (error) {
        console.error('Error incrementing coupon usage:', error);
      }
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
