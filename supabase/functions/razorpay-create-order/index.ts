/**
 * Creates a real Razorpay order for a certificate.
 *
 * Razorpay Checkout cannot open without an order id issued by Razorpay's API,
 * and that call needs the key secret — which must never reach the browser.
 * That is the whole reason this runs server-side.
 *
 * The caller supplies only a certificate id. The price comes from the server
 * and the certificate's ownership is checked here, so neither can be chosen by
 * whoever is calling.
 */
import {
  CORS,
  callerId,
  certificatePricePaise,
  db,
  json,
  requireEnv,
} from '../_shared/payments.ts';

interface CertRow {
  id: string;
  user_id: string;
  is_paid: boolean | null;
  title: string | null;
  certificate_no: string | null;
}

interface OrderRow {
  id: string;
  razorpay_order_id: string | null;
  amount_paise: number;
  currency: string;
  status: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const uid = await callerId(req);
    if (!uid) return json({ error: 'not_authenticated' }, 401);

    const { certificateId } = (await req.json()) as { certificateId?: string };
    if (!certificateId) return json({ error: 'certificate_id_required' }, 400);

    const certs = await db<CertRow[]>(
      `certificates?id=eq.${certificateId}&select=id,user_id,is_paid,title,certificate_no`,
    );
    const cert = certs[0];
    // Same response for "no such certificate" and "not yours", so this cannot
    // be used to probe which certificate ids exist.
    if (!cert || cert.user_id !== uid) return json({ error: 'certificate_not_found' }, 404);
    if (cert.is_paid) return json({ error: 'already_paid' }, 409);

    const keyId = requireEnv('RAZORPAY_KEY_ID');
    const keySecret = requireEnv('RAZORPAY_KEY_SECRET');
    const amountPaise = certificatePricePaise();

    // Reuse a pending order so a candidate who reloads the page is not charged
    // twice and does not accumulate dangling orders at Razorpay.
    const existing = await db<OrderRow[]>(
      `payment_orders?user_id=eq.${uid}&certificate_id=eq.${certificateId}&status=eq.pending` +
        `&select=id,razorpay_order_id,amount_paise,currency,status&limit=1`,
    );
    let order = existing[0];

    if (!order) {
      const created = await db<OrderRow[]>('payment_orders', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          user_id: uid,
          certificate_id: certificateId,
          amount_paise: amountPaise,
          currency: 'INR',
        }),
      });
      order = created[0];
    }

    if (!order.razorpay_order_id) {
      const rzp = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          // Lets a payment be traced back to this order from the Razorpay
          // dashboard, and is what the webhook matches on.
          receipt: order.id,
          notes: { certificate_id: certificateId, certificate_no: cert.certificate_no ?? '' },
        }),
      });
      const body = await rzp.text();
      if (!rzp.ok) {
        console.error('razorpay order creation failed', rzp.status, body.slice(0, 300));
        return json({ error: 'gateway_error' }, 502);
      }
      const { id: razorpayOrderId } = JSON.parse(body) as { id: string };
      await db(`payment_orders?id=eq.${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ razorpay_order_id: razorpayOrderId }),
      });
      order.razorpay_order_id = razorpayOrderId;
    }

    return json({
      orderId: order.id,
      razorpayOrderId: order.razorpay_order_id,
      amountPaise,
      currency: 'INR',
      // The key id is public by design — it is what Checkout needs in the page.
      keyId,
      certificateTitle: cert.title ?? 'Certificate',
    });
  } catch (err) {
    console.error('create-order failed', err);
    return json({ error: 'internal_error' }, 500);
  }
});
