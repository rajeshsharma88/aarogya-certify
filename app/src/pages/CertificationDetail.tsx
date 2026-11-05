import { Link, useParams } from 'react-router-dom';
import { provider } from '../data';
import { useAsync } from '../hooks/useAsync';
import { Badge, Spinner } from '../components/ui';

export function CertificationDetail() {
  const { slug = '' } = useParams();
  const { data, loading, error } = useAsync(async () => {
    const cert = await provider.getCertificationBySlug(slug);
    if (!cert) return null;
    const domain = await provider.getDomainBySlug(
      (await provider.listDomains()).find((d) => d.id === cert.domainId)?.slug ?? '',
    );
    return { cert, domain };
  }, [slug]);

  if (loading) return <Spinner label="Loading certification…" />;
  if (error || !data) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Certification not found</h1>
        <p className="mt-2 text-slate-600">The certification you are looking for does not exist or is no longer available.</p>
        <Link to="/certifications" className="btn-primary mt-6">
          Back to directory
        </Link>
      </div>
    );
  }

  const { cert, domain } = data;
  const minutes = Math.round(cert.durationSec / 60);

  return (
    <div className="container-page py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link to="/" className="hover:text-brand-700">Home</Link> /{' '}
        <Link to="/certifications" className="hover:text-brand-700">Certifications</Link> /{' '}
        <span className="text-slate-700">{cert.title}</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <div className="flex items-center gap-2">
            <Badge tone="brand">
              {domain?.icon} {domain?.name ?? 'Certification'}
            </Badge>
            <Badge tone="saffron">Free assessment</Badge>
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">{cert.title}</h1>
          <p className="mt-3 text-lg text-slate-600">{cert.shortDesc}</p>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-ink">About this certification</h2>
            <p className="mt-2 text-slate-600">{cert.description}</p>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-ink">Who is it for</h2>
            <p className="mt-2 text-slate-600">{cert.eligibility}</p>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-ink">Topics covered</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {cert.topics.map((t) => (
                <span key={t} className="chip bg-white text-slate-700 ring-1 ring-slate-200">
                  {t}
                </span>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold text-ink">Assessment details</h2>
            <dl className="mt-3 grid gap-4 sm:grid-cols-2">
              {[
                ['Format', 'Timed multiple-choice assessment'],
                ['Duration', `${minutes} minutes`],
                ['Questions', `${cert.questionCount} randomized questions`],
                ['Pass mark', `${cert.passScorePct}%`],
                ['Scoring', 'Automatic, server-side objective scoring'],
                ['Certificate', 'Digital, with unique ID + QR verification'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-slate-200 bg-white p-4">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</dt>
                  <dd className="mt-1 text-sm font-medium text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <p className="mt-8 rounded-lg bg-slate-100 p-4 text-sm text-slate-600">
            <strong className="text-ink">Honest note:</strong> this assessment uses rule-based automated scoring for
            objective questions. No AI evaluation is used or claimed.
          </p>
        </article>

        <aside className="lg:col-span-1">
          <div className="card sticky top-24 p-6">
            <h2 className="font-semibold text-ink">Ready to get certified?</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex gap-2"><span aria-hidden>⏱</span> {minutes}-minute timed assessment</li>
              <li className="flex gap-2"><span aria-hidden>🎯</span> Pass at {cert.passScorePct}% or higher</li>
              <li className="flex gap-2"><span aria-hidden>📄</span> Instant downloadable certificate</li>
              <li className="flex gap-2"><span aria-hidden>🔗</span> Shareable public verification link</li>
            </ul>
            <Link to={`/assess/${cert.slug}/start`} className="btn-primary mt-6 w-full">
              Start free assessment
            </Link>
            <p className="mt-3 text-center text-xs text-slate-500">
              You will be asked for your name and to accept the assessment rules.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
