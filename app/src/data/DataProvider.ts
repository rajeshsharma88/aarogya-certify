import type {
  Attempt,
  Certificate,
  Certification,
  CatalogFilter,
  Currency,
  Domain,
  Language,
  LinkedInShare,
  PaymentInvoice,
  PaymentOrder,
  Profile,
  Question,
  Result,
  VerificationView,
} from '../types';

/**
 * Single data-layer interface. The app talks only to this.
 * - LocalProvider: self-contained in-browser implementation (seeded, localStorage).
 * - SupabaseProvider: same surface backed by Supabase Auth/Postgres/RLS/RPC.
 * Select via VITE_DATA_BACKEND=local|supabase (default local).
 */
export interface DataProvider {
  // catalog (public) — language parameter for bilingual content
  listDomains(language?: Language): Promise<Domain[]>;
  listCertifications(filter?: CatalogFilter, language?: Language): Promise<Certification[]>;
  getCertificationBySlug(slug: string, language?: Language): Promise<Certification | undefined>;
  getDomainBySlug(slug: string, language?: Language): Promise<Domain | undefined>;

  // auth & profile
  register(fullName: string, email: string, password: string): Promise<Profile>;
  login(email: string, password: string): Promise<Profile>;
  logout(): Promise<void>;
  currentUser(): Promise<Profile | null>;

  // assessment — language parameter for bilingual questions
  /** Creates an attempt with a randomized question selection. Correct answers are never returned. */
  startAttempt(userId: string, certificationId: string, candidateName: string): Promise<Attempt>;
  /** Public-safe questions for an attempt (options without isCorrect). Optionally in a specific language. */
  getAttemptQuestions(attemptId: string, language?: Language): Promise<Array<Omit<Question, 'options'> & { options: Array<Omit<Question['options'][number], 'isCorrect'>> }>>;
  saveAnswer(attemptId: string, questionId: string, optionIds: string[]): Promise<void>;
  toggleMarkForReview(attemptId: string, questionId: string): Promise<void>;
  getAttempt(attemptId: string): Promise<Attempt | undefined>;
  /** Server-side scoring + result + (if passed) certificate issuance. Idempotent. */
  submitAttempt(attemptId: string): Promise<Result>;
  getResult(attemptId: string): Promise<Result | undefined>;
  listAttempts(userId: string): Promise<Attempt[]>;

  // certificates
  getCertificateByAttempt(attemptId: string): Promise<Certificate | undefined>;
  getCertificateByNo(certificateNo: string): Promise<Certificate | undefined>;
  listCertificates(userId: string): Promise<Certificate[]>;
  /** Public, login-independent verification. */
  verifyCertificate(certificateNo: string): Promise<VerificationView>;
  revokeCertificate(certificateId: string): Promise<void>;

  // admin
  listAllAttempts(): Promise<Attempt[]>;
  listAllCertificates(): Promise<Certificate[]>;
  upsertDomain(domain: Partial<Domain> & { name: string }): Promise<Domain>;
  upsertCertification(cert: Partial<Certification> & { title: string; domainId: string }): Promise<Certification>;
  upsertQuestion(question: Partial<Question> & { certificationId: string; body: string }): Promise<Question>;
  listQuestions(certificationId: string): Promise<Question[]>;
  listUsers(): Promise<Profile[]>;
  analytics(): Promise<{
    totalUsers: number;
    totalAttempts: number;
    totalCertificates: number;
    passRate: number;
    byDomain: Array<{ domain: string; attempts: number; certificates: number }>;
  }>;

  // payments (Phase 1)
  /** Create a payment order for a certificate download. Returns Razorpay order details. */
  createPaymentOrder(certificateId: string, amountPaise: number, currency?: Currency): Promise<PaymentOrder>;
  /** Get payment status for a certificate. */
  getPaymentStatus(certificateId: string): Promise<PaymentOrder | null>;
  /** Get all payment orders for the current user. */
  getUserPaymentOrders(): Promise<PaymentOrder[]>;
  /** Mark a payment as completed (called after Razorpay verification). Admin only. */
  completePayment(orderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<PaymentOrder>;
  /** Get invoice for a payment order. */
  getPaymentInvoice(orderId: string): Promise<PaymentInvoice | null>;

  // payments (Phase 2: Certificate Features)
  /** Generate and download certificate PDF (checks payment status). */
  downloadCertificatePdf(certificateId: string): Promise<Blob>;
  /** Get or generate invoice PDF for a payment order. */
  downloadInvoicePdf(orderId: string): Promise<Blob>;
  /** Generate invoice HTML for email or preview. */
  generateInvoiceHtml(orderId: string): Promise<string>;

  // linkedin (Phase 3: LinkedIn Integration)
  /** Check if user has LinkedIn OAuth token. */
  hasLinkedInToken(): Promise<boolean>;
  /** Get LinkedIn OAuth authorization URL. */
  getLinkedInAuthUrl(): string;
  /** Handle LinkedIn OAuth callback with authorization code. */
  handleLinkedInCallback(code: string, state: string): Promise<{ accessToken: string }>;
  /** Share certificate to LinkedIn as UGC post with verified badge. */
  shareToLinkedIn(certificateId: string, shareText: string): Promise<LinkedInShare>;
  /** Get LinkedIn share history for a certificate. */
  getLinkedInShares(certificateId: string): Promise<LinkedInShare[]>;
  /** Revoke LinkedIn access token and clear stored credentials. */
  revokeLinkedInAccess(): Promise<void>;
}
