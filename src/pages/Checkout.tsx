import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CouponInput } from '@/components/cart/CouponInput';
import { AppliedCoupon } from '@/hooks/useCoupons';

interface ShippingForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  
  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
  });

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const subtotalAfterDiscount = totalPrice - discountAmount;
  const tax = subtotalAfterDiscount * 0.1;
  const total = subtotalAfterDiscount + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateShippingForm = () => {
    const required = ['fullName', 'email', 'address', 'city', 'state', 'zipCode'];
    for (const field of required) {
      if (!shippingForm[field as keyof ShippingForm]?.trim()) {
        toast({
          title: 'Missing information',
          description: `Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateShippingForm()) {
      setStep('payment');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      toast({
        title: 'Please sign in',
        description: 'You need to be signed in to place an order.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      const shippingAddress = `${shippingForm.fullName}\n${shippingForm.address}\n${shippingForm.city}, ${shippingForm.state} ${shippingForm.zipCode}\n${shippingForm.country}\nPhone: ${shippingForm.phone || 'N/A'}`;

      const orderItems = items.map((item) => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
        },
        quantity: item.quantity,
      }));

      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          items: orderItems,
          total: total,
          status: 'pending',
          shipping_address: shippingAddress,
        })
        .select('id')
        .single();

      if (error) throw error;

      // Send order confirmation email
      try {
        await supabase.functions.invoke('send-order-confirmation', {
          body: {
            orderId: data.id,
            customerEmail: shippingForm.email,
            customerName: shippingForm.fullName,
            items: orderItems,
            subtotal: totalPrice,
            discount: discountAmount,
            tax: tax,
            total: total,
            shippingAddress: shippingAddress,
          },
        });
        console.log('Order confirmation email sent');
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the order if email fails
      }

      setOrderId(data.id);
      setStep('confirmation');
      clearCart();

      toast({
        title: 'Order placed successfully!',
        description: 'A confirmation email has been sent to your inbox.',
      });
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0 && step !== 'confirmation') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <Link to="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!user && step !== 'confirmation') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Lock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Sign in to checkout</h1>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to complete your purchase.
            </p>
            <Link to="/auth">
              <Button>Sign In</Button>
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
        <div className="container max-w-6xl">
          {/* Progress Steps */}
          {step !== 'confirmation' && (
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'shipping' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    1
                  </div>
                  <span className="hidden sm:inline font-medium">Shipping</span>
                </div>
                <div className="w-12 h-0.5 bg-border" />
                <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'payment' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                    2
                  </div>
                  <span className="hidden sm:inline font-medium">Payment</span>
                </div>
                <div className="w-12 h-0.5 bg-border" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <span className="hidden sm:inline font-medium">Confirmation</span>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Step */}
          {step === 'confirmation' && (
            <div className="max-w-lg mx-auto text-center py-12">
              <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h1 className="text-3xl font-bold mb-4">Order Confirmed!</h1>
              <p className="text-muted-foreground mb-2">
                Thank you for your purchase. Your order has been placed successfully.
              </p>
              <p className="text-sm text-muted-foreground mb-8">
                Order ID: <span className="font-mono font-medium">{orderId?.slice(0, 8).toUpperCase()}</span>
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/orders">
                  <Button variant="default">View Orders</Button>
                </Link>
                <Link to="/products">
                  <Button variant="outline">Continue Shopping</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Shipping & Payment Steps */}
          {step !== 'confirmation' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Shipping Form */}
                {step === 'shipping' && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Truck className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Shipping Information</h2>
                    </div>

                    <div className="grid gap-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name *</Label>
                          <Input
                            id="fullName"
                            name="fullName"
                            value={shippingForm.fullName}
                            onChange={handleInputChange}
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={shippingForm.email}
                            onChange={handleInputChange}
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={shippingForm.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="address">Street Address *</Label>
                        <Input
                          id="address"
                          name="address"
                          value={shippingForm.address}
                          onChange={handleInputChange}
                          placeholder="123 Main Street, Apt 4B"
                        />
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            name="city"
                            value={shippingForm.city}
                            onChange={handleInputChange}
                            placeholder="New York"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State *</Label>
                          <Input
                            id="state"
                            name="state"
                            value={shippingForm.state}
                            onChange={handleInputChange}
                            placeholder="NY"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">ZIP Code *</Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            value={shippingForm.zipCode}
                            onChange={handleInputChange}
                            placeholder="10001"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          name="country"
                          value={shippingForm.country}
                          onChange={handleInputChange}
                          placeholder="United States"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between mt-6">
                      <Link to="/cart">
                        <Button variant="ghost" className="gap-2">
                          <ArrowLeft className="h-4 w-4" />
                          Back to Cart
                        </Button>
                      </Link>
                      <Button onClick={handleContinueToPayment}>
                        Continue to Payment
                      </Button>
                    </div>
                  </div>
                )}

                {/* Payment Form */}
                {step === 'payment' && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Payment Method</h2>
                    </div>

                    <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                      <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card" className="flex-1 cursor-pointer">
                          <div className="font-medium">Credit / Debit Card</div>
                          <div className="text-sm text-muted-foreground">
                            Pay securely with your card
                          </div>
                        </Label>
                        <div className="flex gap-1">
                          <div className="w-10 h-6 bg-secondary rounded flex items-center justify-center text-xs font-bold">VISA</div>
                          <div className="w-10 h-6 bg-secondary rounded flex items-center justify-center text-xs font-bold">MC</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                        <RadioGroupItem value="cod" id="cod" />
                        <Label htmlFor="cod" className="flex-1 cursor-pointer">
                          <div className="font-medium">Cash on Delivery</div>
                          <div className="text-sm text-muted-foreground">
                            Pay when you receive your order
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    {paymentMethod === 'card' && (
                      <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
                        <p className="text-sm text-muted-foreground text-center">
                          💳 Card payment integration coming soon. For now, your order will be placed as pending payment.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-between mt-6">
                      <Button variant="ghost" className="gap-2" onClick={() => setStep('shipping')}>
                        <ArrowLeft className="h-4 w-4" />
                        Back to Shipping
                      </Button>
                      <Button onClick={handlePlaceOrder} disabled={isSubmitting}>
                        {isSubmitting ? 'Placing Order...' : 'Place Order'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                  <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                  {/* Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex gap-3">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-14 h-14 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  {/* Coupon Input */}
                  <CouponInput
                    orderTotal={totalPrice}
                    appliedCoupon={appliedCoupon}
                    onCouponApplied={setAppliedCoupon}
                  />

                  <Separator className="my-4" />

                  {/* Totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${totalPrice.toFixed(2)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm text-success">
                        <span>Discount ({appliedCoupon.coupon.code})</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className="text-success">Free</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tax (10%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>

                  {/* Shipping Address Preview */}
                  {step === 'payment' && shippingForm.address && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <p className="text-sm font-medium mb-2">Shipping to:</p>
                        <p className="text-sm text-muted-foreground">
                          {shippingForm.fullName}<br />
                          {shippingForm.address}<br />
                          {shippingForm.city}, {shippingForm.state} {shippingForm.zipCode}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
