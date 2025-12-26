import { useState } from 'react';
import { Tag, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCoupons, AppliedCoupon } from '@/hooks/useCoupons';

interface CouponInputProps {
  orderTotal: number;
  appliedCoupon: AppliedCoupon | null;
  onCouponApplied: (coupon: AppliedCoupon | null) => void;
}

export function CouponInput({ orderTotal, appliedCoupon, onCouponApplied }: CouponInputProps) {
  const [code, setCode] = useState('');
  const { loading, validateCoupon, removeCoupon } = useCoupons();

  const handleApply = async () => {
    const result = await validateCoupon(code, orderTotal);
    if (result) {
      onCouponApplied(result);
      setCode('');
    }
  };

  const handleRemove = () => {
    removeCoupon();
    onCouponApplied(null);
  };

  if (appliedCoupon) {
    return (
      <div className="bg-success/10 border border-success/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-success" />
            <div>
              <p className="text-sm font-medium text-success">
                {appliedCoupon.coupon.code}
              </p>
              <p className="text-xs text-muted-foreground">
                {appliedCoupon.coupon.discount_type === 'percentage'
                  ? `${appliedCoupon.coupon.discount_value}% off`
                  : `$${appliedCoupon.coupon.discount_value.toFixed(2)} off`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="pl-10 uppercase"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApply();
              }
            }}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={loading || !code.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </Button>
      </div>
    </div>
  );
}
