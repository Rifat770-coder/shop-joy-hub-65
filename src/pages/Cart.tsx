import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { Separator } from '@/components/ui/separator';
import { CouponInput } from '@/components/cart/CouponInput';
import { AppliedCoupon } from '@/hooks/useCoupons';
import { databases, DATABASE_ID, COLLECTIONS } from '@/integrations/appwrite/config';
import { getPrimaryImage } from '@/lib/image-utils';
import { useCurrency } from '@/hooks/useCurrency';

interface TaxSettings {
  enableTax: boolean;
  taxRate: number;
  taxName: string;
  includeTaxInPrice: boolean;
}

interface ShippingOption {
  enabled: boolean;
}

const parseSettingValue = <T,>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string') {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const Cart = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { formatCurrency } = useCurrency();
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    enableTax: false,
    taxRate: 0,
    taxName: 'Tax',
    includeTaxInPrice: false,
  });
  const [hasShippingOptions, setHasShippingOptions] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.STORE_SETTINGS
        );

        if (response.documents.length > 0) {
          const taxData = response.documents.find((setting) => setting.key === 'tax');
          const shippingData = response.documents.find((setting) => setting.key === 'shipping');

          if (taxData?.value) {
            const value = parseSettingValue<TaxSettings>(taxData.value, {
              enableTax: false,
              taxRate: 0,
              taxName: 'Tax',
              includeTaxInPrice: false,
            });

            setTaxSettings({
              enableTax: value.enableTax ?? false,
              taxRate: value.taxRate ?? 0,
              taxName: value.taxName ?? 'Tax',
              includeTaxInPrice: value.includeTaxInPrice ?? false,
            });
          }

          if (shippingData?.value) {
            const shippingOptions = parseSettingValue<ShippingOption[]>(
              shippingData.value,
              []
            );
            setHasShippingOptions(
              Array.isArray(shippingOptions) && shippingOptions.some((opt) => opt.enabled)
            );
          }
        }
      } catch (error) {
        console.error('Error fetching cart settings:', error);
      }
    };

    fetchSettings();
  }, []);

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const subtotalAfterDiscount = totalPrice - discountAmount;
  const tax = taxSettings.enableTax ? subtotalAfterDiscount * (taxSettings.taxRate / 100) : 0;
  const finalTotal = subtotalAfterDiscount + tax;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-16">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-secondary rounded-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
              <p className="text-muted-foreground">
                Looks like you haven't added anything to your cart yet.
              </p>
            </div>
            <Link to="/products">
              <Button variant="hero" size="lg" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div
                  key={item.product.id}
                  className="flex gap-4 bg-card rounded-xl border border-border p-4"
                >
                  <img
                    src={getPrimaryImage(item.product.image)}
                    alt={item.product.name}
                    className="w-24 h-24 object-cover rounded-lg shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/products/${item.product.id}`}
                      className="font-semibold hover:text-primary transition-colors line-clamp-1"
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.product.category}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-primary">
                          {formatCurrency(item.product.price * item.quantity)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={clearCart}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Cart
              </Button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
                <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                  
                  {/* Coupon Input */}
                  <CouponInput
                    orderTotal={totalPrice}
                    appliedCoupon={appliedCoupon}
                    onCouponApplied={setAppliedCoupon}
                  />
                  
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Discount</span>
                      <span>-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-muted-foreground">
                      {hasShippingOptions ? 'Calculated at checkout' : 'Free'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {taxSettings.taxName} {taxSettings.enableTax && `(${taxSettings.taxRate}%)`}
                    </span>
                    <span>
                      {taxSettings.enableTax ? formatCurrency(tax) : 'Not applicable'}
                    </span>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between font-semibold text-lg mb-6">
                  <span>Total</span>
                  <span className="text-primary">
                    {formatCurrency(finalTotal)}
                  </span>
                </div>

                <Link to="/checkout">
                  <Button variant="hero" className="w-full" size="lg">
                    Proceed to Checkout
                  </Button>
                </Link>

                <Link to="/products">
                  <Button variant="ghost" className="w-full mt-2">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
