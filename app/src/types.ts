export type Role = 'candidate' | 'admin';
export type Language = 'en' | 'hi';

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  createdAt: string;
  preferredLanguage?: Language; // NEW: User's language preference
}

export interface Domain {
  id: string;
  slug: string;
  name: string;
  description: string;
  nameHi?: string; // NEW: Hindi name
  descriptionHi?: string; // NEW: Hindi description
  icon: string; // emoji/icon key
  sortOrder: number;
  isActive: boolean;
}

export interface Certification {
  id: string;
  domainId: string;
  slug: string;
  title: string;
  shortDesc: string;
  description: string;
  eligibility: string;
  titleHi?: string; // NEW: Hindi title
  shortDescHi?: string; // NEW: Hindi short description
  descriptionHi?: string; // NEW: Hindi description
  eligibilityHi?: string; // NEW: Hindi eligibility
  durationSec: number;
  questionCount: number;
  passScorePct: number;
  topics: string[];
  isActive: boolean;
  popularity: number;
  createdAt: string;
}

export type QuestionType = 'mcq_single' | 'mcq_multi' | 'true_false';

export interface QuestionOption {
  id: string;
  questionId: string;
  label: string;
  labelHi?: string; // NEW: Hindi label
  isCorrect: boolean;
  sortOrder: number;
}

export interface Question {
  id: string;
  certificationId: string;
  domainId: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  qtype: QuestionType;
  body: string;
  bodyHi?: string; // NEW: Hindi question body
  explanation?: string;
  explanationHi?: string; // NEW: Hindi explanation
  isActive: boolean;
  options: QuestionOption[];
}

export type AttemptStatus = 'in_progress' | 'submitted' | 'expired' | 'scored';

export interface AttemptQuestion {
  id: string;
  attemptId: string;
  questionId: string;
  position: number;
}

export interface Attempt {
  id: string;
  userId: string;
  certificationId: string;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string;
  durationSec: number;
  candidateName: string;
  questionIds: string[]; // randomized selection, ordered
  answers: Record<string, string[]>; // questionId -> selected optionIds
  markedForReview: string[]; // questionIds
}

export interface TopicBreakdown {
  topic: string;
  correct: number;
  total: number;
  pct: number;
}

export interface Result {
  id: string;
  attemptId: string;
  scorePct: number;
  correctCount: number;
  totalCount: number;
  passed: boolean;
  level: string;
  breakdown: TopicBreakdown[];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  createdAt: string;
}

export type CertificateStatus = 'valid' | 'revoked' | 'expired';

export interface Certificate {
  id: string;
  certificateNo: string; // non-guessable public ID
  userId: string;
  attemptId: string;
  certificationId: string;
  holderName: string;
  title: string;
  scorePct: number;
  issueDate: string;
  expiryDate?: string;
  status: CertificateStatus;
  verifyToken: string;
  createdAt: string;
}

export interface VerificationView {
  found: boolean;
  certificateNo: string;
  holderName?: string;
  title?: string;
  org?: string;
  issueDate?: string;
  expiryDate?: string;
  scorePct?: number;
  status?: CertificateStatus | 'not_recognized';
  message: string;
}

export interface CatalogFilter {
  search?: string;
  domainSlug?: string;
  sort?: 'popular' | 'newest' | 'az';
}

// NEW: Localization types (Phase 1)
export interface LocalizationContext {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultValue?: string) => string;
  localize: <T extends Record<string, any>>(content: T, textFields: (keyof T)[]) => T;
}

export interface LocalizableContent {
  // Content that has both EN and HI versions
  enVersion: Record<string, any>;
  hiVersion: Record<string, any>;
}

// ============================================ Payment Types (Phase 1)

export type PaymentOrderStatus = 'pending' | 'completed' | 'failed' | 'refunded';
export type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';
export type Currency = 'INR' | 'USD' | 'EUR';

export interface PaymentOrder {
  id: string;
  userId: string;
  certificateId: string;
  amountPaise: number; // 100 paise = ₹1
  currency: Currency;
  status: PaymentOrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  completedAt?: string;
  refundedAt?: string;
  certificate?: {
    id: string;
    title: string;
    certificateNo: string;
  };
}

export interface PaymentInvoice {
  id: string;
  orderId: string;
  invoiceNumber: string;
  fullName?: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  amountPaise?: number;
  gstAmountPaise?: number;
  totalAmountPaise?: number;
  pdfUrl?: string;
  generatedAt?: string;
  createdAt: string;
}

export interface CertificateDownload {
  id: string;
  certificateId: string;
  orderId: string;
  downloadCount: number;
  lastDownloadedAt?: string;
  createdAt: string;
}

export interface LinkedInShare {
  id: string;
  certificateId: string;
  orderId: string;
  linkedinPostId?: string;
  sharedAt?: string;
  shareText?: string;
  certificateBadgeUrl?: string;
  verificationUrl?: string;
  createdAt: string;
}

export interface RazorpayOptions {
  key: string; // Razorpay Key ID (public)
  amount: number; // amount in paise
  currency: Currency;
  order_id: string; // Razorpay order ID
  name: string; // merchant name
  description: string;
  handler?: (response: RazorpayResponse) => void;
  prefill?: {
    name: string;
    email: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
}

export interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
