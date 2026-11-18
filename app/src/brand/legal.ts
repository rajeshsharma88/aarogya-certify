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
   * The registered legal entity. Razorpay matches this against the bank
   * account and the KYC documents, so it must be exactly as registered —
   * "Aarogya India Gurukul" alone is likely not it if you are a company,
   * LLP, or a proprietorship trading under a different name.
   */
  legalEntityName: TODO,

  /** Sole Proprietorship | Partnership | LLP | Private Limited Company | Trust | Society */
  entityType: TODO,

  /** Full registered address including city, state and PIN code. */
  registeredAddress: TODO,

  /** Operating address, if different from the registered one. */
  operatingAddress: TODO,

  /**
   * Razorpay requires a working telephone number on the site, and the
   * Consumer Protection (E-Commerce) Rules expect contact details that reach
   * a human.
   */
  phone: TODO,

  supportEmail: SUPPORT_EMAIL,

  /** GSTIN if registered. Leave as TODO if you are below the threshold. */
  gstin: TODO,

  /**
   * The Consumer Protection (E-Commerce) Rules, 2020 require a named
   * grievance officer with contact details published on the site.
   */
  grievanceOfficerName: TODO,
  grievanceOfficerEmail: TODO,

  /** Working hours for support, e.g. "Monday to Saturday, 10:00–18:00 IST". */
  supportHours: TODO,

  /** Governing law venue for disputes, e.g. "Lucknow, Uttar Pradesh". */
  jurisdiction: TODO,

  /** Certificate price in rupees, matching CERTIFICATE_PRICE_PAISE on the server. */
  certificatePriceInr: 299,

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
