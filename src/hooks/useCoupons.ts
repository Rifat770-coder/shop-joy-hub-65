import { useState, useCallback } from 'react';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
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
      toast({ title: 'Invalid code', description: 'Please enter a coupon code.', variant: 'destructive' });
      return null;
    }

    setLoading(true);
    try {
      // Query Appwrite directly — no function needed
      const response = await databases.listDocuments(
        DATABASE_ID,
        COLLECTIONS.COUPONS,
        [
          Query.equal('code', code.trim().toUpperCase()),
          Query.equal('isActive', true),
        ]
      );

      if (response.documents.length === 0) {
        toast({ title: 'Invalid coupon', description: 'Coupon not found or inactive.', variant: 'destructive' });
        return null;
      }

      const coupon = response.documents[0] as unknown as Coupon;
      const now = new Date();

      if (coupon.startsAt && new Date(coupon.startsAt) > now) {
        toast({ title: 'Invalid coupon', description: 'Coupon is not yet valid.', variant: 'destructive' });
        return null;
      }
      if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
        toast({ title: 'Expired coupon', description: 'This coupon has expired.', variant: 'destructive' });
        return null;
      }
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        toast({ title: 'Invalid coupon', description: 'Coupon usage limit reached.', variant: 'destructive' });
        return null;
      }
      if (coupon.minimumOrder && orderTotal < coupon.minimumOrder) {
        toast({ title: 'Invalid coupon', description: `Minimum order of ${coupon.minimumOrder} BDT required.`, variant: 'destructive' });
        return null;
      }

      let discountAmount = 0;
      if (coupon.discountType === 'percentage') {
        discountAmount = orderTotal * (coupon.discountValue / 100);
      } else {
        discountAmount = coupon.discountValue;
      }
      discountAmount = Math.min(discountAmount, orderTotal);

      const applied: AppliedCoupon = {
        coupon: {
          id: coupon.$id,
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
        },
        discountAmount,
      };

      setAppliedCoupon(applied);
      toast({ title: 'Coupon applied!', description: `You saved ${discountAmount.toFixed(0)} BDT` });
      return applied;

    } catch (error) {
      console.error('Coupon validation error:', error);
      toast({ title: 'Error', description: 'Failed to validate coupon.', variant: 'destructive' });
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