import { describe, expect, it } from 'vitest';
import { LocalProvider } from '../local/LocalProvider';
import { CERTIFICATIONS, DOMAINS, QUESTIONS } from '../seed';

async function newProvider() {
  localStorage.clear();
  const provider = new LocalProvider();
  // allow the async admin seed hash to settle without blocking correctness
  await new Promise((r) => setTimeout(r, 0));
  return provider;
}

describe('catalog', () => {
  it('lists domains and certifications', async () => {
    const p = await newProvider();
    const domains = await p.listDomains();
    const certs = await p.listCertifications();
    // Derived from the seed so adding a domain or certification does not
    // require editing this assertion.
    expect(domains.length).toBe(DOMAINS.filter((d) => d.isActive).length);
    expect(certs.length).toBe(CERTIFICATIONS.filter((c) => c.isActive).length);
    expect(certs[0].title).toBeTruthy();
  });

  it('searches by keyword and filters by domain', async () => {
    const p = await newProvider();
    const search = await p.listCertifications({ search: 'nutrition' });
    expect(search.length).toBeGreaterThan(0);
    for (const c of search) {
      const hay = `${c.title} ${c.shortDesc} ${c.topics.join(' ')}`.toLowerCase();
      expect(hay).toContain('nutrition');
    }

    const health = await p.listCertifications({ domainSlug: 'health' });
    expect(health.length).toBeGreaterThan(0);
    for (const c of health) expect(c.domainId).toBe('dom-health');
  });

  it('sorts alphabetically and by newest', async () => {
    const p = await newProvider();
    const az = await p.listCertifications({ sort: 'az' });
    const titles = az.map((c) => c.title);
    expect([...titles].sort((a, b) => a.localeCompare(b))).toEqual(titles);

    const newest = await p.listCertifications({ sort: 'newest' });
    const dates = newest.map((c) => Date.parse(c.createdAt));
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });

  it('resolves a certification by slug', async () => {
    const p = await newProvider();
    const cert = await p.getCertificationBySlug('web-development');
    expect(cert?.title).toBe('Web Development');
  });
});

describe('auth', () => {
  it('registers, logs in and rejects duplicates', async () => {
    const p = await newProvider();
    const user = await p.register('Asha Verma', 'asha@example.com', 'password123');
    expect(user.role).toBe('candidate');
    expect(user.email).toBe('asha@example.com');

    await expect(p.register('Asha', 'asha@example.com', 'password123')).rejects.toThrow(/already exists/i);

    await p.logout();
    expect(await p.currentUser()).toBeNull();

    const again = await p.login('asha@example.com', 'password123');
    expect(again.id).toBe(user.id);

    await expect(p.login('asha@example.com', 'wrong-password')).rejects.toThrow(/invalid/i);
  });

  it('seeds an admin account with the admin role', async () => {
    const p = await newProvider();
    const admin = await p.login('admin@aarogya.in', 'Admin@12345');
    expect(admin.role).toBe('admin');
  });
});

function correctOptionIds(questionId: string): string[] {
  const q = QUESTIONS.find((x) => x.id === questionId)!;
  return q.options.filter((o) => o.isCorrect).map((o) => o.id);
}

