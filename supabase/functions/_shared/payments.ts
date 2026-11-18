/**
 * Shared helpers for the Razorpay edge functions.
 *
 * Deliberately dependency-free: plain fetch against PostgREST and Web Crypto
 * for HMAC. The self-hosted edge runtime mounts this directory from disk, and
 * a remote import that fails to resolve at cold start takes payments down, so
 * there is nothing here to resolve.
 */

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/** Reads a required environment variable, failing loudly rather than silently misbehaving. */
export function requireEnv(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

export function supabaseUrl(): string {
  return Deno.env.get('SUPABASE_URL') ?? requireEnv('API_EXTERNAL_URL');
}

/**
 * The price lives on the server. It must never be taken from the request:
 * a client-supplied amount lets anyone buy a certificate for one paisa.
 */
export function certificatePricePaise(): number {
  // 299900 paise = ₹2999. Must match LEGAL.certificatePriceInr in the app.
  const raw = Deno.env.get('CERTIFICATE_PRICE_PAISE') ?? '299900';
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`Invalid CERTIFICATE_PRICE_PAISE: ${raw}`);
  return n;
}

/** PostgREST call with the service role key — bypasses RLS, so never expose it. */
export async function db<T>(path: string, init: RequestInit = {}): Promise<T> {
  const key = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const res = await fetch(`${supabaseUrl()}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`db ${res.status} on ${path}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Resolves the caller from their bearer token. Returns null when not signed in. */
export async function callerId(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const res = await fetch(`${supabaseUrl()}/auth/v1/user`, {
    headers: { Authorization: auth, apikey: Deno.env.get('SUPABASE_ANON_KEY') ?? '' },
  });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: string };
  return user.id ?? null;
}

/**
 * Marks an order paid and releases its certificate. Idempotent: the browser
 * callback and the webhook both land here and may race, and Razorpay retries
 * webhooks, so completing an already-completed order must be a no-op.
 */
export async function markOrderPaid(
  orderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): Promise<{ alreadyPaid: boolean; certificateId: string }> {
  const rows = await db<Array<{ id: string; certificate_id: string; status: string }>>(
    `payment_orders?id=eq.${orderId}&select=id,certificate_id,status`,
  );
  const order = rows[0];
  if (!order) throw new Error('order not found');
  if (order.status === 'completed') return { alreadyPaid: true, certificateId: order.certificate_id };

  await db(`payment_orders?id=eq.${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'completed',
      completed_at: new Date().toISOString(),
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    }),
  });
  await db(`certificates?id=eq.${order.certificate_id}`, {
    method: 'PATCH',
    body: JSON.stringify({ is_paid: true, paid_at: new Date().toISOString(), can_download: true }),
  });
  return { alreadyPaid: false, certificateId: order.certificate_id };
}
