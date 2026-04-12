import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Smartphone, CreditCard, Banknote } from 'lucide-react';
import { bkashService } from '@/services/bkash';
import { nagadService } from '@/services/nagad';
import { toast } from '@/hooks/use-toast';

interface BangladeshPaymentProps {
  amount: number;
  orderId: string;
  customerPhone?: string;
  onSuccess: (paymentData: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

export const BangladeshPayment: React.FC<BangladeshPaymentProps> = ({
  amount,
  orderId,
  customerPhone,
  onSuccess,
  onError,
  onCancel,
}) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'cod' | null>(null);
  const [transactionId, setTransactionId] = useState('');
  const [showTransactionInput, setShowTransactionInput] = useState(false);

  const handleBkashPayment = async () => {
    setPaymentMethod('bkash');
    setShowTransactionInput(true);
  };

  const handleNagadPayment = async () => {
    setPaymentMethod('nagad');
    setShowTransactionInput(true);
  };

  const handleCashOnDelivery = async () => {
    setLoading('cod');
    
    try {
      // For COD, immediately confirm the order
      onSuccess({
        paymentMethod: 'cod',
        status: 'confirmed',
        transactionId: `COD-${orderId}-${Date.now()}`,
        requiresApproval: false,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cash on delivery processing failed';
      onError(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const handleSubmitTransaction = async () => {
    if (!transactionId.trim()) {
      toast({
        title: 'Transaction ID Required',
        description: 'Please enter your transaction ID',
        variant: 'destructive',
      });
      return;
    }

    setLoading(paymentMethod);

    try {
      // Submit order with transaction ID for admin approval
      onSuccess({
        paymentMethod: paymentMethod,
        status: 'pending_approval',
        transactionId: transactionId.trim(),
        requiresApproval: true,
        amount: amount,
        orderId: orderId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Transaction submission failed';
      onError(errorMessage);
    } finally {
      setLoading(null);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {!showTransactionInput ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Payment Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  Choose your preferred payment method for {formatCurrency(amount)}
                </AlertDescription>
              </Alert>

              {/* Cash on Delivery Button */}
              <Button
                onClick={handleCashOnDelivery}
                disabled={loading !== null}
                className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
                size="lg"
              >
                {loading === 'cod' ? (
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Banknote className="h-8 w-8" />
                    <div className="text-left">
                      <div>Cash on Delivery</div>
                      <div className="text-sm opacity-90">Pay when you receive</div>
                    </div>
                  </div>
                )}
              </Button>

              {/* bKash Payment Button */}
              <Button
                onClick={handleBkashPayment}
                disabled={loading !== null}
                className="w-full h-14 bg-pink-600 hover:bg-pink-700 text-white text-lg font-semibold"
                size="lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-pink-600 font-bold text-sm">bK</span>
                  </div>
                  <div className="text-left">
                    <div>Pay with bKash</div>
                    <div className="text-sm opacity-90">{formatCurrency(amount)}</div>
                  </div>
                </div>
              </Button>

              {/* Nagad Payment Button */}
              <Button
                onClick={handleNagadPayment}
                disabled={loading !== null}
                className="w-full h-14 bg-orange-600 hover:bg-orange-700 text-white text-lg font-semibold"
                size="lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-sm">N</span>
                  </div>
                  <div className="text-left">
                    <div>Pay with Nagad</div>
                    <div className="text-sm opacity-90">{formatCurrency(amount)}</div>
                  </div>
                </div>
              </Button>

              {/* Cancel Button */}
              {onCancel && (
                <Button
                  onClick={onCancel}
                  disabled={loading !== null}
                  variant="outline"
                  className="w-full"
                >
                  Cancel Payment
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Transaction ID Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {paymentMethod === 'bkash' ? (
                  <div className="w-6 h-6 bg-pink-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">bK</span>
                  </div>
                ) : (
                  <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-xs">N</span>
                  </div>
                )}
                Enter Transaction ID
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  Please complete your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} payment first, then enter your transaction ID below
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input
                  id="transactionId"
                  type="text"
                  placeholder="Enter your transaction ID"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitTransaction}
                  disabled={loading !== null || !transactionId.trim()}
                  className="flex-1"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Submitting...</span>
                    </div>
                  ) : (
                    'Submit Order'
                  )}
                </Button>
                
                <Button
                  onClick={() => {
                    setShowTransactionInput(false);
                    setPaymentMethod(null);
                    setTransactionId('');
                  }}
                  disabled={loading !== null}
                  variant="outline"
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment Instructions</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Send money to our {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} number</p>
              <p>• Amount: {formatCurrency(amount)}</p>
              <p>• Note the transaction ID from your payment</p>
              <p>• Enter the transaction ID above</p>
              <p>• Your order will be confirmed after admin approval</p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Security Notice */}
      <Alert>
        <AlertDescription className="text-xs">
          🔒 Your payment information is secure. Orders with transaction ID require admin approval before processing.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BangladeshPayment;