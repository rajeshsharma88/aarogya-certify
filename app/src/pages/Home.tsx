import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { useLanguage } from '../hooks/useLanguage';
import { provider } from '../data';
import { CertificationCard } from '../components/CertificationCard';
import { Spinner } from '../components/ui';

const FAQS = [
  {
    q: 'Is the assessment really free?',
    a: 'Yes. Every assessment on Aarogya India is free to take, and eligible candidates receive a digital certificate at no cost.',
  },
  {
    q: 'How is my assessment scored?',
    a: 'Objective questions are scored automatically by the server using the stored answer key. This is rule-based automated scoring — not an AI model.',
  },
  {
    q: 'Can anyone verify my certificate?',
    a: 'Yes. Every certificate has a unique ID and a QR code that opens a public verification page. No login is needed to verify.',
  },
  {
    q: 'What if I do not pass?',
    a: 'You will see a full skill breakdown with strengths and improvement areas, and you can retake the assessment when you are ready.',
  },
  {
    q: 'How long is a certificate valid?',
    a: 'Certificates are valid unless the issuer revokes them. If an expiry is configured for a certification, verification reports the expiry date.',
  },
];

export function Home() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [query, setQuery] = useState('');
  const { data: domains } = useAsync(() => provider.listDomains(language), [language]);
  const { data: certs, loading } = useAsync(() => provider.listCertifications({ sort: 'popular' }, language), [language]);

  const featured = (certs ?? []).slice(0, 6);
  const domainById = new Map((domains ?? []).map((d) => [d.id, d]));

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(query.trim() ? `/certifications?q=${encodeURIComponent(query.trim())}` : '/certifications');
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-saffron-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="container-page relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="chip bg-white text-brand-800 ring-1 ring-brand-200">
              Free skill assessments · Verifiable certificates
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-6xl">
              {t('heroTitle')}
              <span className="block text-brand-700">{t('heroSubtitle')}</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
              {language === 'en'
                ? 'Take short, objective skill assessments across technology, health, business and more. Get a certificate with a unique ID that anyone can verify in seconds.'
                : 'तकनीकी, स्वास्थ्य, व्यावसायिक और अन्य क्षेत्रों में कई प्रकार के कौशल मूल्यांकन लें। एक अद्वितीय आईडी वाला प्रमाणपत्र प्राप्त करें जिसे कोई भी कुछ सेकंड में सत्यापित कर सकता है।'}
            </p>

            <form onSubmit={submitSearch} className="mx-auto mt-8 flex max-w-xl gap-2" role="search">
              <label className="sr-only" htmlFor="hero-search">
                {t('searchPlaceholder')}
              </label>
              <input
                id="hero-search"
                className="input"
                placeholder={t('searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button type="submit" className="btn-primary shrink-0">
                {language === 'en' ? 'Search' : 'खोजें'}
              </button>
            </form>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link to="/certifications" className="btn-primary">
                {language === 'en' ? 'Explore certifications' : 'प्रमाणपत्र देखें'}
              </Link>
              <Link to="/verify" className="btn-outline">
                {language === 'en' ? 'Verify a certificate' : 'प्रमाणपत्र सत्यापित करें'}
              </Link>
            </div>

            <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
              {[
                ['8', 'Domains'],
                ['24', 'Certifications'],
                ['100%', 'Free'],
                ['Instant', 'Certificates'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-display text-2xl font-semibold text-brand-800">{value}</dd>
                  <dd className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Browse by field</p>
            <h2 className="section-title mt-1">Certification categories</h2>
          </div>
          <Link to="/certifications" className="btn-ghost">
            View all <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(domains ?? []).map((d) => (
            <Link
              key={d.id}
              to={`/certifications?domain=${d.slug}`}
              className="card flex items-start gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-50 text-xl" aria-hidden>
                {d.icon}
              </span>
              <span>
                <span className="block font-semibold text-ink">{d.name}</span>
                <span className="mt-0.5 block text-sm text-slate-600">{d.description}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="border-y border-slate-200 bg-white py-16">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Most popular</p>
              <h2 className="section-title mt-1">Featured certifications</h2>
            </div>
            <Link to="/certifications?sort=popular" className="btn-ghost">
              See all certifications <span aria-hidden>→</span>
            </Link>
          </div>
          {loading ? (
            <Spinner />
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((c) => (
                <CertificationCard key={c.id} cert={c} domain={domainById.get(c.domainId)} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="section-title mt-1">Three steps to a verified certificate</h2>
        </div>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            ['Pick your skill', 'Browse the directory, compare assessment details, and choose the certification that matches your goals.'],
            ['Take the assessment', 'Answer a short, timed set of objective questions. You can navigate, change answers and mark questions for review.'],
            ['Earn and share', 'Pass, receive your marked certificate with a unique ID and QR code, then share a public verification link.'],
          ].map(([title, body], i) => (
            <li key={title} className="card p-6">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-saffron-100 font-display text-lg font-semibold text-saffron-700">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm text-slate-600">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Benefits */}
      <section className="border-y border-slate-200 bg-brand-900 py-16 text-white">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-saffron-300">Why certify</p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              A credential you can prove — not just claim.
            </h2>
            <p className="mt-4 max-w-xl text-brand-100">
              Recruiters and institutions can independently confirm every certificate. No screenshots, no
              guessing — just a public verification page backed by your assessment record.
            </p>
            <Link to="/certifications" className="btn-accent mt-8">
              Start a free assessment
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              ['Tamper-evident', 'Unique certificate numbers with public verification status.'],
              ['Skill-level analysis', 'See exactly which topics you have mastered and where to improve.'],
              ['Instant download', 'Export a print-ready PDF certificate immediately after passing.'],
              ['Revocation-aware', 'If a certificate is revoked, verification reflects it immediately.'],
            ].map(([title, body]) => (
              <li key={title} className="rounded-xl border border-white/15 bg-white/5 p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-brand-100">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Steps to obtain a certificate */}
      <section className="container-page py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Certificate journey</p>
          <h2 className="section-title mt-1">Steps to obtain your certificate</h2>
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Choose a certification', 'Review eligibility, duration and pass mark.'],
            ['Enter your details', 'The name you enter appears on the certificate.'],
            ['Complete the assessment', 'The timer submits automatically when it ends.'],
            ['Download and share', 'Get your PDF and public verification link.'],
          ].map(([title, body], i) => (
            <li key={title} className="relative rounded-xl border border-slate-200 bg-white p-5">
              <span className="text-xs font-bold text-brand-600">STEP {i + 1}</span>
              <h3 className="mt-1 font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-200 bg-white py-16">
        <div className="container-page mx-auto max-w-3xl">
          <div className="text-center">
            <p className="eyebrow">FAQ</p>
            <h2 className="section-title mt-1">Common questions</h2>
          </div>
          <div className="mt-8 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {FAQS.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-ink">
                  {f.q}
                  <span className="text-slate-400 transition group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-16">
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-brand-700 to-brand-900 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Ready to prove your skill?</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Pick a certification, take the assessment, and walk away with a verifiable credential.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/certifications" className="btn-accent">
              Browse certifications
            </Link>
            <Link to="/verify" className="btn inline-flex border border-white/40 text-white hover:bg-white/10">
              Verify a certificate
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
