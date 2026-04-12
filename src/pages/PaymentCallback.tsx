import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { bkashService } from '@/services/bkash';
import { nagadService } from '@/services/nagad';
import { toast } from '@/hooks/use-toast';

type PaymentStatus = 'processing' | 'success' | 'failed' | 'cancelled';

interface PaymentResult {
  status: PaymentStatus;
  transactionId?: string;
  paymentMethod?: string;
  amount?: number;
  orderId?: string;
  message?: string;
}

const PaymentCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentResult, setPaymentResult] = useState<PaymentResult>({ status: 'processing' });

  useEffect(() => {
    const processPaymentCallback = async () => {
      try {
        // Check URL parameters for payment method
        const paymentID = searchParams.get('paymentID');
        const status = searchParams.get('status');
        const paymentReferenceId = searchParams.get('payment_ref_id');
        const orderId = searchParams.get('order_id');

        // Handle bKash callback
        if (paymentID) {
          await handleBkashCallback(paymentID, status);
        }
        // Handle Nagad callback
        else if (paymentReferenceId) {
          await handleNagadCallback(paymentReferenceId, orderId);
        }
        // Check localStorage for payment data
        else {
          await handleStoredPaymentData();
        }
      } catch (error) {
        console.error('Payment callback error:', error);
        setPaymentResult({
          status: 'failed',
          message: 'Failed to process payment callback',
        });
      }
    };

    processPaymentCallback();
  }, [searchParams]);

  const handleBkashCallback = async (paymentID: string, status: string | null) => {
    try {
      if (status === 'success' || status === 'Completed') {
        // Verify payment with bKash
        const paymentDetails = await bkashService.queryPayment(paymentID);
        
        if (paymentDetails.transactionStatus === 'Completed') {
          setPaymentResult({
            status: 'success',
            transactionId: paymentDetails.trxID,
            paymentMethod: 'bKash',
            amount: parseFloat(paymentDetails.amount),
            orderId: paymentDetails.merchantInvoiceNumber,
            message: 'Payment completed successfully',
          });

          // Clear stored payment data
          localStorage.removeItem('bkash_payment');

          toast({
            title: 'Payment Successful',
            description: `Your bKash payment of ৳${paymentDetails.amount} has been completed.`,
          });
        } else {
          throw new Error('Payment verification failed');
        }
      } else if (status === 'cancel' || status === 'Cancelled') {
        setPaymentResult({
          status: 'cancelled',
          message: 'Payment was cancelled by user',
        });
      } else {
        setPaymentResult({
          status: 'failed',
          message: 'Payment failed or was declined',
        });
      }
    } catch (error) {
      console.error('bKash callback error:', error);
      setPaymentResult({
        status: 'failed',
        message: 'Failed to verify bKash payment',
      });
    }
  };

  const handleNagadCallback = async (paymentReferenceId: string, orderId: string | null) => {
    try {
      // Verify payment with Nagad
      const verification = await nagadService.verifyPayment(paymentReferenceId);
      
      if (verification.status === 'Success') {
        setPaymentResult({
          status: 'success',
          transactionId: verification.issuerPaymentRefNo,
          paymentMethod: 'Nagad',
          amount: parseFloat(verification.amount),
          orderId: verification.orderId,
          message: 'Payment completed successfully',
        });

        // Clear stored payment data
        localStorage.removeItem('nagad_payment');

        toast({
          title: 'Payment Successful',
          description: `Your Nagad payment of ৳${verification.amount} has been completed.`,
        });
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Nagad callback error:', error);
      setPaymentResult({
        status: 'failed',
        message: 'Failed to verify Nagad payment',
      });
    }
  };

  const handleStoredPaymentData = async () => {
    // Check for stored bKash payment data
    const bkashData = localStorage.getItem('bkash_payment');
    if (bkashData) {
      try {
        const paymentInfo = JSON.parse(bkashData);
        // Check if payment is recent (within 30 minutes)
        if (Date.now() - paymentInfo.timestamp < 30 * 60 * 1000) {
          await handleBkashCallback(paymentInfo.paymentID, 'success');
          return;
        }
      } catch (error) {
        console.error('Error processing stored bKash data:', error);
      }
    }

    // Check for stored Nagad payment data
    const nagadData = localStorage.getItem('nagad_payment');
    if (nagadData) {
      try {
        const paymentInfo = JSON.parse(nagadData);
        // Check if payment is recent (within 30 minutes)
        if (Date.now() - paymentInfo.timestamp < 30 * 60 * 1000) {
          await handleNagadCallback(paymentInfo.paymentReferenceId, paymentInfo.orderId);
          return;
        }
      } catch (error) {
        console.error('Error processing stored Nagad data:', error);
      }
    }

    // No valid payment data found
    setPaymentResult({
      status: 'failed',
      message: 'No valid payment data found',
    });
  };

  const getStatusIcon = () => {
    switch (paymentResult.status) {
      case 'processing':
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'failed':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-12 w-12 text-yellow-500" />;
      default:
        return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentResult.status) {
      case 'processing':
        return 'Processing your payment...';
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'cancelled':
        return 'Payment Cancelled';
      default:
        return 'Processing...';
    }
  };

  const handleContinue = () => {
    if (paymentResult.status === 'success' && paymentResult.orderId) {
      navigate(`/orders/${paymentResult.orderId}`);
    } else {
      navigate('/');
    }
  };

  const handleRetry = () => {
    if (paymentResult.orderId) {
      navigate(`/checkout?orderId=${paymentResult.orderId}`);
    } else {
      navigate('/cart');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-xl">{getStatusMessage()}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentResult.message && (
            <Alert>
              <AlertDescription>{paymentResult.message}</AlertDescription>
            </Alert>
          )}

          {paymentResult.status === 'success' && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-medium">{paymentResult.paymentMethod}</span>
              </div>
              {paymentResult.transactionId && (
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-medium font-mono text-xs">{paymentResult.transactionId}</span>
                </div>
              )}
              {paymentResult.amount && (
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">৳{paymentResult.amount.toFixed(2)}</span>
                </div>
              )}
              {paymentResult.orderId && (
                <div className="flex justify-between">
                  <span>Order ID:</span>
                  <span className="font-medium">{paymentResult.orderId}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            {paymentResult.status === 'success' ? (
              <Button onClick={handleContinue} className="flex-1">
                View Order
              </Button>
            ) : paymentResult.status === 'failed' ? (
              <>
                <Button onClick={handleRetry} variant="outline" className="flex-1">
                  Try Again
                </Button>
                <Button onClick={() => navigate('/')} className="flex-1">
                  Go Home
                </Button>
              </>
            ) : (
              <Button onClick={() => navigate('/')} className="flex-1">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallback;