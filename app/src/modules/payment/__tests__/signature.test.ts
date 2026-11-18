import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  hmacSha256Hex,
  isValidCheckoutSignature,
  isValidWebhookSignature,
  timingSafeEqual,
} from '../../../../../supabase/functions/_shared/signature';

/**
 * These test the exact code the edge functions run — the file is imported from
 * supabase/functions rather than copied, so the test cannot drift from what is
 * deployed.
 *
 * The expected values are computed independently with node:crypto, so this
 * checks our implementation against Razorpay's documented algorithm
 * (HMAC-SHA256, hex) rather than against itself.
 */

const SECRET = 'test_key_secret_do_not_use';
const ORDER = 'order_QxYzAbC123456';
const PAYMENT = 'pay_QxYzDeF789012';

const nodeHmac = (secret: string, msg: string) =>
  createHmac('sha256', secret).update(msg).digest('hex');

describe('hmacSha256Hex', () => {
  it('matches node:crypto for the checkout payload', async () => {
    const msg = `${ORDER}|${PAYMENT}`;
    expect(await hmacSha256Hex(SECRET, msg)).toBe(nodeHmac(SECRET, msg));
  });

  it('produces lowercase hex of the right length', async () => {
    expect(await hmacSha256Hex(SECRET, 'anything')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is sensitive to the separator, not just the parts', async () => {
    // "a|bc" and "ab|c" must not collide — otherwise an attacker could shift
    // the boundary between order and payment id.
    expect(await hmacSha256Hex(SECRET, 'a|bc')).not.toBe(await hmacSha256Hex(SECRET, 'ab|c'));
  });
});

describe('timingSafeEqual', () => {
  it('accepts identical strings and rejects differences anywhere', () => {
    expect(timingSafeEqual('abc123', 'abc123')).toBe(true);
    expect(timingSafeEqual('abc123', 'xbc123')).toBe(false); // first character
    expect(timingSafeEqual('abc123', 'abc12x')).toBe(false); // last character
    expect(timingSafeEqual('abc123', 'abc1234')).toBe(false); // length
    expect(timingSafeEqual('', '')).toBe(true);
  });
});

describe('isValidCheckoutSignature', () => {
  it('accepts a signature produced the way Razorpay produces it', async () => {
    const signature = nodeHmac(SECRET, `${ORDER}|${PAYMENT}`);
    expect(await isValidCheckoutSignature(SECRET, ORDER, PAYMENT, signature)).toBe(true);
  });

  it('rejects a forged signature', async () => {
    expect(await isValidCheckoutSignature(SECRET, ORDER, PAYMENT, 'f'.repeat(64))).toBe(false);
  });

  it('rejects a signature made with a different secret', async () => {
    const signature = nodeHmac('someone-elses-secret', `${ORDER}|${PAYMENT}`);
    expect(await isValidCheckoutSignature(SECRET, ORDER, PAYMENT, signature)).toBe(false);
  });

  it('rejects a signature replayed for a different payment', async () => {
    const signature = nodeHmac(SECRET, `${ORDER}|${PAYMENT}`);
    expect(await isValidCheckoutSignature(SECRET, ORDER, 'pay_someOtherPayment', signature)).toBe(false);
    expect(await isValidCheckoutSignature(SECRET, 'order_someOtherOrder', PAYMENT, signature)).toBe(false);
  });

  it('rejects empty inputs rather than treating them as valid', async () => {
    // The stub this replaced returned true for any non-empty triple.
    expect(await isValidCheckoutSignature(SECRET, ORDER, PAYMENT, '')).toBe(false);
    expect(await isValidCheckoutSignature('', ORDER, PAYMENT, 'x')).toBe(false);
    expect(await isValidCheckoutSignature(SECRET, '', PAYMENT, 'x')).toBe(false);
    expect(await isValidCheckoutSignature(SECRET, ORDER, '', 'x')).toBe(false);
  });

  it('rejects the kind of made-up values the old stub accepted', async () => {
    expect(await isValidCheckoutSignature(SECRET, 'order_x', 'pay_x', 'signature_x')).toBe(false);
  });
});

describe('isValidWebhookSignature', () => {
  const body = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_1' } } } });

  it('accepts a signature over the exact raw body', async () => {
    expect(await isValidWebhookSignature(SECRET, body, nodeHmac(SECRET, body))).toBe(true);
  });

  it('rejects when the body is re-serialised differently', async () => {
    // Proves the raw bytes matter: reformatting the JSON must invalidate it,
    // which is why the function hashes the text before parsing.
    const reserialised = JSON.stringify(JSON.parse(body), null, 2);
    expect(await isValidWebhookSignature(SECRET, reserialised, nodeHmac(SECRET, body))).toBe(false);
  });

  it('rejects a missing signature header', async () => {
    expect(await isValidWebhookSignature(SECRET, body, '')).toBe(false);
  });
});
