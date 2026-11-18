import { SUPPORT_EMAIL } from './contact';

/**
 * Every business fact the legal pages state, in one place.
 *
 * Razorpay's merchant review and Meta's advertiser review both check these
 * pages against the real registered business. A wrong address or an invented
 * entity name is worse than a blank one: it reads as misrepresentation and can
 * fail the review or, later, put the account at risk.
 *
 * So anything not yet known is left as TODO. Unfilled values render as a
 * visible "needs your details" marker rather than quietly printing nothing or,
 * worse, something plausible that is not true.
 */

export const TODO = '__TODO__';

export const LEGAL = {
  /** Trading name, as shown to candidates. */
  brandName: 'Aarogya India Gurukul',

  /**
   * Taken from the organisation name published on aarogyaindia.hospital.
   *
   * CONFIRM BEFORE SUBMITTING TO RAZORPAY: this is a published trading name,
   * not necessarily the registered one. Razorpay matches it against the bank
   * account and KYC documents, so if the entity is registered with a suffix
   * ("… Pvt Ltd", "… LLP") or under a different name entirely, use that exact
   * string instead.
   */
  legalEntityName: 'Aarogya India Wellness Hospital',

  /** Sole Proprietorship | Partnership | LLP | Private Limited Company | Trust | Society */
  entityType: TODO,

  /**
   * The corporate office given in the hospital site's footer.
   *
   * Note: that site's /contact page gives a different address — "Bisrakh,
   * Greater Noida, Uttar Pradesh" — recorded below as the operating address.
   * Razorpay expects the address on the site to match the KYC documents, so
   * confirm which of the two is the registered one.
   */
  registeredAddress: 'E-23, E Block, Sector 63, Noida, Hazratpur Wajidpur, Uttar Pradesh 201309',

  /** From the hospital site's contact page. */
  operatingAddress: 'Bisrakh, Greater Noida, Uttar Pradesh',

  /**
   * The published toll-free customer service line. The hospital site also
   * lists 8448191460 (technical support) and +91 97203 70596 (contact page).
   * Whichever is shown here must actually be answered — Razorpay's reviewers
   * do call it.
   */
  phone: '1800 410 8080 (toll-free)',

  /**
   * The certification product's own address, not the hospital's
   * contact@aarogyaindia.com, so support for a certificate reaches the people
   * who can act on it.
   */
  supportEmail: SUPPORT_EMAIL,

  /** GSTIN if registered. Not published on the hospital site. */
  gstin: TODO,

  /**
   * The Consumer Protection (E-Commerce) Rules, 2020 require a *named*
   * grievance officer with contact details published on the site. The
   * hospital site names no one, so this has to come from you.
   */
  grievanceOfficerName: TODO,
  grievanceOfficerEmail: TODO,

  /** As published on the hospital site's footer. */
  supportHours: 'Monday to Saturday, 9:00–19:00 IST',

  /**
   * The district covering both the Noida and Greater Noida addresses.
   * This is a legal election rather than a fact from the site — change it if
   * your contracts specify a different venue.
   */
  jurisdiction: 'Gautam Buddh Nagar, Uttar Pradesh',

  /**
   * Certificate price in rupees.
   *
   * This is the published figure, and it must match CERTIFICATE_PRICE_PAISE on
   * the server — the edge function charges that, not this. Publishing one
   * price and charging another is a mis-selling problem, not a typo, so
   * legal.test.ts asserts the two agree.
   *
   * Changing it here is not enough on its own: if CERTIFICATE_PRICE_PAISE is
   * set explicitly in Coolify it overrides the function's default, so update
   * it there too.
   */
  certificatePriceInr: 2999,

  /** Last review date shown on the policies. Update when you change them. */
  lastUpdated: '18 November 2026',
} as const;

export function isMissing(value: string): boolean {
  return value === TODO || value.trim() === '';
}

/** True when any legal detail is still unfilled — used to warn before going live. */
export function hasMissingLegalDetails(): boolean {
  return Object.values(LEGAL).some((v) => typeof v === 'string' && isMissing(v));
}

export function missingLegalFields(): string[] {
  return Object.entries(LEGAL)
    .filter(([, v]) => typeof v === 'string' && isMissing(v))
    .map(([k]) => k);
}
