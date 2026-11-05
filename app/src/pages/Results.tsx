import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Certificate, Certification, Result } from '../types';
import { provider } from '../data';
import { useAuth } from '../context/AuthContext';
import { Spinner, StatusBadge } from '../components/ui';

export function Results() {
  const { attemptId = '' } = useParams();
  const { user } = useAuth();
  const [result, setResult] = useState<Result | null>(null);
  const [cert, setCert] = useState<Certificate | null>(null);
  const [certification, setCertification] = useState<Certification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const attempt = await provider.getAttempt(attemptId);
      if (!active) return;
      if (!attempt) {
        setError('Assessment attempt not found.');
        setLoading(false);
        return;
      }
      if (user && attempt.userId !== user.id) {
        setError('You do not have access to this result.');
        setLoading(false);
        return;
      }
      if (attempt.status === 'in_progress') {
        setError('This assessment has not been submitted yet.');
        setLoading(false);
        return;
      }
      const r = await provider.getResult(attemptId);
      if (!active) return;
      if (!r) {
        setError('No result is available for this attempt.');
        setLoading(false);
        return;
      }
      setResult(r);
      const c = await provider.getCertificateByAttempt(attemptId);
      if (!active) return;
      setCert(c ?? null);
      const certs = await provider.listCertifications();
      if (!active) return;
      setCertification(certs.find((x) => x.id === attempt.certificationId) ?? null);
      setLoading(false);
    })().catch((e: unknown) => {
      setError(e instanceof Error ? e.message : 'Could not load the result.');
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [attemptId, user]);

  if (loading) return <Spinner label="Calculating your result…" />;
  if (error || !result) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">{error ?? 'Result unavailable'}</h1>
        <Link to="/dashboard" className="btn-primary mt-6">Back to dashboard</Link>
      </div>
    );
  }

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = (result.scorePct / 100) * circumference;

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Assessment complete</p>
        <h1 className="mt-1 font-display text-3xl font-semibold text-ink sm:text-4xl">
          {result.passed ? 'Congratulations — you passed!' : 'Assessment complete'}
        </h1>
        <p className="mt-2 text-slate-600">
          {certification?.title ?? 'Certification'} · {result.correctCount} of {result.totalCount} correct
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="card flex flex-col items-center p-6">
          <svg viewBox="0 0 140 140" className="h-40 w-40" role="img" aria-label={`Score ${result.scorePct} percent`}>
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={result.passed ? '#0d9488' : '#dc2626'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              transform="rotate(-90 70 70)"
            />
            <text x="70" y="66" textAnchor="middle" className="fill-ink" style={{ fontSize: 26, fontWeight: 700 }}>
              {result.scorePct}%
            </text>
            <text x="70" y="88" textAnchor="middle" className="fill-slate-500" style={{ fontSize: 11 }}>
              score
            </text>
          </svg>
          <p className="mt-3 font-display text-xl font-semibold text-ink">{result.level}</p>
          <p className="mt-1 text-sm text-slate-500">
            {result.passed ? 'Certificate eligible' : 'Below the pass mark'}
          </p>
          <div className="mt-4">{result.passed ? <StatusBadge status="valid" /> : <span className="chip bg-red-50 text-red-700 ring-1 ring-red-200">Not passed</span>}</div>
        </div>

        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-ink">Skill breakdown</h2>
          <ul className="mt-4 space-y-4">
            {result.breakdown.map((b) => (
              <li key={b.topic}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-ink">{b.topic}</span>
                  <span className="text-slate-500">
                    {b.correct}/{b.total} · {b.pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${b.pct >= 70 ? 'bg-brand-600' : b.pct >= 40 ? 'bg-saffron-500' : 'bg-red-500'}`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <section className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Strengths</h2>
          {result.strengths.length ? (
            <ul className="mt-3 space-y-2 text-sm text-ink">
              {result.strengths.map((s) => (
                <li key={s} className="flex gap-2"><span className="text-emerald-600" aria-hidden>✓</span>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">No topic reached 70% in this attempt.</p>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Improve next</h2>
          {result.improvements.length ? (
            <ul className="mt-3 space-y-2 text-sm text-ink">
              {result.improvements.map((s) => (
                <li key={s} className="flex gap-2"><span className="text-saffron-600" aria-hidden>→</span>{s}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Excellent — no weak topics detected.</p>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recommendations</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            {result.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {result.passed && cert ? (
          <>
            <Link to={`/certificates/${cert.certificateNo}`} className="btn-primary">
              View my certificate
            </Link>
            <Link to="/dashboard" className="btn-outline">Go to dashboard</Link>
          </>
        ) : (
          <>
            {certification && (
              <Link to={`/assess/${certification.slug}/start`} className="btn-primary">
                Retake assessment
              </Link>
            )}
            <Link to="/certifications" className="btn-outline">Explore other certifications</Link>
          </>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-slate-500">
        Scoring is automated against the stored answer key. This is not an AI evaluation.
      </p>
    </div>
  );
}
