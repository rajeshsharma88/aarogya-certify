/**
 * Razorpay signature primitives.
 *
 * Deliberately free of any Deno or Supabase API so the same source can be
 * exercised by the app's test suite — this is the code that decides whether a
 * payment is genuine, and it should not be the one part nothing tests.
 * Uses Web Crypto, which both Deno and Node provide.
 */

export async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time comparison. A plain === returns as soon as two characters
 * differ, and that timing difference leaks how much of a forged signature was
 * correct — enough, repeated, to construct a valid one.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Checkout callback signature: HMAC-SHA256 of "<order_id>|<payment_id>" keyed
 * with the Razorpay key secret.
 */
export async function isValidCheckoutSignature(
  keySecret: string,
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
): Promise<boolean> {
  if (!keySecret || !razorpayOrderId || !razorpayPaymentId || !signature) return false;
  const expected = await hmacSha256Hex(keySecret, `${razorpayOrderId}|${razorpayPaymentId}`);
  return timingSafeEqual(expected, signature);
}

/**
 * Webhook signature: HMAC-SHA256 of the raw request body keyed with the
 * webhook secret, which is a different secret from the API key secret.
 * The body must be the exact bytes received — re-serialising the JSON first
 * changes the hash.
 */
export async function isValidWebhookSignature(
  webhookSecret: string,
  rawBody: string,
  signature: string,
): Promise<boolean> {
  if (!webhookSecret || !signature) return false;
  const expected = await hmacSha256Hex(webhookSecret, rawBody);
  return timingSafeEqual(expected, signature);
}
