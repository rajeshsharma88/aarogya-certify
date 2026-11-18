/**
 * Verifies the payment handed back by Razorpay Checkout in the browser.
 *
 * This replaces a stub that returned true for any non-empty signature, which
 * would have let anyone mark a certificate paid by posting three made-up
 * strings. The signature is HMAC-SHA256 of "<order_id>|<payment_id>" keyed
 * with the Razorpay key secret, so only Razorpay and this function can produce
 * it — and the secret only exists here.
 *
 * This is the fast path, not the source of truth. If the candidate closes the
 * tab after paying, this never runs; razorpay-webhook completes the order
 * instead.
 */
import { CORS, callerId, db, json, markOrderPaid, requireEnv } from '../_shared/payments.ts';
import { isValidCheckoutSignature } from '../_shared/signature.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const uid = await callerId(req);
    if (!uid) return json({ error: 'not_authenticated' }, 401);

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = (await req.json()) as {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    };
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return json({ error: 'missing_fields' }, 400);
    }

    const ok = await isValidCheckoutSignature(
      requireEnv('RAZORPAY_KEY_SECRET'),
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    );
    if (!ok) {
      console.warn('signature mismatch for razorpay order', razorpayOrderId);
      return json({ error: 'invalid_signature' }, 400);
    }

    // The signature proves Razorpay authorised this payment, but not that it
    // belongs to the caller — check the order is theirs before releasing it.
    const orders = await db<Array<{ id: string; user_id: string }>>(
      `payment_orders?razorpay_order_id=eq.${razorpayOrderId}&select=id,user_id`,
    );
    const order = orders[0];
    if (!order) return json({ error: 'order_not_found' }, 404);
    if (order.user_id !== uid) return json({ error: 'forbidden' }, 403);

    const { alreadyPaid, certificateId } = await markOrderPaid(
      order.id,
      razorpayPaymentId,
      razorpaySignature,
    );
    return json({ status: 'completed', alreadyPaid, certificateId });
  } catch (err) {
    console.error('verify failed', err);
    return json({ error: 'internal_error' }, 500);
  }
});
