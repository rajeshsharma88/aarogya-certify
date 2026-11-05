import type {
  Attempt,
  Certificate,
  Certification,
  CatalogFilter,
  Currency,
  Domain,
  Language,
  PaymentInvoice,
  PaymentOrder,
  Profile,
  Question,
  Result,
  VerificationView,
} from '../../types';
import { localizeCertification, localizeDomain } from '../../i18n';
import { CERTIFICATIONS, DOMAINS, QUESTIONS } from '../seed';
import type { DataProvider } from '../DataProvider';

const K = {
  domains: 'ac:domains',
  certifications: 'ac:certifications',
  questions: 'ac:questions',
  users: 'ac:users',
  profiles: 'ac:profiles',
  attempts: 'ac:attempts',
  results: 'ac:results',
  certificates: 'ac:certificates',
  session: 'ac:session',
  verifications: 'ac:verification_logs',
  seeded: 'ac:seeded',
  paymentOrders: 'ac:payment_orders',
  paymentInvoices: 'ac:payment_invoices',
} as const;

interface StoredUser extends Profile {
  passwordHash: string;
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(out);
  else for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  return out;
}

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function randomCertBlock(len: number): string {
  const bytes = randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += CROCKFORD[bytes[i] % 32];
  return s;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for environments without WebCrypto (local mock only; never production).
  let h = 2166136261;
  for (const b of data) {
    h ^= b;
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export class LocalProvider implements DataProvider {
  constructor() {
    this.ensureSeeded();
  }

  // ------------------------------------------------------------------ seed
  private ensureSeeded(): void {
    if (localStorage.getItem(K.seeded) === '1') return;
    write(K.domains, DOMAINS);
    write(K.certifications, CERTIFICATIONS);
    write(K.questions, QUESTIONS);
    const admin: StoredUser = {
      id: 'user-admin',
      fullName: 'Aarogya Admin',
      email: 'admin@aarogya.in',
      role: 'admin',
      createdAt: new Date().toISOString(),
      // password: Admin@12345 — hashed at seed time below
      passwordHash: '',
    };
    // Deterministic salt so the seeded credential is reproducible.
    admin.passwordHash = 'seed';
    write(K.users, [admin]);
    write(K.profiles, [this.stripPassword(admin)]);
    localStorage.setItem(K.seeded, '1');
    // Async hash backfill (safe: login also supports first-run fallback).
    void this.hash('Admin@12345', 'seed').then((h) => {
      const users = read<StoredUser[]>(K.users, []);
      const idx = users.findIndex((u) => u.id === admin.id);
      if (idx >= 0) {
        users[idx].passwordHash = h;
        write(K.users, users);
      }
    });
  }

  private async hash(password: string, salt: string): Promise<string> {
    return hashPassword(password, salt);
  }

  private stripPassword(u: StoredUser): Profile {
    const { passwordHash: _omit, ...profile } = u;
    return profile;
  }

  private users(): StoredUser[] {
    return read<StoredUser[]>(K.users, []);
  }

  // ------------------------------------------------------------- catalog
  async listDomains(language: Language = 'en'): Promise<Domain[]> {
    return read<Domain[]>(K.domains, [])
      .filter((d) => d.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((d) => localizeDomain(d, language));
  }

  async getDomainBySlug(slug: string, language: Language = 'en'): Promise<Domain | undefined> {
    const domain = read<Domain[]>(K.domains, []).find((d) => d.slug === slug);
    return domain ? localizeDomain(domain, language) : undefined;
  }

  async listCertifications(filter: CatalogFilter = {}, language: Language = 'en'): Promise<Certification[]> {
    let list = read<Certification[]>(K.certifications, []).filter((c) => c.isActive);
    const domains = read<Domain[]>(K.domains, []);
    if (filter.domainSlug) {
      const dom = domains.find((d) => d.slug === filter.domainSlug);
      if (dom) list = list.filter((c) => c.domainId === dom.id);
    }
    if (filter.search?.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.shortDesc.toLowerCase().includes(q) ||
          (c.titleHi?.toLowerCase().includes(q) || false) ||
          (c.shortDescHi?.toLowerCase().includes(q) || false) ||
          c.topics.some((t) => t.toLowerCase().includes(q)),
      );
    }
    if (filter.sort === 'az') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (filter.sort === 'newest') list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    else list.sort((a, b) => b.popularity - a.popularity);
    return list.map((c) => localizeCertification(c, language));
  }

  async getCertificationBySlug(slug: string, language: Language = 'en'): Promise<Certification | undefined> {
    const cert = read<Certification[]>(K.certifications, []).find((c) => c.slug === slug);
    return cert ? localizeCertification(cert, language) : undefined;
  }

  // ---------------------------------------------------------------- auth
  async register(fullName: string, email: string, password: string): Promise<Profile> {
    const users = this.users();
    const normalized = email.toLowerCase().trim();
    if (users.some((u) => u.email.toLowerCase() === normalized)) {
      throw new Error('An account with this email already exists.');
    }
    if (password.length < 8) throw new Error('Password must be at least 8 characters.');
    const salt = randomBytes(8).join('-');
    const user: StoredUser = {
      id: uid(),
      fullName: fullName.trim(),
      email: normalized,
      role: 'candidate',
      createdAt: new Date().toISOString(),
      passwordHash: await this.hash(password, salt),
    };
    // store salt alongside hash
    user.passwordHash = `${salt}$${user.passwordHash}`;
    users.push(user);
    write(K.users, users);
    const profiles = read<Profile[]>(K.profiles, []);
    profiles.push(this.stripPassword(user));
    write(K.profiles, profiles);
    localStorage.setItem(K.session, user.id);
    return this.stripPassword(user);
  }

  async login(email: string, password: string): Promise<Profile> {
    const users = this.users();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) throw new Error('Invalid email or password.');
    let ok = false;
    if (user.passwordHash.includes('$')) {
      const [salt, hash] = user.passwordHash.split('$');
      ok = (await this.hash(password, salt)) === hash;
    } else {
      // seeded admin hash may still be backfilling
      ok = password === 'Admin@12345';
    }
    if (!ok) throw new Error('Invalid email or password.');
    localStorage.setItem(K.session, user.id);
    return this.stripPassword(user);
  }

  async logout(): Promise<void> {
    localStorage.removeItem(K.session);
  }

  async currentUser(): Promise<Profile | null> {
    const id = localStorage.getItem(K.session);
    if (!id) return null;
    const user = this.users().find((u) => u.id === id);
    return user ? this.stripPassword(user) : null;
  }

  // ---------------------------------------------------------- assessment
  private attempts(): Attempt[] {
    return read<Attempt[]>(K.attempts, []);
  }

  private results(): Result[] {
    return read<Result[]>(K.results, []);
  }

  private questions(): Question[] {
    return read<Question[]>(K.questions, []);
  }

  async startAttempt(userId: string, certificationId: string, candidateName: string): Promise<Attempt> {
    const attempts = this.attempts();
    const existing = attempts.find(
      (a) => a.userId === userId && a.certificationId === certificationId && a.status === 'in_progress',
    );
    if (existing) return existing;
    const cert = read<Certification[]>(K.certifications, []).find((c) => c.id === certificationId);
    if (!cert) throw new Error('Certification not found.');
    const bank = this.questions().filter((q) => q.certificationId === certificationId && q.isActive);
    if (bank.length === 0) throw new Error('This assessment has no questions yet.');
    const selected = shuffle(bank).slice(0, Math.min(cert.questionCount, bank.length));
    const attempt: Attempt = {
      id: uid(),
      userId,
      certificationId,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      durationSec: cert.durationSec,
      candidateName,
      questionIds: selected.map((q) => q.id),
      answers: {},
      markedForReview: [],
    };
    attempts.push(attempt);
    write(K.attempts, attempts);
    return attempt;
  }

  async getAttemptQuestions(attemptId: string, language: Language = 'en') {
    const attempt = this.attempts().find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found.');
    const all = this.questions();
    return attempt.questionIds.map((qid) => {
      const q = all.find((x) => x.id === qid);
      if (!q) throw new Error('Question not found.');

      // Localize question content based on language
      const displayBody = language === 'hi' && q.bodyHi ? q.bodyHi : q.body;
      const displayOptions = q.options.map((o) => ({
        id: o.id,
        questionId: o.questionId,
        label: language === 'hi' && o.labelHi ? o.labelHi : o.label,
        sortOrder: o.sortOrder,
      }));

      return {
        id: q.id,
        certificationId: q.certificationId,
        domainId: q.domainId,
        topic: q.topic,
        difficulty: q.difficulty,
        qtype: q.qtype,
        body: displayBody,
        isActive: q.isActive,
        options: displayOptions
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder),
      };
    });
  }

  async saveAnswer(attemptId: string, questionId: string, optionIds: string[]): Promise<void> {
    const attempts = this.attempts();
    const attempt = attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found.');
    if (attempt.status !== 'in_progress') throw new Error('This attempt has already been submitted.');
    attempt.answers[questionId] = optionIds;
    write(K.attempts, attempts);
  }

  async toggleMarkForReview(attemptId: string, questionId: string): Promise<void> {
    const attempts = this.attempts();
    const attempt = attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found.');
    attempt.markedForReview = attempt.markedForReview.includes(questionId)
      ? attempt.markedForReview.filter((x) => x !== questionId)
      : [...attempt.markedForReview, questionId];
    write(K.attempts, attempts);
  }

  async getAttempt(attemptId: string): Promise<Attempt | undefined> {
    return this.attempts().find((a) => a.id === attemptId);
  }

  async listAttempts(userId: string): Promise<Attempt[]> {
    return this.attempts()
      .filter((a) => a.userId === userId)
      .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  }

  async submitAttempt(attemptId: string): Promise<Result> {
    const attempts = this.attempts();
    const attempt = attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found.');
    const existing = this.results().find((r) => r.attemptId === attemptId);
    if (existing) return existing; // idempotent: prevents duplicate submissions
    if (attempt.status !== 'in_progress') throw new Error('Attempt is not in progress.');

    return this.scoreAttempt(attemptId);
  }

  /** Server-side equivalent scoring for the local provider. */
  private scoreAttempt(attemptId: string): Result {
    const attempts = this.attempts();
    const attempt = attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error('Attempt not found.');
    const all = this.questions();
    const cert = read<Certification[]>(K.certifications, []).find((c) => c.id === attempt.certificationId);

    let correctCount = 0;
    const byTopic = new Map<string, { correct: number; total: number }>();
    for (const qid of attempt.questionIds) {
      const q = all.find((x) => x.id === qid);
      if (!q) continue;
      const selected = new Set(attempt.answers[qid] ?? []);
      const correctSet = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id));
      const isCorrect =
        selected.size === correctSet.size && [...correctSet].every((id) => selected.has(id));
      if (isCorrect) correctCount++;
      const t = byTopic.get(q.topic) ?? { correct: 0, total: 0 };
      t.total++;
      if (isCorrect) t.correct++;
      byTopic.set(q.topic, t);
    }
    const totalCount = attempt.questionIds.length;
    const scorePct = totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);
    const passScorePct = cert?.passScorePct ?? 60;
    const passed = scorePct >= passScorePct;
    const breakdown = [...byTopic.entries()].map(([topic, v]) => ({
      topic,
      correct: v.correct,
      total: v.total,
      pct: v.total === 0 ? 0 : Math.round((v.correct / v.total) * 100),
    }));
    const level =
      scorePct >= 90 ? 'Expert' : scorePct >= 75 ? 'Advanced' : scorePct >= passScorePct ? 'Competent' : 'Developing';
    const strengths = breakdown.filter((b) => b.pct >= 70).map((b) => b.topic);
    const improvements = breakdown.filter((b) => b.pct < 70).map((b) => b.topic);
    const recommendations = improvements.length
      ? improvements.map((t) => `Review ${t} fundamentals and practise applied scenarios.`)
      : ['Keep your skills current with advanced practice in all covered topics.'];

    const result: Result = {
      id: uid(),
      attemptId,
      scorePct,
      correctCount,
      totalCount,
      passed,
      level,
      breakdown,
      strengths,
      improvements,
      recommendations,
      createdAt: new Date().toISOString(),
    };
    const results = this.results();
    results.push(result);
    write(K.results, results);

    attempt.status = 'scored';
    attempt.submittedAt = new Date().toISOString();
    write(K.attempts, attempts);

    if (passed && cert) this.issueCertificate(attempt, cert, scorePct);
    return result;
  }

  async getResult(attemptId: string): Promise<Result | undefined> {
    return this.results().find((r) => r.attemptId === attemptId);
  }

  // -------------------------------------------------------- certificates
  private certificates(): Certificate[] {
    return read<Certificate[]>(K.certificates, []);
  }

  private issueCertificate(attempt: Attempt, cert: Certification, scorePct: number): Certificate {
    const certificates = this.certificates();
    const existing = certificates.find((c) => c.attemptId === attempt.id);
    if (existing) return existing;
    let no = '';
    do {
      no = `AIC-${randomCertBlock(4)}-${randomCertBlock(4)}-${randomCertBlock(4)}`;
    } while (certificates.some((c) => c.certificateNo === no));
    const certificate: Certificate = {
      id: uid(),
      certificateNo: no,
      userId: attempt.userId,
      attemptId: attempt.id,
      certificationId: cert.id,
      holderName: attempt.candidateName,
      title: cert.title,
      scorePct,
      issueDate: new Date().toISOString(),
      status: 'valid',
      verifyToken: randomCertBlock(16),
      createdAt: new Date().toISOString(),
    };
    certificates.push(certificate);
    write(K.certificates, certificates);
    return certificate;
  }

  async getCertificateByAttempt(attemptId: string): Promise<Certificate | undefined> {
    return this.certificates().find((c) => c.attemptId === attemptId);
  }

  async getCertificateByNo(certificateNo: string): Promise<Certificate | undefined> {
    const norm = certificateNo.trim().toUpperCase();
    return this.certificates().find((c) => c.certificateNo === norm);
  }

  async listCertificates(userId: string): Promise<Certificate[]> {
    return this.certificates()
      .filter((c) => c.userId === userId)
      .sort((a, b) => Date.parse(b.issueDate) - Date.parse(a.issueDate));
  }

  private effectiveStatus(c: Certificate): 'valid' | 'revoked' | 'expired' {
    if (c.status === 'revoked') return 'revoked';
    if (c.expiryDate && Date.parse(c.expiryDate) < Date.now()) return 'expired';
    return 'valid';
  }

  async verifyCertificate(certificateNo: string): Promise<VerificationView> {
    const logs = read<any[]>(K.verifications, []);
    const found = await this.getCertificateByNo(certificateNo);
    logs.push({ at: new Date().toISOString(), certificateNo: certificateNo.trim().toUpperCase(), found: !!found });
    write(K.verifications, logs);

    if (!found) {
      return {
        found: false,
        certificateNo: certificateNo.trim().toUpperCase(),
        status: 'not_recognized',
        message: 'No certificate matches this ID. Check the ID and try again.',
      };
    }
    const status = this.effectiveStatus(found);
    const messages: Record<string, string> = {
      valid: 'This certificate is authentic and currently valid.',
      revoked: 'This certificate has been revoked by the issuer and is no longer valid.',
      expired: 'This certificate has expired.',
    };
    return {
      found: true,
      certificateNo: found.certificateNo,
      holderName: found.holderName,
      title: found.title,
      org: 'Aarogya India',
      issueDate: found.issueDate,
      expiryDate: found.expiryDate,
      scorePct: found.scorePct,
      status,
      message: messages[status],
    };
  }

  async revokeCertificate(certificateId: string): Promise<void> {
    const certificates = this.certificates();
    const cert = certificates.find((c) => c.id === certificateId);
    if (!cert) throw new Error('Certificate not found.');
    cert.status = 'revoked';
    write(K.certificates, certificates);
  }

  // --------------------------------------------------------------- admin
  async listAllAttempts(): Promise<Attempt[]> {
    return this.attempts().sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  }

  async listAllCertificates(): Promise<Certificate[]> {
    return this.certificates().sort((a, b) => Date.parse(b.issueDate) - Date.parse(a.issueDate));
  }

  async listUsers(): Promise<Profile[]> {
    return read<Profile[]>(K.profiles, []);
  }

  async listQuestions(certificationId: string): Promise<Question[]> {
    return this.questions().filter((q) => q.certificationId === certificationId);
  }

  async upsertDomain(input: Partial<Domain> & { name: string }): Promise<Domain> {
    const domains = read<Domain[]>(K.domains, []);
    const existing = input.id ? domains.find((d) => d.id === input.id) : undefined;
    if (existing) {
      Object.assign(existing, input);
      write(K.domains, domains);
      return existing;
    }
    const domain: Domain = {
      id: input.id ?? uid(),
      slug: input.slug ?? input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: input.name,
      description: input.description ?? '',
      icon: input.icon ?? '📘',
      sortOrder: input.sortOrder ?? domains.length + 1,
      isActive: input.isActive ?? true,
    };
    domains.push(domain);
    write(K.domains, domains);
    return domain;
  }

  async upsertCertification(
    input: Partial<Certification> & { title: string; domainId: string },
  ): Promise<Certification> {
    const certs = read<Certification[]>(K.certifications, []);
    const existing = input.id ? certs.find((c) => c.id === input.id) : undefined;
    if (existing) {
      Object.assign(existing, input);
      write(K.certifications, certs);
      return existing;
    }
    const cert: Certification = {
      id: input.id ?? uid(),
      domainId: input.domainId,
      slug: input.slug ?? input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title: input.title,
      shortDesc: input.shortDesc ?? '',
      description: input.description ?? input.shortDesc ?? '',
      eligibility: input.eligibility ?? 'Open to all learners.',
      durationSec: input.durationSec ?? 420,
      questionCount: input.questionCount ?? 10,
      passScorePct: input.passScorePct ?? 60,
      topics: input.topics ?? ['General'],
      isActive: input.isActive ?? true,
      popularity: input.popularity ?? 50,
      createdAt: new Date().toISOString(),
    };
    certs.push(cert);
    write(K.certifications, certs);
    return cert;
  }

  async upsertQuestion(
    input: Partial<Question> & { certificationId: string; body: string },
  ): Promise<Question> {
    const certs = read<Certification[]>(K.certifications, []);
    const cert = certs.find((c) => c.id === input.certificationId);
    const questions = this.questions();
    if (input.id) {
      const existing = questions.find((q) => q.id === input.id);
      if (existing) {
        Object.assign(existing, input);
        write(K.questions, questions);
        return existing;
      }
    }
    const qid = input.id ?? uid();
    const question: Question = {
      id: qid,
      certificationId: input.certificationId,
      domainId: cert?.domainId ?? '',
      topic: input.topic ?? cert?.topics[0] ?? 'General',
      difficulty: input.difficulty ?? 'medium',
      qtype: input.qtype ?? 'mcq_single',
      body: input.body,
      explanation: input.explanation,
      isActive: input.isActive ?? true,
      options:
        input.options ??
        [
          { id: uid(), questionId: qid, label: 'Option A', isCorrect: true, sortOrder: 0 },
          { id: uid(), questionId: qid, label: 'Option B', isCorrect: false, sortOrder: 1 },
          { id: uid(), questionId: qid, label: 'Option C', isCorrect: false, sortOrder: 2 },
          { id: uid(), questionId: qid, label: 'Option D', isCorrect: false, sortOrder: 3 },
        ],
    };
    questions.push(question);
    write(K.questions, questions);
    return question;
  }

  async analytics() {
    const users = read<Profile[]>(K.profiles, []).filter((u) => u.role === 'candidate');
    const attempts = this.attempts();
    const results = this.results();
    const certificates = this.certificates();
    const domains = read<Domain[]>(K.domains, []);
    const certs = read<Certification[]>(K.certifications, []);
    const passRate = results.length ? Math.round((results.filter((r) => r.passed).length / results.length) * 100) : 0;
    const byDomain = domains.map((d) => {
      const certIds = certs.filter((c) => c.domainId === d.id).map((c) => c.id);
      const domainAttempts = attempts.filter((a) => certIds.includes(a.certificationId)).length;
      const domainCerts = certificates.filter((c) => certIds.includes(c.certificationId)).length;
      return { domain: d.name, attempts: domainAttempts, certificates: domainCerts };
    });
    return {
      totalUsers: users.length,
      totalAttempts: attempts.length,
      totalCertificates: certificates.length,
      passRate,
      byDomain,
    };
  }

  // -------------------------------------------------------- payments (Phase 1)
  private paymentOrders(): PaymentOrder[] {
    return read<PaymentOrder[]>(K.paymentOrders, []);
  }

  private paymentInvoices(): PaymentInvoice[] {
    return read<PaymentInvoice[]>(K.paymentInvoices, []);
  }

  async createPaymentOrder(
    certificateId: string,
    amountPaise: number,
    currency: Currency = 'INR'
  ): Promise<PaymentOrder> {
    const user = await this.currentUser();
    if (!user) throw new Error('Not authenticated');

    // Check certificate exists and belongs to user
    const cert = this.certificates().find((c) => c.id === certificateId && c.userId === user.id);
    if (!cert) throw new Error('Certificate not found');

    // Check for existing pending order
    const existing = this.paymentOrders().find(
      (o) => o.userId === user.id && o.certificateId === certificateId && o.status === 'pending'
    );
    if (existing) return existing;

    // Generate mock Razorpay order ID
    const razorpayOrderId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const order: PaymentOrder = {
      id: uid(),
      userId: user.id,
      certificateId,
      amountPaise,
      currency,
      status: 'pending',
      razorpayOrderId,
      createdAt: new Date().toISOString(),
    };

    const orders = this.paymentOrders();
    orders.push(order);
    write(K.paymentOrders, orders);

    return order;
  }

  async getPaymentStatus(certificateId: string): Promise<PaymentOrder | null> {
    const user = await this.currentUser();
    if (!user) throw new Error('Not authenticated');

    const order = this.paymentOrders().find(
      (o) => o.userId === user.id && o.certificateId === certificateId && o.status === 'completed'
    );
    return order || null;
  }

  async getUserPaymentOrders(): Promise<PaymentOrder[]> {
    const user = await this.currentUser();
    if (!user) throw new Error('Not authenticated');

    return this.paymentOrders()
      .filter((o) => o.userId === user.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .map((o) => {
        const cert = this.certificates().find((c) => c.id === o.certificateId);
        return {
          ...o,
          certificate: cert
            ? {
                id: cert.id,
                title: cert.title,
                certificateNo: cert.certificateNo,
              }
            : undefined,
        };
      });
  }

  async completePayment(
    orderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<PaymentOrder> {
    const orders = this.paymentOrders();
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order not found');

    // In production, verify signature against Razorpay. For demo, just mark as complete.
    order.status = 'completed';
    order.completedAt = new Date().toISOString();
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paymentMethod = 'card'; // Mock payment method

    write(K.paymentOrders, orders);

    // Mark certificate as paid
    const certificates = this.certificates();
    const cert = certificates.find((c) => c.id === order.certificateId);
    if (cert) {
      cert.status = 'valid'; // Ensure valid status
      // Add payment tracking (in types.ts we added these fields)
      const certWithPayment = cert as any;
      certWithPayment.isPaid = true;
      certWithPayment.paidAt = new Date().toISOString();
      certWithPayment.canDownload = true;
      write(K.certificates, certificates);
    }

    // Generate mock invoice
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const invoice: PaymentInvoice = {
      id: uid(),
      orderId,
      invoiceNumber,
      fullName: cert?.holderName,
      email: 'candidate@example.com',
      amountPaise: order.amountPaise,
      gstAmountPaise: Math.round(order.amountPaise * 0.18),
      totalAmountPaise: order.amountPaise + Math.round(order.amountPaise * 0.18),
      generatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const invoices = this.paymentInvoices();
    invoices.push(invoice);
    write(K.paymentInvoices, invoices);

    return order;
  }

  async getPaymentInvoice(orderId: string): Promise<PaymentInvoice | null> {
    const user = await this.currentUser();
    if (!user) throw new Error('Not authenticated');

    const order = this.paymentOrders().find((o) => o.id === orderId && o.userId === user.id);
    if (!order) throw new Error('Order not found');

    return this.paymentInvoices().find((i) => i.orderId === orderId) || null;
  }

  // -------------------------------------------------------- Phase 2: Certificate Features

  async downloadCertificatePdf(certificateId: string): Promise<Blob> {
    const user = await this.currentUser();
    if (!user) throw new Error('Not authenticated');

    const cert = this.certificates().find((c) => c.id === certificateId && c.userId === user.id);
    if (!cert) throw new Error('Certificate not found');

    // For demo, we generate a simple PDF as HTML blob
    // In production, would check payment status and use real PDF generation
    const html = `
      <html>
        <head>
          <title>${cert.title} Certificate</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 40px; }
            .cert { border: 3px solid #0891b2; padding: 40px; margin: 40px auto; max-width: 800px; }
            .title { font-size: 28px; font-weight: bold; color: #0891b2; margin-bottom: 20px; }
            .details { margin: 30px 0; }
          </style>
        </head>
        <body>
          <div class="cert">
            <div class="title">Certificate of Achievement</div>
            <p>${cert.holderName}</p>
            <p>Successfully completed</p>
            <p class="title">${cert.title}</p>
            <div class="details">
              <p><strong>Score:</strong> ${cert.scorePct}%</p>
              <p><strong>Certificate ID:</strong> ${cert.certificateNo}</p>
              <p><strong>Issued:</strong> ${new Date(cert.issueDate).toLocaleDateString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    return new Blob([html], { type: 'text/html' });
  }

  async downloadInvoicePdf(orderId: string): Promise<Blob> {
    const user = await this.currentUser();
    if (!user) throw new Error('Not authenticated');

    const order = this.paymentOrders().find((o) => o.id === orderId && o.userId === user.id);
    if (!order) throw new Error('Order not found');

    const invoice = this.paymentInvoices().find((i) => i.orderId === orderId);
    if (!invoice) throw new Error('Invoice not found');

    const cert = this.certificates().find((c) => c.id === order.certificateId);
    if (!cert) throw new Error('Certificate not found');

    // For now, return HTML as blob (Phase 2+: integrate with html2pdf library)
    const html = await this.generateInvoiceHtml(orderId);
    return new Blob([html], { type: 'text/html' });
  }

  async generateInvoiceHtml(orderId: string): Promise<string> {
    const user = await this.currentUser();
    if (!user) throw new Error('Not authenticated');

    const order = this.paymentOrders().find((o) => o.id === orderId && o.userId === user.id);
    if (!order) throw new Error('Order not found');

    const invoice = this.paymentInvoices().find((i) => i.orderId === orderId);
    if (!invoice) throw new Error('Invoice not found');

    const cert = this.certificates().find((c) => c.id === order.certificateId);
    if (!cert) throw new Error('Certificate not found');

    const { generateInvoiceHTML } = await import('../../modules/payment/invoice');

    const invoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.createdAt || new Date().toISOString(),
      fullName: invoice.fullName || cert.holderName,
      email: invoice.email || 'candidate@example.com',
      certificateTitle: cert.title,
      amountPaise: order.amountPaise,
      gstAmountPaise: invoice.gstAmountPaise || Math.round(order.amountPaise * 0.18),
      totalAmountPaise: invoice.totalAmountPaise || order.amountPaise + Math.round(order.amountPaise * 0.18),
      gstNumber: invoice.gstNumber,
    };

    return generateInvoiceHTML(invoiceData);
  }
}
