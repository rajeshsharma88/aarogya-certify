/**
 * Razorpay webhook — the source of truth for whether a payment happened.
 *
 * The browser callback in razorpay-verify is best effort: a candidate who pays
 * and then closes the tab, loses signal, or is bounced through a bank's 3-D
 * Secure page never triggers it. Without this they would be charged and get
 * nothing, which is the worst failure this system can have. Razorpay retries
 * this endpoint until it gets a 2xx.
 *
 * Authenticated by signature only — there is no user session on a server to
 * server call, so this function must be deployed with JWT verification off
 * (`verify_jwt = false`), and the signature check below is what protects it.
 */
import { json, markOrderPaid, requireEnv, db } from '../_shared/payments.ts';
import { isValidWebhookSignature } from '../_shared/signature.ts';

interface WebhookBody {
  event?: string;
  payload?: {
    payment?: {
      entity?: { id?: string; order_id?: string; status?: string };
    };
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // The signature covers the exact bytes Razorpay sent, so the body must be
  // read as raw text and hashed before any JSON round-trip reformats it.
  const raw = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  try {
    const ok = await isValidWebhookSignature(requireEnv('RAZORPAY_WEBHOOK_SECRET'), raw, signature);
    if (!ok) {
      console.warn('webhook signature rejected');
      return json({ error: 'invalid_signature' }, 401);
    }
  } catch (err) {
    console.error('webhook signature check failed', err);
    return json({ error: 'internal_error' }, 500);
  }

  try {
    const body = JSON.parse(raw) as WebhookBody;
    const payment = body.payload?.payment?.entity;

    // Only a captured payment releases a certificate. 'authorized' means the
    // funds are held, not taken, and may still be voided.
    if (body.event !== 'payment.captured' || !payment?.order_id || !payment.id) {
      // Acknowledge anything else, or Razorpay retries it forever.
      return json({ status: 'ignored', event: body.event ?? null });
    }

    const orders = await db<Array<{ id: string }>>(
      `payment_orders?razorpay_order_id=eq.${payment.order_id}&select=id`,
    );
    const order = orders[0];
    if (!order) {
      // Acknowledge rather than retry: an unknown order will never appear.
      console.warn('webhook for unknown razorpay order', payment.order_id);
      return json({ status: 'unknown_order' });
    }

    const { alreadyPaid } = await markOrderPaid(order.id, payment.id, `webhook:${signature.slice(0, 16)}`);
    return json({ status: 'ok', alreadyPaid });
  } catch (err) {
    // A 5xx asks Razorpay to retry, which is what we want for a transient
    // database failure.
    console.error('webhook processing failed', err);
    return json({ error: 'internal_error' }, 500);
  }
});
