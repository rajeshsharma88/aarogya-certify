import type {
  Attempt,
  Certificate,
  Certification,
  CatalogFilter,
  Currency,
  Domain,
  PaymentInvoice,
  PaymentOrder,
  Profile,
  Question,
  Result,
  VerificationView,
} from '../../types';
import type { DataProvider } from '../DataProvider';

/**
 * Supabase adapter implementing the same DataProvider surface.
 *
 * Requires VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY and the schema in
 * `supabase/migrations/0001_init.sql` (tables, RLS, and RPCs):
 *   start_attempt, get_attempt_questions, save_answer, toggle_mark_for_review,
 *   submit_attempt, verify_certificate, admin_analytics, admin_upsert_*
 *
 * All authorization/scoring happens server-side (RLS + SECURITY DEFINER RPCs).
 * Nothing here trusts the client for correctness.
 */
export class SupabaseProvider implements DataProvider {
  private sessionKey = 'ac:sb-session';
  private url: string;
  private anonKey: string;

  constructor(url: string, anonKey: string) {
    this.url = url;
    this.anonKey = anonKey;
  }

  // ---------------------------------------------------------------- http
  private token(): string | null {
    try {
      const raw = localStorage.getItem(this.sessionKey);
      return raw ? (JSON.parse(raw).access_token as string) : null;
    } catch {
      return null;
    }
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const token = this.token();
    return {
      apikey: this.anonKey,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
  }

  private async rest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${this.url}/rest/v1/${path}`, {
      ...init,
      headers: this.headers(init.headers as Record<string, string> | undefined),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Supabase ${res.status}: ${text || res.statusText}`);
    }
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  private async rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
    return this.rest<T>(`rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) });
  }

  private async auth(path: string, body?: unknown): Promise<any> {
    const res = await fetch(`${this.url}/auth/v1/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { apikey: this.anonKey, 'Content-Type': 'application/json', ...(this.token() ? { Authorization: `Bearer ${this.token()}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Auth ${res.status}: ${detail || res.statusText}`);
    }
    return res.status === 204 ? null : res.json();
  }

  private async profileFor(token: { access_token: string; user: { id: string; email?: string } }): Promise<Profile> {
    localStorage.setItem(this.sessionKey, JSON.stringify(token));
    const rows = await this.rest<Profile[]>(`profiles?id=eq.${token.user.id}&select=*`);
    const row = rows[0];
    if (row) return row;
    // Fallback: create profile row (RLS allows self-insert).
    const created = await this.rest<Profile[]>('profiles', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ id: token.user.id, full_name: token.user.email ?? 'Learner', role: 'candidate' }),
    });
    return created[0];
  }

  // ------------------------------------------------------------- catalog
  async listDomains(): Promise<Domain[]> {
    const rows = await this.rest<Array<Record<string, any>>>('domains?is_active=eq.true&select=*&order=sort_order.asc');
    return rows.map(mapDomain);
  }

  async getDomainBySlug(slug: string): Promise<Domain | undefined> {
    const rows = await this.rest<Array<Record<string, any>>>(`domains?slug=eq.${encodeURIComponent(slug)}&select=*`);
    return rows[0] ? mapDomain(rows[0]) : undefined;
  }

  async listCertifications(filter: CatalogFilter = {}): Promise<Certification[]> {
    const params = new URLSearchParams({ is_active: 'eq.true', select: '*' });
    if (filter.search) params.set('or', `(title.ilike.%${filter.search}%,short_desc.ilike.%${filter.search}%)`);
    params.set('order', filter.sort === 'newest' ? 'created_at.desc' : filter.sort === 'az' ? 'title.asc' : 'popularity.desc');
    let rows = await this.rest<Array<Record<string, any>>>(`certifications?${params.toString()}`);
    if (filter.domainSlug) {
      const dom = await this.getDomainBySlug(filter.domainSlug);
      if (dom) rows = rows.filter((r) => r.domain_id === dom.id);
    }
    return rows.map(mapCertification);
  }

  async getCertificationBySlug(slug: string): Promise<Certification | undefined> {
    const rows = await this.rest<Array<Record<string, any>>>(`certifications?slug=eq.${encodeURIComponent(slug)}&select=*`);
    return rows[0] ? mapCertification(rows[0]) : undefined;
  }

  // ---------------------------------------------------------------- auth
  async register(fullName: string, email: string, password: string): Promise<Profile> {
    const out = await this.auth('signup', { email, password, data: { full_name: fullName } });
    if (out?.access_token) return this.profileFor(out);
    // email-confirmation enabled: sign in immediately if possible
    const login = await this.auth('token?grant_type=password', { email, password });
    return this.profileFor(login);
  }

  async login(email: string, password: string): Promise<Profile> {
    const out = await this.auth('token?grant_type=password', { email, password });
    return this.profileFor(out);
  }

  async logout(): Promise<void> {
    try {
      await this.auth('logout', {});
    } catch {
      /* ignore */
    }
    localStorage.removeItem(this.sessionKey);
  }

  async currentUser(): Promise<Profile | null> {
    if (!this.token()) return null;
    try {
      const user = await this.auth('user');
      if (!user?.id) return null;
      const rows = await this.rest<Profile[]>(`profiles?id=eq.${user.id}&select=*`);
      return rows[0] ?? null;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------- assessment
  async startAttempt(_userId: string, certificationId: string, candidateName: string): Promise<Attempt> {
    const row = await this.rpc<Record<string, any>>('start_attempt', {
      p_certification_id: certificationId,
      p_candidate_name: candidateName,
    });
    return mapAttempt(row);
  }

  async getAttemptQuestions(attemptId: string) {
    const rows = await this.rpc<Array<Record<string, any>>>('get_attempt_questions', { p_attempt_id: attemptId });
    return rows.map((r) => ({
      id: r.id,
      certificationId: r.certification_id,
      domainId: r.domain_id,
      topic: r.topic,
      difficulty: r.difficulty,
      qtype: r.qtype,
      body: r.body,
      isActive: r.is_active,
      options: (r.options ?? []).map((o: any) => ({
        id: o.id,
        questionId: o.question_id,
        label: o.label,
        sortOrder: o.sort_order,
      })),
    }));
  }

  async saveAnswer(attemptId: string, questionId: string, optionIds: string[]): Promise<void> {
    await this.rpc('save_answer', { p_attempt_id: attemptId, p_question_id: questionId, p_option_ids: optionIds });
  }

  async toggleMarkForReview(attemptId: string, questionId: string): Promise<void> {
    await this.rpc('toggle_mark_for_review', { p_attempt_id: attemptId, p_question_id: questionId });
  }

  async getAttempt(attemptId: string): Promise<Attempt | undefined> {
    const rows = await this.rest<Array<Record<string, any>>>(`attempts?id=eq.${attemptId}&select=*`);
    return rows[0] ? mapAttempt(rows[0]) : undefined;
  }

  async listAttempts(userId: string): Promise<Attempt[]> {
    const rows = await this.rest<Array<Record<string, any>>>(`attempts?user_id=eq.${userId}&select=*&order=started_at.desc`);
    return rows.map(mapAttempt);
  }

  async submitAttempt(attemptId: string): Promise<Result> {
    const row = await this.rpc<Record<string, any>>('submit_attempt', { p_attempt_id: attemptId });
    return mapResult(row);
  }

  async getResult(attemptId: string): Promise<Result | undefined> {
    const rows = await this.rest<Array<Record<string, any>>>(`results?attempt_id=eq.${attemptId}&select=*`);
    return rows[0] ? mapResult(rows[0]) : undefined;
  }

  // -------------------------------------------------------- certificates
  async getCertificateByAttempt(attemptId: string): Promise<Certificate | undefined> {
    const rows = await this.rest<Array<Record<string, any>>>(`certificates?attempt_id=eq.${attemptId}&select=*`);
    return rows[0] ? mapCertificate(rows[0]) : undefined;
  }

  async getCertificateByNo(certificateNo: string): Promise<Certificate | undefined> {
    const rows = await this.rest<Array<Record<string, any>>>(
      `certificates?certificate_no=eq.${encodeURIComponent(certificateNo.trim().toUpperCase())}&select=*`,
    );
    return rows[0] ? mapCertificate(rows[0]) : undefined;
  }

  async listCertificates(userId: string): Promise<Certificate[]> {
    const rows = await this.rest<Array<Record<string, any>>>(`certificates?user_id=eq.${userId}&select=*&order=issue_date.desc`);
    return rows.map(mapCertificate);
  }

  async verifyCertificate(certificateNo: string): Promise<VerificationView> {
    return this.rpc<VerificationView>('verify_certificate', { p_certificate_no: certificateNo.trim().toUpperCase() });
  }

  async revokeCertificate(certificateId: string): Promise<void> {
    await this.rpc('revoke_certificate', { p_certificate_id: certificateId });
  }

  // --------------------------------------------------------------- admin
  async listAllAttempts(): Promise<Attempt[]> {
    const rows = await this.rest<Array<Record<string, any>>>('attempts?select=*&order=started_at.desc');
    return rows.map(mapAttempt);
  }

  async listAllCertificates(): Promise<Certificate[]> {
    const rows = await this.rest<Array<Record<string, any>>>('certificates?select=*&order=issue_date.desc');
    return rows.map(mapCertificate);
  }

  async listUsers(): Promise<Profile[]> {
    return this.rest<Profile[]>('profiles?select=*');
  }

  async listQuestions(certificationId: string): Promise<Question[]> {
    const rows = await this.rest<Array<Record<string, any>>>(
      `questions?certification_id=eq.${certificationId}&select=*,options:question_options(*)`,
    );
    return rows.map(mapQuestion);
  }

  async upsertDomain(input: Partial<Domain> & { name: string }): Promise<Domain> {
    const payload = {
      id: input.id,
      slug: input.slug ?? slugify(input.name),
      name: input.name,
      description: input.description ?? '',
      icon: input.icon ?? '📘',
      sort_order: input.sortOrder ?? 99,
      is_active: input.isActive ?? true,
    };
    const rows = await this.rest<Array<Record<string, any>>[]>('domains?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(payload),
    });
    return mapDomain(rows[0]);
  }

  async upsertCertification(
    input: Partial<Certification> & { title: string; domainId: string },
  ): Promise<Certification> {
    const payload = {
      id: input.id,
      domain_id: input.domainId,
      slug: input.slug ?? slugify(input.title),
      title: input.title,
      short_desc: input.shortDesc ?? '',
      description: input.description ?? '',
      eligibility: input.eligibility ?? '',
      duration_sec: input.durationSec ?? 420,
      question_count: input.questionCount ?? 10,
      pass_score_pct: input.passScorePct ?? 60,
      topics: input.topics ?? [],
      is_active: input.isActive ?? true,
      popularity: input.popularity ?? 50,
    };
    const rows = await this.rest<Array<Record<string, any>>[]>('certifications?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(payload),
    });
    return mapCertification(rows[0]);
  }

  async upsertQuestion(
    input: Partial<Question> & { certificationId: string; body: string },
  ): Promise<Question> {
    const qid = input.id ?? crypto.randomUUID();
    const rows = await this.rest<Array<Record<string, any>>[]>('questions?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({
        id: qid,
        certification_id: input.certificationId,
        topic: input.topic ?? 'General',
        difficulty: input.difficulty ?? 'medium',
        qtype: input.qtype ?? 'mcq_single',
        body: input.body,
        explanation: input.explanation ?? null,
        is_active: input.isActive ?? true,
      }),
    });
    const question = rows[0];
    if (input.options?.length) {
      await this.rest('question_options?on_conflict=id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify(
          input.options.map((o) => ({
            id: o.id ?? crypto.randomUUID(),
            question_id: qid,
            label: o.label,
            is_correct: o.isCorrect,
            sort_order: o.sortOrder,
          })),
        ),
      });
    }
    return mapQuestion({ ...question, options: input.options ?? [] });
  }

  async analytics() {
    return this.rpc<{
      totalUsers: number;
      totalAttempts: number;
      totalCertificates: number;
      passRate: number;
      byDomain: Array<{ domain: string; attempts: number; certificates: number }>;
    }>('admin_analytics');
  }

  // -------------------------------------------------------- payments (Phase 1)
  async createPaymentOrder(
    certificateId: string,
    amountPaise: number,
    currency?: Currency
  ): Promise<PaymentOrder> {
    const result = await this.rpc<PaymentOrder>('create_payment_order', {
      p_certificate_id: certificateId,
      p_amount_paise: amountPaise,
      p_currency: currency || 'INR',
    });
    return result;
  }

  async getPaymentStatus(certificateId: string): Promise<PaymentOrder | null> {
    const result = await this.rpc<PaymentOrder>('get_payment_status', {
      p_certificate_id: certificateId,
    });
    return result || null;
  }

  async getUserPaymentOrders(): Promise<PaymentOrder[]> {
    const result = await this.rpc<PaymentOrder[]>('get_user_payment_orders');
    return result || [];
  }

  async completePayment(
    orderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<PaymentOrder> {
    const result = await this.rpc<PaymentOrder>('complete_payment', {
      p_order_id: orderId,
      p_razorpay_payment_id: razorpayPaymentId,
      p_razorpay_signature: razorpaySignature,
    });
    return result;
  }

  async getPaymentInvoice(orderId: string): Promise<PaymentInvoice | null> {
    // TODO: Implement in Phase 1 continuation once RPCs are ready in Supabase
    const result = await this.rpc<PaymentInvoice>('get_payment_invoice', {
      p_order_id: orderId,
    });
    return result || null;
  }

  // Phase 2: Certificate Features
  async downloadCertificatePdf(_certificateId: string): Promise<Blob> {
    // TODO: Implement once Supabase integration is complete
    throw new Error('Not implemented in Supabase yet');
  }

  async downloadInvoicePdf(_orderId: string): Promise<Blob> {
    // TODO: Implement once Supabase integration is complete
    throw new Error('Not implemented in Supabase yet');
  }

  async generateInvoiceHtml(_orderId: string): Promise<string> {
    // TODO: Implement once Supabase integration is complete
    throw new Error('Not implemented in Supabase yet');
  }
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function mapDomain(r: Record<string, any>): Domain {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? '',
    icon: r.icon ?? '📘',
    sortOrder: r.sort_order ?? 0,
    isActive: r.is_active ?? true,
  };
}

