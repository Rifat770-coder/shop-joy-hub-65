import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, CheckCircle, ArrowLeft, Lock, Smartphone, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { databases, functions, DATABASE_ID, COLLECTIONS, FUNCTION_IDS } from '@/integrations/appwrite/config';
import { ShippingOption, TaxSettings } from '@/integrations/appwrite/types';
import { toast } from '@/hooks/use-toast';
import { CouponInput } from '@/components/cart/CouponInput';
import { AppliedCoupon } from '@/hooks/useCoupons';
import { ExecutionMethod, Query } from 'appwrite';
import { useSettings } from '@/hooks/useSettings';

type PaymentMethod = 'bkash' | 'nagad' | 'cod';
type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed' | 'refunded';

interface ShippingForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

const defaultTaxSettings: TaxSettings = {
  enableTax: true,
  taxRate: 10,
  taxName: 'Sales Tax',
  includeTaxInPrice: false,
};

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

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const { storeSettings } = useSettings();

  // Currency formatter derived from admin Store settings
  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: storeSettings.currency || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${storeSettings.currency} ${amount.toFixed(2)}`;
    }
  };

  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  // Shipping and Tax settings from database
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    fullName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Fetch shipping and tax settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.STORE_SETTINGS
        );

        if (response.documents) {
          response.documents.forEach((setting) => {
            if (setting.key === 'shipping') {
              const options = parseSettingValue<ShippingOption[]>(setting.value, []);
              const enabledOptions = options.filter(opt => opt.enabled);
              setShippingOptions(enabledOptions);
              if (enabledOptions.length > 0) {
                setSelectedShipping(enabledOptions[0].id);
              }
            } else if (setting.key === 'tax') {
              setTaxSettings(parseSettingValue<TaxSettings>(setting.value, defaultTaxSettings));
            }
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, []);

  // Auto-fill shipping form from saved profile
  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTIONS.PROFILES,
          [Query.equal('userId', user.$id)]
        );
        const data = response.documents[0];
        if (!data) return;

        // Parse the free-text shippingAddress into form fields
        // Expected format saved by Profile page: "Street\nCity, State ZIP\nCountry"
        const rawAddress: string = data.shippingAddress || '';
        const lines = rawAddress.split('\n').map((l: string) => l.trim()).filter(Boolean);

        let address = '';
        let city = '';
        let state = '';
        let zipCode = '';

        if (lines.length >= 1) address = lines[0];
        if (lines.length >= 2) {
          const cityLine = lines[1];
          const commaIdx = cityLine.indexOf(',');
          if (commaIdx !== -1) {
            city = cityLine.slice(0, commaIdx).trim();
            const rest = cityLine.slice(commaIdx + 1).trim();
            const parts = rest.split(' ');
            zipCode = parts.pop() || '';
            state = parts.join(' ');
          } else {
            city = cityLine;
          }
        }

        setShippingForm((prev) => ({
          ...prev,
          fullName: data.fullName || prev.fullName,
          phone: data.phone || prev.phone,
          email: prev.email || user.email || '',
          address: address || prev.address,
          city: city || prev.city,
          state: state || prev.state,
          zipCode: zipCode || prev.zipCode,
        }));
      } catch (error) {
        console.error('Error fetching profile for autofill:', error);
      }
    };
    fetchProfile();
  }, [user]);

  // Update shipping option dynamically based on address city
  useEffect(() => {
    if (shippingOptions.length > 0 && shippingForm.city) {
      const city = shippingForm.city.trim().toLowerCase();
      const isDhaka = city === 'dhaka' || city.includes('dhaka');
      
      if (isDhaka) {
        const insideOpt = shippingOptions.find(opt => opt.name.toLowerCase().includes('inside dhaka'));
        if (insideOpt) setSelectedShipping(insideOpt.id);
      } else {
        const outsideOpt = shippingOptions.find(opt => opt.name.toLowerCase().includes('outside dhaka'));
        if (outsideOpt) setSelectedShipping(outsideOpt.id);
      }
    }
  }, [shippingForm.city, shippingOptions]);

  const selectedShippingOption = shippingOptions.find(opt => opt.id === selectedShipping) ?? shippingOptions[0] ?? null;
  const shippingCost = selectedShippingOption?.price ?? 0;
  const discountAmount = appliedCoupon?.discountAmount || 0;
  const subtotalAfterDiscount = totalPrice - discountAmount;
  const taxRate = taxSettings?.enableTax ? (taxSettings.taxRate / 100) : 0;
  const tax = subtotalAfterDiscount * taxRate;
  const total = subtotalAfterDiscount + tax + shippingCost;

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

    if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !transactionId.trim()) {
      toast({
        title: 'Transaction ID required',
        description: `Please enter your ${paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} transaction ID before placing the order.`,
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const shippingAddress = `${shippingForm.fullName}\n${shippingForm.address}\n${shippingForm.city}, ${shippingForm.state} ${shippingForm.zipCode}\nPhone: ${shippingForm.phone || 'N/A'}`;

      // Send only product IDs and quantities - prices are validated server-side
      const orderItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      }));

      const fallbackOrderItems = items.map((item) => ({
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          image: item.product.image,
        },
        quantity: item.quantity,
      }));

      const initialPaymentStatus: PaymentStatus = paymentMethod === 'cod' ? 'pending' : 'pending';

      let data: {
        success: boolean;
        orderId: string;
        subtotal: number;
        discount: number;
        tax: number;
        total: number;
        error?: string;
      };

      try {
        // Use secure Appwrite function for order creation when available.
        const response = await functions.createExecution(
          FUNCTION_IDS.CREATE_ORDER,
          JSON.stringify({
            items: orderItems,
            shippingAddress: shippingAddress,
            couponCode: appliedCoupon?.coupon?.code || undefined,
            paymentMethod,
            paymentStatus: initialPaymentStatus,
            transactionId: transactionId.trim() || undefined,
            shippingMethod: selectedShippingOption ? {
              id: selectedShippingOption.id,
              name: selectedShippingOption.name,
              price: selectedShippingOption.price,
              estimatedDays: selectedShippingOption.estimatedDays,
            } : null,
          }),
          false,
          '/',
          ExecutionMethod.POST
        );

        data = JSON.parse(response.responseBody);
      } catch (functionError: unknown) {
        const message = getErrorMessage(functionError, '');
        const isFunctionMissing =
          message.includes('Function with the requested ID could not be found') ||
          message.includes('Function with the requested ID could not found') ||
          message.includes('requested ID could not be found');

        if (!isFunctionMissing) {
          throw functionError;
        }

        // Fallback for local/dev setups where Appwrite functions are not deployed yet.
        const fallbackOrderId = crypto.randomUUID();
        await databases.createDocument(
          DATABASE_ID,
          COLLECTIONS.ORDERS,
          fallbackOrderId,
          {
            userId: user.$id,
            items: JSON.stringify(fallbackOrderItems),
            total,
            status: 'pending',
            paymentMethod,
            paymentStatus: initialPaymentStatus,
            transactionId: transactionId.trim() || undefined,
            shippingAddress,
            shippingMethod: selectedShippingOption ? JSON.stringify(selectedShippingOption) : undefined,
          }
        );

        data = {
          success: true,
          orderId: fallbackOrderId,
          subtotal: totalPrice,
          discount: discountAmount,
          tax,
          total,
        };

        toast({
          title: 'Order placed',
          description: 'Order function is not deployed yet. Your order was created using fallback mode.',
        });
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create order');
      }

      // Try to send order confirmation email (non-blocking, silent failure)
      try {
        const orderItemsForEmail = items.map((item) => ({
          product: {
            id: item.product.id,
            name: item.product.name,
            price: item.product.price,
            image: item.product.image,
          },
          quantity: item.quantity,
        }));

<<<<<<< Updated upstream
        // Fire and forget - don't wait for email result
        supabase.functions.invoke('send-order-confirmation', {
          body: {
=======
        const emailResponse = await functions.createExecution(
          'send-order-confirmation',
          JSON.stringify({
>>>>>>> Stashed changes
            orderId: data.orderId,
            customerEmail: shippingForm.email,
            customerName: shippingForm.fullName,
            items: orderItemsForEmail,
            subtotal: data.subtotal,
            discount: data.discount,
            tax: data.tax,
            taxName: taxSettings?.taxName || 'Tax',
            shippingCost: shippingCost,
            shippingMethodName: selectedShippingOption?.name || 'Standard',
            total: data.total,
            shippingAddress: shippingAddress,
<<<<<<< Updated upstream
          },
        }).catch((emailError) => {
          console.warn('Email sending failed:', emailError);
        });
=======
          })
        );

        const emailResult = JSON.parse(emailResponse.responseBody || '{}');
        if (!emailResult.success) {
          console.warn('Email sending failed:', emailResult.error || 'Unknown email error');
          emailSentSuccessfully = false;
        }
>>>>>>> Stashed changes
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
      }

      setOrderId(data.orderId);
      setStep('confirmation');
      clearCart();

<<<<<<< Updated upstream
      toast({
        title: 'Order placed successfully!',
        description: 'Thank you for your order. You can track it in Order History.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to place order. Please try again.',
        variant: 'destructive',
      });
=======
      if (emailSentSuccessfully) {
        toast({
          title: 'Order placed successfully!',
          description: 'A confirmation email has been sent to your inbox.',
        });
      } else {
        toast({
          title: 'Order placed successfully!',
          description: 'Your order is confirmed. We could not send a confirmation email, but you can view your order in Order History.',
        });
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to place order. Please try again.');

      // Check if it's an Appwrite schema error
      const isSchemaError = errorMessage.includes('Invalid document structure') ||
        errorMessage.includes('Unknown attribute');

      if (isSchemaError) {
        toast({
          title: 'Database Setup Error',
          description: 'Your Appwrite database needs to be updated. Run: node scripts/setup-appwrite.js and then try again.',
          variant: 'destructive',
        });
        console.error('Schema error - run setup script:', error);
      } else {
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      }
>>>>>>> Stashed changes
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
                <Link to={`/orders/${orderId}`}>
                  <Button variant="default">Track Order</Button>
                </Link>
                <Link to="/orders">
                  <Button variant="outline">View All Orders</Button>
                </Link>
                <Link to="/products">
                  <Button variant="ghost">Continue Shopping</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Shipping & Payment Steps */}
          {step !== 'confirmation' && (
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Main Form */}
              <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
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
                    </div>

                     {/* Shipping Method Display */}
                     <div className="mt-6 space-y-3">
                       {loadingSettings ? (
                         <div className="flex items-center gap-3 p-4 border border-border rounded-lg text-muted-foreground text-sm">
                           <Loader2 className="h-4 w-4 animate-spin" />
                           Loading shipping options...
                         </div>
                       ) : shippingOptions.length === 0 ? (
                         <div className="flex items-center justify-between p-4 border border-primary bg-primary/5 rounded-lg">
                           <div className="flex items-center gap-3">
                             <div className="w-4 h-4 rounded-full border-4 border-primary bg-primary" />
                             <div>
                               <Label className="cursor-pointer font-medium">Standard Shipping</Label>
                               <p className="text-sm text-muted-foreground">3–5 Business Days</p>
                             </div>
                           </div>
                           <span className="font-medium text-primary">Free</span>
                         </div>
                       ) : (
                         shippingOptions.map((opt) => (
                           <div
                             key={opt.id}
                             onClick={() => setSelectedShipping(opt.id)}
                             className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors ${
                               selectedShipping === opt.id
                                 ? 'border-primary bg-primary/5'
                                 : 'border-border hover:border-primary/50'
                             }`}
                           >
                             <div className="flex items-center gap-3">
                               <div className={`w-4 h-4 rounded-full border-4 ${
                                 selectedShipping === opt.id
                                   ? 'border-primary bg-primary'
                                   : 'border-muted-foreground'
                               }`} />
                               <div>
                                 <Label className="cursor-pointer font-medium">{opt.name}</Label>
                                 <p className="text-sm text-muted-foreground">{opt.estimatedDays}</p>
                               </div>
                             </div>
                             <span className={`font-medium ${
                               selectedShipping === opt.id ? 'text-primary' : ''
                             }`}>
                                {opt.price === 0 ? 'Free' : formatCurrency(opt.price)}
                             </span>
                           </div>
                         ))
                       )}
                     </div>

                    {/* Desktop navigation buttons */}
                    <div className="hidden lg:flex justify-between mt-6">
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

                    {/* Mobile navigation buttons */}
                    <div className="lg:hidden flex flex-col gap-3 mt-6">
                      <Button onClick={handleContinueToPayment} className="w-full">
                        Continue to Payment
                      </Button>
                      <Link to="/cart" className="w-full">
                        <Button variant="ghost" className="gap-2 w-full">
                          <ArrowLeft className="h-4 w-4" />
                          Back to Cart
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {/* Payment Form */}
                {step === 'payment' && (
                  <div className="bg-card border border-border rounded-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <Smartphone className="h-5 w-5 text-primary" />
                      <h2 className="text-xl font-semibold">Payment Method</h2>
                    </div>

                    <RadioGroup value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v as PaymentMethod); if (v === 'cod') setTransactionId(''); }} className="space-y-4">
                      {/* Mobile Banking - bKash */}
                      <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                        <RadioGroupItem value="bkash" id="bkash" />
                        <Label htmlFor="bkash" className="flex-1 cursor-pointer">
                          <div className="font-medium">bKash</div>
                          <div className="text-sm text-muted-foreground">
                            Pay with your bKash mobile wallet
                          </div>
                        </Label>
                        <div className="w-16 h-8 bg-[#E2136E] rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">bKash</span>
                        </div>
                      </div>

                      {/* Mobile Banking - Nagad */}
                      <div className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors">
                        <RadioGroupItem value="nagad" id="nagad" />
                        <Label htmlFor="nagad" className="flex-1 cursor-pointer">
                          <div className="font-medium">Nagad</div>
                          <div className="text-sm text-muted-foreground">
                            Pay with your Nagad mobile wallet
                          </div>
                        </Label>
                        <div className="w-16 h-8 bg-[#F6921E] rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Nagad</span>
                        </div>
                      </div>

                      {/* Cash on Delivery */}
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

                    {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                      <div className="mt-6 space-y-4">
                        <div className={`p-4 rounded-lg ${paymentMethod === 'bkash' ? 'bg-[#E2136E]/10 border border-[#E2136E]/20' : 'bg-[#F6921E]/10 border border-[#F6921E]/20'}`}>
                          <div className="flex items-center gap-3 mb-3">
                            <Smartphone className={`h-5 w-5 ${paymentMethod === 'bkash' ? 'text-[#E2136E]' : 'text-[#F6921E]'}`} />
                            <span className="font-medium">
                              {paymentMethod === 'bkash' ? 'bKash Payment' : 'Nagad Payment'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            After placing your order, you'll receive payment instructions via SMS/email with the merchant number and reference.
                          </p>
                          <div className="bg-background/50 rounded-lg p-3">
                            <p className="text-sm font-medium mb-1">Payment Steps:</p>
                            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                              <li>Open your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} app</li>
                              <li>Select Send Money(01988935650) </li>
                                <li>Enter amount: {formatCurrency(total)}</li>
                              
                              <li>Enter Transaction ID</li> 
                                <div className="space-y-2 mt-3">
                                  <Label htmlFor="transactionId">Transaction ID</Label>
                                  <Input
                                    id="transactionId"
                                    placeholder="Enter your transaction ID"
                                    className="text-sm"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                  />
                                </div>
                                                       
                            </ol>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Desktop navigation buttons */}
                    <div className="hidden lg:flex justify-between mt-6">
                      <Button variant="ghost" className="gap-2" onClick={() => setStep('shipping')}>
                        <ArrowLeft className="h-4 w-4" />
                        Back to Shipping
                      </Button>
                      <Button onClick={handlePlaceOrder} disabled={isSubmitting}>
                        {isSubmitting ? 'Placing Order...' : 'Place Order'}
                      </Button>
                    </div>

                    {/* Mobile navigation buttons */}
                    <div className="lg:hidden flex flex-col gap-3 mt-6">
                      <Button onClick={handlePlaceOrder} disabled={isSubmitting} className="w-full">
                        {isSubmitting ? 'Placing Order...' : 'Place Order'}
                      </Button>
                      <Button variant="ghost" className="gap-2 w-full" onClick={() => setStep('shipping')}>
                        <ArrowLeft className="h-4 w-4" />
                        Back to Shipping
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary Sidebar */}
              <div className="lg:col-span-1 order-1 lg:order-2">
                <div className="bg-card border border-border rounded-xl p-6 lg:sticky lg:top-24">
                  <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                  {/* Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.product.id} className="flex gap-3">
                        <img
                          src={item.product.image ?? ''}
                          alt={item.product.name}
                          className="w-14 h-14 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-medium">
                          {formatCurrency(item.product.price * item.quantity)}
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
                      <span>{formatCurrency(totalPrice)}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-sm text-success">
                        <span>Discount ({appliedCoupon.coupon.code})</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Shipping</span>
                      <span className={shippingCost === 0 ? 'text-success' : ''}>
                        {shippingCost === 0 ? 'Free' : formatCurrency(shippingCost)}
                      </span>
                    </div>
                    {selectedShippingOption && (
                      <p className="text-xs text-muted-foreground pl-2">
                        {selectedShippingOption.name} - {selectedShippingOption.estimatedDays}
                      </p>
                    )}
                    {taxSettings?.enableTax && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{taxSettings.taxName} ({taxSettings.taxRate}%)</span>
                        <span>{formatCurrency(tax)}</span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(total)}</span>
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
