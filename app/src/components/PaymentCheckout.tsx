import { useState } from 'react';
import { provider } from '../data';
import type { CertificatePaymentIntent } from '../types';

/**
 * Razorpay Checkout for a certificate.
 *
 * Everything that decides what is being charged — the amount, the Razorpay
 * order, and whether the payment was genuine — is settled on the server. This
 * component only opens the gateway and reports back; nothing it sends can
 * change the price or mark a certificate paid.
 */

const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

declare global {
  interface Window {
    // Razorpay's script has no types; the surface used here is the constructor.
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (p: unknown) => void) => void };
  }
}

/** Loads Checkout once and resolves when the global is available. */
function loadCheckout(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('load failed')), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = CHECKOUT_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('load failed'));
    document.body.appendChild(s);
  });
}

export function PaymentCheckout({
  certificateId,
  holderName,
  email,
  onPaid,
}: {
  certificateId: string;
  holderName: string;
  email?: string;
  onPaid: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  async function pay() {
    setError(null);
    setBusy(true);
    let intent: CertificatePaymentIntent;
    try {
      intent = await provider.startCertificatePayment(certificateId);
      await loadCheckout();
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'We could not start the payment. Please try again.',
      );
      setBusy(false);
      return;
    }

    if (!window.Razorpay) {
      setError('The payment window could not load. Check your connection and try again.');
      setBusy(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: intent.keyId,
      amount: intent.amountPaise,
      currency: intent.currency,
      order_id: intent.razorpayOrderId,
      name: 'Aarogya India Gurukul',
      description: intent.certificateTitle,
      prefill: { name: holderName, email: email ?? '' },
      theme: { color: '#0f766e' },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        // Razorpay has taken the money by this point. Verification can still
        // fail, so the wording below never tells someone to pay again.
        setVerifying(true);
        try {
          await provider.confirmCertificatePayment(
            response.razorpay_order_id,
            response.razorpay_payment_id,
            response.razorpay_signature,
          );
          onPaid();
        } catch (err) {
          setError(
            err instanceof Error && err.message
              ? err.message
              : 'Your payment went through but we could not confirm it. Contact us and we will release your certificate — do not pay again.',
          );
        } finally {
          setVerifying(false);
          setBusy(false);
        }
      },
      modal: {
        // Dismissing the window is not a failure; let them try again.
        ondismiss: () => setBusy(false),
      },
    });

    rzp.on('payment.failed', (resp: unknown) => {
      const reason = (resp as { error?: { description?: string } })?.error?.description;
      setError(reason ? `Payment failed: ${reason}` : 'The payment did not go through. Nothing was charged.');
      setBusy(false);
    });

    rzp.open();
  }

  return (
    <div className="card p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Get your certificate</h2>
      <p className="mt-1 text-sm text-slate-600">
        Your result is saved. Pay once to download the PDF certificate and keep it permanently.
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">
          {error}
        </p>
      )}

      <button type="button" className="btn-primary mt-4" onClick={() => void pay()} disabled={busy}>
        {verifying ? 'Confirming payment…' : busy ? 'Opening payment…' : 'Pay with Razorpay'}
      </button>
      <p className="mt-2 text-xs text-slate-500">
        Payment is handled by Razorpay. We never see your card details.
      </p>
    </div>
  );
}