function mapCertification(r: Record<string, any>): Certification {
  return {
    id: r.id,
    domainId: r.domain_id,
    slug: r.slug,
    title: r.title,
    shortDesc: r.short_desc ?? '',
    description: r.description ?? '',
    eligibility: r.eligibility ?? '',
    durationSec: r.duration_sec ?? 420,
    questionCount: r.question_count ?? 10,
    passScorePct: r.pass_score_pct ?? 60,
    topics: r.topics ?? [],
    isActive: r.is_active ?? true,
    popularity: r.popularity ?? 0,
    createdAt: r.created_at ?? new Date().toISOString(),
  };
}

function mapAttempt(r: Record<string, any>): Attempt {
  return {
    id: r.id,
    userId: r.user_id,
    certificationId: r.certification_id,
    status: r.status,
    startedAt: r.started_at,
    submittedAt: r.submitted_at ?? undefined,
    durationSec: r.duration_sec,
    candidateName: r.candidate_name,
    questionIds: r.question_ids ?? [],
    answers: r.answers ?? {},
    markedForReview: r.marked_for_review ?? [],
  };
}

function mapResult(r: Record<string, any>): Result {
  return {
    id: r.id,
    attemptId: r.attempt_id,
    scorePct: r.score_pct,
    correctCount: r.correct_count,
    totalCount: r.total_count,
    passed: r.passed,
    level: r.level,
    breakdown: r.breakdown ?? [],
    strengths: r.strengths ?? [],
    improvements: r.improvements ?? [],
    recommendations: r.recommendations ?? [],
    createdAt: r.created_at,
  };
}

function mapCertificate(r: Record<string, any>): Certificate {
  return {
    id: r.id,
    certificateNo: r.certificate_no,
    userId: r.user_id,
    attemptId: r.attempt_id,
    certificationId: r.certification_id,
    holderName: r.holder_name,
    title: r.title,
    scorePct: r.score_pct,
    issueDate: r.issue_date,
    expiryDate: r.expiry_date ?? undefined,
    status: r.status,
    verifyToken: r.verify_token,
    createdAt: r.created_at,
  };
}

function mapQuestion(r: Record<string, any>): Question {
  return {
    id: r.id,
    certificationId: r.certification_id,
    domainId: r.domain_id ?? '',
    topic: r.topic ?? 'General',
    difficulty: r.difficulty ?? 'medium',
    qtype: r.qtype ?? 'mcq_single',
    body: r.body,
    explanation: r.explanation ?? undefined,
    isActive: r.is_active ?? true,
    options: (r.options ?? []).map((o: any) => ({
      id: o.id,
      questionId: o.question_id,
      label: o.label,
      isCorrect: o.is_correct ?? false,
      sortOrder: o.sort_order ?? 0,
    })),
  };
}
