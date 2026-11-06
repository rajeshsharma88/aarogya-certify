/**
 * The one place the support address is written down.
 *
 * It was previously hardcoded as `support@aarogya.in` on the payment-failure and
 * refund pages — a domain Aarogya India does not use, so a candidate whose ₹299
 * payment failed was being sent to an address that bounces. Defining it once
 * means the next change is one edit, not a grep.
 */
export const SUPPORT_EMAIL = 'certification@aarogyaindiagurukul.com';

/** `mailto:` link, optionally with a prefilled subject. */
export function supportMailto(subject?: string): string {
  return subject ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}` : `mailto:${SUPPORT_EMAIL}`;
}
