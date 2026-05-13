import { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, MessageSquare, ShoppingBag, Loader2, ArrowLeft, Copy, CheckCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { databases, functions, DATABASE_ID, COLLECTIONS, FUNCTION_IDS } from '@/integrations/appwrite/config';
import { ShippingOption } from '@/integrations/appwrite/types';
import { toast } from '@/hooks/use-toast';
import { ExecutionMethod, ID } from 'appwrite';
import { getPrimaryImage } from '@/lib/image-utils';
import { useNavigate } from 'react-router-dom';

interface GuestCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  paymentType: 'cod' | 'online';
}

type Step = 'form' | 'payment-select' | 'payment-txn';
type OnlineMethod = 'bkash' | 'nagad';

const ONLINE_DISCOUNT = 20;

// ⚠️ Replace with your actual bKash/Nagad merchant numbers
const PAYMENT_NUMBERS: Record<OnlineMethod, string> = {
  bkash: '01XXXXXXXXX',
  nagad: '01XXXXXXXXX',
};

const parseSettingValue = <T,>(value: unknown, fallback: T): T => {
  if (typeof value !== 'string') return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
};

export function GuestCheckoutModal({ open, onClose, paymentType: _paymentType }: GuestCheckoutModalProps) {
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');

  // Steps
  const [step, setStep] = useState<Step>('form');
  const [onlineMethod, setOnlineMethod] = useState<OnlineMethod>('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [copied, setCopied] = useState(false);
  // Shipping
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep('form');
      setTransactionId('');
      setCopied(false);
      setEmail('');
    }
  }, [open]);

  // Fetch shipping options
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.STORE_SETTINGS);
        const doc = res.documents.find((d) => d.key === 'shipping');
        if (doc?.value) {
          const opts = parseSettingValue<ShippingOption[]>(doc.value, []);
          const enabled = opts.filter((o) => o.enabled);
          setShippingOptions(enabled);
          if (enabled.length > 0) setSelectedShipping(enabled[0].id);
        }
      } catch {}
    })();
  }, [open]);

  const selectedOpt = shippingOptions.find((o) => o.id === selectedShipping) ?? shippingOptions[0] ?? null;
  const shippingCost = selectedOpt?.price ?? 0;
  const isOnline = step === 'payment-select' || step === 'payment-txn';
  const discount = isOnline ? ONLINE_DISCOUNT : 0;
  const total = totalPrice + shippingCost - discount;

  const validateForm = () => {
    if (!name.trim()) { toast({ title: 'নাম দিন', variant: 'destructive' }); return false; }
    if (!phone.trim()) { toast({ title: 'ফোন নাম্বার দিন', variant: 'destructive' }); return false; }
    if (!address.trim()) { toast({ title: 'এড্রেস দিন', variant: 'destructive' }); return false; }
    if (!email.trim()) { toast({ title: 'ইমেইল দিন', description: 'অর্ডার কনফার্মেশন পেতে ইমেইল দিতে হবে', variant: 'destructive' }); return false; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { toast({ title: 'সঠিক ইমেইল দিন', variant: 'destructive' }); return false; }
    return true;
  };

  const handleCOD = async () => {
    if (!validateForm()) return;
    await placeOrder('cod', undefined);
  };

  const handleOnlineClick = () => {
    if (!validateForm()) return;
    setStep('payment-select');
  };

  const handleMethodSelect = (method: OnlineMethod) => {
    setOnlineMethod(method);
    setStep('payment-txn');
  };

  const handleCopyNumber = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_NUMBERS[onlineMethod]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleSubmitPayment = async () => {
    if (!transactionId.trim()) {
      toast({ title: 'Transaction ID দিন', variant: 'destructive' });
      return;
    }
    await placeOrder(onlineMethod, transactionId.trim());
  };

  const placeOrder = async (paymentMethod: string, txnId?: string) => {
    setIsSubmitting(true);
    try {
      const shippingAddress = `${name}\nPhone: ${phone}\n${address}${email.trim() ? '\nEmail: ' + email.trim() : ''}${note ? '\nNote: ' + note : ''}`;
      const orderItems = items.map((i) => ({ productId: i.product.id, quantity: i.quantity }));
      const fallbackItems = items.map((i) => ({
        product: { id: i.product.id, name: i.product.name, price: i.product.price, image: i.product.image },
        quantity: i.quantity,
      }));

      let orderId: string | null = null;

      try {
        const res = await functions.createExecution(
          FUNCTION_IDS.CREATE_ORDER,
          JSON.stringify({
            items: orderItems,
            shippingAddress,
            paymentMethod,
            paymentStatus: 'pending',
            transactionId: txnId,
            shippingMethod: selectedOpt ? {
              id: selectedOpt.id, name: selectedOpt.name,
              price: selectedOpt.price, estimatedDays: selectedOpt.estimatedDays,
            } : null,
            guestName: name,
            guestPhone: phone,
            discount: txnId ? ONLINE_DISCOUNT : 0,
          }),
          false, '/', ExecutionMethod.POST
        );
        const data = JSON.parse(res.responseBody);
        if (!data.success) throw new Error(data.error || 'Failed');
        orderId = data.orderId;
      } catch (fnErr: unknown) {
        const msg = fnErr instanceof Error ? fnErr.message : '';
        const isMissing = msg.includes('could not be found') || msg.includes('could not found');
        if (!isMissing) throw fnErr;

        orderId = ID.unique();
        await databases.createDocument(DATABASE_ID, COLLECTIONS.ORDERS, orderId, {
          userId: 'guest',
          items: JSON.stringify(fallbackItems),
          total,
          status: 'pending',
          paymentMethod,
          paymentStatus: 'pending',
          transactionId: txnId,
          shippingAddress,
          shippingMethod: selectedOpt ? JSON.stringify(selectedOpt) : undefined,
        });

        // Deduct stock for each item (fallback mode)
        for (const item of items) {
          try {
            const productDoc = await databases.getDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, item.product.id) as unknown as Record<string, unknown>;
            const currentStock = Number(productDoc.stock || 0);
            const newStock = Math.max(0, currentStock - item.quantity);
            await databases.updateDocument(DATABASE_ID, COLLECTIONS.PRODUCTS, item.product.id, { stock: newStock });
          } catch {
            // Non-fatal
          }
        }
      }

      clearCart();
      onClose();
      toast({ title: '✅ অর্ডার সফল হয়েছে!', description: txnId ? 'পেমেন্ট যাচাই করা হবে।' : 'আমরা শীঘ্রই যোগাযোগ করবো।' });

      // Send confirmation email (non-blocking)
      if (orderId && email.trim()) {
        functions.createExecution(
          'send-order-confirmation', // send-order-confirmation function ID
          JSON.stringify({
            orderId,
            customerEmail: email.trim(),
            customerName: name,
            items: fallbackItems,
            subtotal: totalPrice,
            discount: txnId ? ONLINE_DISCOUNT : 0,
            shippingCost,
            total,
            shippingAddress,
            paymentMethod,
          }),
          false, '/', ExecutionMethod.POST
        ).catch(() => {}); // silent fail
      }

      if (orderId) navigate(`/orders/${orderId}`);
    } catch (err) {
      toast({ title: 'অর্ডার ব্যর্থ হয়েছে', description: err instanceof Error ? err.message : 'আবার চেষ্টা করুন', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '85dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        {/* Close */}
        <button onClick={onClose} className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-gray-100">
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* ── STEP 1: ORDER FORM ── */}
        {step === 'form' && (
          <div className="overflow-y-auto flex-1 p-5 space-y-4" style={{ paddingBottom: '1.5rem' }}>
            {/* Name */}
            <div className="flex items-center gap-3 border border-green-300 rounded-full px-4 py-2.5">
              <User className="h-5 w-5 text-green-500 shrink-0" />
              <input className="flex-1 outline-none text-sm placeholder:text-gray-400"
                placeholder="আপনার নাম" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            {/* Phone */}
            <div className="flex items-center gap-3 border border-green-300 rounded-full px-4 py-2.5">
              <Phone className="h-5 w-5 text-green-500 shrink-0" />
              <input className="flex-1 outline-none text-sm placeholder:text-gray-400"
                placeholder="ফোন নাম্বার" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>

            {/* Address */}
            <div className="flex items-center gap-3 border border-green-300 rounded-full px-4 py-2.5">
              <MapPin className="h-5 w-5 text-green-500 shrink-0" />
              <input className="flex-1 outline-none text-sm placeholder:text-gray-400"
                placeholder="এড্রেস (থানা+জেলা) লিখুন" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>

 {/* Email (required) */}
            <div className="flex items-center gap-3 border border-green-300 rounded-full px-4 py-2.5">
              <span className="text-green-500 shrink-0 text-sm">✉</span>
              <input className="flex-1 outline-none text-sm placeholder:text-gray-400"
                placeholder="ইমেইল (আবশ্যক)"
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            {/* Cart Items */}
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.product.id} className="flex items-center gap-3 py-2 border-b border-gray-100">
                  <div className="relative">
                    <img src={getPrimaryImage(item.product.image)} alt={item.product.name}
                      className="w-10 h-10 rounded-lg object-cover" />
                    <span className="absolute -top-1.5 -right-1.5 bg-gray-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {item.quantity}
                    </span>
                  </div>
                  <span className="flex-1 text-sm font-medium line-clamp-1">{item.product.name}</span>
                  <span className="text-sm font-semibold">{(item.product.price * item.quantity).toFixed(0)}Tk</span>
                </div>
              ))}
            </div>

            {/* Delivery Zone */}
            {shippingOptions.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">ডেলিভারি চার্জ সেলেক্ট করুন..</p>
                <div className="space-y-2">
                  {shippingOptions.map((opt) => (
                    <label key={opt.id} onClick={() => setSelectedShipping(opt.id)}
                      className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedShipping === opt.id ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          selectedShipping === opt.id ? 'border-green-500' : 'border-gray-400'
                        }`}>
                          {selectedShipping === opt.id && <div className="w-2 h-2 rounded-full bg-green-500" />}
                        </div>
                        <span className="text-sm">{opt.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{opt.price === 0 ? 'Free' : `${opt.price}Tk`}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-green-50 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">সাব টোটাল</span>
                <span className="font-medium">{totalPrice.toFixed(0)}Tk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ডেলিভারি চার্জ</span>
                <span className="font-medium">{shippingCost === 0 ? 'Free' : `${shippingCost}Tk`}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t border-green-200">
                <span>সর্বমোট</span>
                <span>{(totalPrice + shippingCost).toFixed(0)}Tk</span>
              </div>
            </div>

            {/* Note */}
            <div className="flex items-start gap-3 border border-green-300 rounded-xl px-4 py-2.5">
              <MessageSquare className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <textarea className="flex-1 outline-none text-sm placeholder:text-gray-400 resize-none min-h-[40px]"
                placeholder="কোনো মন্তব্য থাকলে লিখুন..." value={note}
                onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>

            {/* COD Button */}
            <button onClick={handleCOD} disabled={isSubmitting}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" />}
              ক্যাশ অন ডেলিভারিতে অর্ডার করুন
            </button>

            {/* Online Payment Button */}
            <button onClick={handleOnlineClick} disabled={isSubmitting}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
              💳 পেমেন্ট করে অর্ডার করলেই ২০ টাকা ছাড়!
            </button>
          </div>
        )}

        {/* ── STEP 2: SELECT bKash / Nagad ── */}
        {step === 'payment-select' && (
          <div className="overflow-y-auto flex-1 p-5 space-y-4 pb-6">
            <button onClick={() => setStep('form')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" /> ফিরে যান
            </button>

            <div className="text-center">
              <p className="text-lg font-bold text-green-700">পেমেন্ট মেথড বেছে নিন</p>
              <p className="text-sm text-gray-500 mt-1">পেমেন্ট করলে <span className="font-bold text-green-600">২০ টাকা ছাড়</span> পাবেন!</p>
            </div>

            {/* bKash */}
            <button onClick={() => handleMethodSelect('bkash')}
              className="w-full flex items-center gap-4 p-4 border-2 border-pink-200 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition-colors">
              <div className="w-12 h-12 bg-[#E2136E] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-black text-sm">bKash</span>
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">bKash</p>
                <p className="text-sm text-gray-500">মোবাইল ব্যাংকিং</p>
              </div>
              <span className="ml-auto text-pink-600 font-bold">{(totalPrice + shippingCost - ONLINE_DISCOUNT).toFixed(0)}Tk</span>
            </button>

            {/* Nagad */}
            <button onClick={() => handleMethodSelect('nagad')}
              className="w-full flex items-center gap-4 p-4 border-2 border-orange-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors">
              <div className="w-12 h-12 bg-[#F6A623] rounded-xl flex items-center justify-center shrink-0">
                <span className="text-white font-black text-sm">Nagad</span>
              </div>
              <div className="text-left">
                <p className="font-bold text-gray-800">Nagad</p>
                <p className="text-sm text-gray-500">মোবাইল ব্যাংকিং</p>
              </div>
              <span className="ml-auto text-orange-600 font-bold">{(totalPrice + shippingCost - ONLINE_DISCOUNT).toFixed(0)}Tk</span>
            </button>
          </div>
        )}

        {/* ── STEP 3: TRANSACTION ID ── */}
        {step === 'payment-txn' && (
          <div className="overflow-y-auto flex-1 p-5 space-y-4 pb-6">
            <button onClick={() => setStep('payment-select')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-4 w-4" /> ফিরে যান
            </button>

            {/* Method header */}
            <div className={`rounded-xl p-4 text-white ${onlineMethod === 'bkash' ? 'bg-[#E2136E]' : 'bg-[#F6A623]'}`}>
              <p className="font-bold text-lg">{onlineMethod === 'bkash' ? 'bKash' : 'Nagad'} পেমেন্ট</p>
              <p className="text-sm opacity-90 mt-0.5">নিচের নম্বরে Send Money করুন</p>
            </div>

            {/* Merchant number */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{onlineMethod === 'bkash' ? 'bKash' : 'Nagad'} নম্বর</p>
              <p className="text-2xl font-black tracking-widest text-gray-800">01988935650</p>
              <button onClick={handleCopyNumber}
                className="mt-2 flex items-center gap-1.5 mx-auto text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-full px-3 py-1">
                {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'কপি হয়েছে!' : 'নম্বর কপি করুন'}
              </button>
            </div>

            {/* Amount */}
            <div className="bg-green-50 rounded-xl p-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">সাব টোটাল</span>
                <span>{totalPrice.toFixed(0)}Tk</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ডেলিভারি</span>
                <span>{shippingCost === 0 ? 'Free' : `${shippingCost}Tk`}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>অনলাইন ছাড়</span>
                <span>-{ONLINE_DISCOUNT}Tk</span>
              </div>
              <div className="flex justify-between font-black text-base pt-1 border-t border-green-200">
                <span>পাঠাতে হবে</span>
                <span className="text-green-700">{(totalPrice + shippingCost - ONLINE_DISCOUNT).toFixed(0)}Tk</span>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-800 space-y-1">
              <p className="font-semibold">📋 পেমেন্ট করার নিয়ম:</p>
              <p>১. উপরের নম্বরে <strong>Send Money</strong> করুন</p>
              <p>২. Amount: <strong>{(totalPrice + shippingCost - ONLINE_DISCOUNT).toFixed(0)}Tk</strong></p>
              <p>৩. Transaction ID নিচে লিখুন</p>
            </div>

            {/* Transaction ID input */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Transaction ID লিখুন</p>
              <div className={`flex items-center gap-3 border-2 rounded-xl px-4 py-3 ${
                onlineMethod === 'bkash' ? 'border-pink-300 focus-within:border-pink-500' : 'border-orange-300 focus-within:border-orange-500'
              }`}>
                <input
                  className="flex-1 outline-none text-sm font-mono placeholder:text-gray-400"
                  placeholder="যেমন: 8N7A6B5C4D"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                />
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleSubmitPayment} disabled={isSubmitting || !transactionId.trim()}
              className={`w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 ${
                onlineMethod === 'bkash' ? 'bg-[#E2136E] hover:bg-pink-700' : 'bg-[#F6A623] hover:bg-orange-600'
              }`}>
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
              অর্ডার কনফার্ম করুন
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
