import { describe, expect, it } from 'vitest';
import { LEGAL, TODO, hasMissingLegalDetails, isMissing, missingLegalFields } from '../legal';
import { SUPPORT_EMAIL } from '../contact';

/**
 * These guard the facts on the policy pages. Razorpay and Meta read those
 * pages against the real registered business, so the failure mode worth
 * catching is a detail that is silently blank, or one that drifts out of step
 * with what the product actually does.
 */

describe('legal details', () => {
  it('flags every unfilled field by name', () => {
    const missing = missingLegalFields();
    for (const [key, value] of Object.entries(LEGAL)) {
      if (typeof value === 'string' && value === TODO) {
        expect(missing).toContain(key);
      }
    }
    expect(hasMissingLegalDetails()).toBe(missing.length > 0);
  });

  it('treats blank and whitespace as missing, not as filled in', () => {
    expect(isMissing(TODO)).toBe(true);
    expect(isMissing('')).toBe(true);
    expect(isMissing('   ')).toBe(true);
    expect(isMissing('Lucknow, Uttar Pradesh')).toBe(false);
  });

  it('uses the same support address as the rest of the app', () => {
    // Two different contact addresses across the site is exactly the kind of
    // inconsistency a payment-gateway reviewer picks up on.
    expect(LEGAL.supportEmail).toBe(SUPPORT_EMAIL);
  });

  it('states a price that matches the server default', () => {
    // CERTIFICATE_PRICE_PAISE defaults to 29900 in the edge function. If the
    // published price and the charged price diverge, that is a mis-selling
    // problem, not a typo.
    expect(LEGAL.certificatePriceInr * 100).toBe(29900);
  });

  it('keeps the trading name in step with the brand', () => {
    expect(LEGAL.brandName).toBe('Aarogya India Gurukul');
  });
});