describe('assessment engine', () => {
  it('creates a randomized attempt and never exposes correct answers', async () => {
    const p = await newProvider();
    const user = await p.register('Rahul Nair', 'rahul@example.com', 'password123');
    const cert = (await p.getCertificationBySlug('data-analytics'))!;

    const attempt = await p.startAttempt(user.id, cert.id, 'Rahul Nair');
    expect(attempt.status).toBe('in_progress');
    expect(attempt.questionIds).toHaveLength(cert.questionCount);
    expect(new Set(attempt.questionIds).size).toBe(cert.questionCount);

    // duplicate start returns the same in-progress attempt
    const again = await p.startAttempt(user.id, cert.id, 'Rahul Nair');
    expect(again.id).toBe(attempt.id);

    const questions = await p.getAttemptQuestions(attempt.id);
    expect(questions).toHaveLength(cert.questionCount);
    for (const q of questions) {
      expect(q.options.length).toBeGreaterThan(1);
      for (const o of q.options) expect(o).not.toHaveProperty('isCorrect');
    }
  });

  it('scores a perfect attempt server-side and issues one certificate', async () => {
    const p = await newProvider();
    const user = await p.register('Meera Iyer', 'meera@example.com', 'password123');
    const cert = (await p.getCertificationBySlug('web-development'))!;
    const attempt = await p.startAttempt(user.id, cert.id, 'Meera Iyer');

    for (const qid of attempt.questionIds) {
      await p.saveAnswer(attempt.id, qid, correctOptionIds(qid));
    }

    const result = await p.submitAttempt(attempt.id);
    expect(result.scorePct).toBe(100);
    expect(result.correctCount).toBe(result.totalCount);
    expect(result.passed).toBe(true);
    expect(result.level).toBe('Expert');
    expect(result.breakdown.length).toBeGreaterThan(0);

    const certs = await p.listCertificates(user.id);
    expect(certs).toHaveLength(1);
    expect(certs[0].status).toBe('valid');
    expect(certs[0].certificateNo).toMatch(/^AIC-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/);

    // duplicate submission is idempotent and does not mint a second certificate
    const again = await p.submitAttempt(attempt.id);
    expect(again.id).toBe(result.id);
    expect(await p.listCertificates(user.id)).toHaveLength(1);

    // answers are locked after submission
    await expect(p.saveAnswer(attempt.id, attempt.questionIds[0], [])).rejects.toThrow(/already been submitted/i);
  });

  it('fails an attempt with no correct answers and issues no certificate', async () => {
    const p = await newProvider();
    const user = await p.register('Vikram Rao', 'vikram@example.com', 'password123');
    const cert = (await p.getCertificationBySlug('hr-recruitment'))!;
    const attempt = await p.startAttempt(user.id, cert.id, 'Vikram Rao');

    for (const qid of attempt.questionIds) {
      const q = QUESTIONS.find((x) => x.id === qid)!;
      const wrong = q.options.filter((o) => !o.isCorrect).map((o) => o.id);
      await p.saveAnswer(attempt.id, qid, wrong);
    }
    const result = await p.submitAttempt(attempt.id);
    expect(result.scorePct).toBe(0);
    expect(result.passed).toBe(false);
    expect(await p.listCertificates(user.id)).toHaveLength(0);
  });
});

describe('certificate verification', () => {
  it('verifies a valid certificate publicly', async () => {
    const p = await newProvider();
    const user = await p.register('Neha Gupta', 'neha@example.com', 'password123');
    const cert = (await p.getCertificationBySlug('digital-marketing'))!;
    const attempt = await p.startAttempt(user.id, cert.id, 'Neha Gupta');
    for (const qid of attempt.questionIds) await p.saveAnswer(attempt.id, qid, correctOptionIds(qid));
    await p.submitAttempt(attempt.id);
    const issued = (await p.listCertificates(user.id))[0];

    const view = await p.verifyCertificate(issued.certificateNo);
    expect(view.found).toBe(true);
    expect(view.status).toBe('valid');
    expect(view.holderName).toBe('Neha Gupta');
    expect(view.title).toBe('Digital Marketing');
    expect(view.org).toBe('Aarogya India');
    expect(view.certificateNo).toBe(issued.certificateNo);
  });

  it('reports invalid IDs as not recognized', async () => {
    const p = await newProvider();
    const view = await p.verifyCertificate('AIC-0000-0000-0000');
    expect(view.found).toBe(false);
    expect(view.status).toBe('not_recognized');
  });

  it('reflects revocation immediately in public verification', async () => {
    const p = await newProvider();
    const user = await p.register('Arjun Singh', 'arjun@example.com', 'password123');
    const cert = (await p.getCertificationBySlug('cyber-security'))!;
    const attempt = await p.startAttempt(user.id, cert.id, 'Arjun Singh');
    for (const qid of attempt.questionIds) await p.saveAnswer(attempt.id, qid, correctOptionIds(qid));
    await p.submitAttempt(attempt.id);
    const issued = (await p.listCertificates(user.id))[0];

    expect((await p.verifyCertificate(issued.certificateNo)).status).toBe('valid');
    await p.revokeCertificate(issued.id);
    const after = await p.verifyCertificate(issued.certificateNo);
    expect(after.status).toBe('revoked');
    expect(after.found).toBe(true);
  });
});

describe('admin', () => {
  it('reports analytics and manages catalog records', async () => {
    const p = await newProvider();
    const domain = await p.upsertDomain({ name: 'Legal & Compliance', description: 'Law and compliance' });
    expect(domain.slug).toBe('legal-compliance');

    const cert = await p.upsertCertification({
      title: 'Contract Law Basics',
      domainId: domain.id,
      shortDesc: 'Foundations of contract law',
      durationSec: 600,
      passScorePct: 70,
      questionCount: 5,
    });
    expect(cert.passScorePct).toBe(70);

    const q = await p.upsertQuestion({ certificationId: cert.id, body: 'What is an offer?' });
    expect(q.options.length).toBe(4);
    expect((await p.listQuestions(cert.id)).length).toBe(1);

    const analytics = await p.analytics();
    expect(analytics.totalUsers).toBeGreaterThanOrEqual(0);
    expect(analytics.byDomain.some((d) => d.domain === 'Legal & Compliance')).toBe(true);
  });
});
