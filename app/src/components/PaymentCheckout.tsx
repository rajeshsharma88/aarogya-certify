import { useState } from 'react';
import { useAsync } from '../hooks/useAsync';
import { provider } from '../data';
import type { Certificate, PaymentOrder } from '../types';

interface PaymentCheckoutProps {
  certificate: Certificate;
  onSuccess?: (order: PaymentOrder) => void;
  onError?: (error: Error) => void;
}

const CERTIFICATE_PRICE_INR = 29900; // ₹299 in paise

export function PaymentCheckout({ certificate, onSuccess, onError }: PaymentCheckoutProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing payment status
  const { data: paymentStatus, loading: statusLoading } = useAsync(
    () => provider.getPaymentStatus(certificate.id),
    [certificate.id]
  );

  // If already paid, show success state
  if (paymentStatus?.status === 'completed') {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <h3 className="font-semibold text-green-900">✓ Payment Successful</h3>
        <p className="mt-2 text-sm text-green-700">
          This certificate is now ready to download.
        </p>
      </div>
    );
  }

  const handleCreateOrder = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Step 1: Create payment order in backend
      const order = await provider.createPaymentOrder(
        certificate.id,
        CERTIFICATE_PRICE_INR,
        'INR'
      );

      // Step 2: Load Razorpay script
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          openRazorpayCheckout(order);
        };
        script.onerror = () => {
          setError('Failed to load payment gateway. Please try again.');
          setProcessing(false);
        };
        document.head.appendChild(script);
      } else {
        openRazorpayCheckout(order);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create payment order';
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
      setProcessing(false);
    }
  };

  const openRazorpayCheckout = (order: PaymentOrder) => {
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!razorpayKey) {
      setError('Payment gateway not configured');
      setProcessing(false);
      return;
    }

    const options = {
      key: razorpayKey,
      amount: order.amountPaise,
      currency: order.currency,
      order_id: order.razorpayOrderId,
      name: 'Aarogya India',
      description: `Certificate Download - ${certificate.title}`,
      handler: async (response: any) => {
        try {
          // Step 3: Verify and complete payment
          const completed = await provider.completePayment(
            order.id,
            response.razorpay_payment_id,
            response.razorpay_signature
          );

          onSuccess?.(completed);
          setProcessing(false);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Payment verification failed';
          setError(message);
          onError?.(err instanceof Error ? err : new Error(message));
          setProcessing(false);
        }
      },
      prefill: {
        name: certificate.holderName,
      },
      theme: {
        color: '#0891b2',
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="space-y-4">
      {/* Certificate Summary */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="font-semibold text-ink">Certificate Details</h3>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Certificate:</dt>
            <dd className="font-medium">{certificate.title}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Score:</dt>
            <dd className="font-medium">{certificate.scorePct}%</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Cert. No.:</dt>
            <dd className="font-mono text-xs">{certificate.certificateNo}</dd>
          </div>
        </dl>
      </div>

      {/* Pricing */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex justify-between">
          <span className="text-slate-600">Certificate Download</span>
          <span className="font-semibold text-ink">₹299</span>
        </div>
        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-display text-lg font-semibold text-brand-700">₹299</span>
          </div>
        </div>
      </div>

      {/* Payment Methods Info */}
      <div className="rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>Accepted:</strong> Debit/Credit Cards, UPI, Net Banking, Digital Wallets
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleCreateOrder}
          disabled={processing || statusLoading}
          className="btn-primary flex-1"
        >
          {processing ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : 'Pay Now with Razorpay'}
        </button>
      </div>

      {/* Terms */}
      <p className="text-xs text-slate-600">
        By proceeding, you agree to the{' '}
        <a href="#" className="underline">
          Terms of Service
        </a>
        . Digital products are non-refundable.
      </p>
    </div>
  );
}

// Extend window type for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}
