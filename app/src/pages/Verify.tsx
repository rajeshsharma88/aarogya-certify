import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { VerificationView } from '../types';
import { provider } from '../data';
import { StatusBadge } from '../components/ui';

export function Verify() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [input, setInput] = useState(certificateId ?? '');
  const [result, setResult] = useState<VerificationView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!certificateId) {
      setResult(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    provider
      .verifyCertificate(certificateId)
      .then((r) => active && setResult(r))
      .catch((e: unknown) => active && setError(e instanceof Error ? e.message : 'Verification failed.'))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [certificateId]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    navigate(`/verify/${encodeURIComponent(value.toUpperCase())}`);
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <p className="eyebrow">Certificate verification</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink sm:text-4xl">Verify a certificate</h1>
          <p className="mt-2 text-slate-600">
            Enter a certificate ID to confirm its authenticity. Verification is public and never requires a login.
          </p>
        </div>

        <form onSubmit={onSubmit} className="card mt-8 flex flex-col gap-3 p-6 sm:flex-row" role="search">
          <div className="flex-1">
            <label htmlFor="cert-id" className="label">Certificate ID</label>
            <input
              id="cert-id"
              className="input font-mono uppercase tracking-wide"
              placeholder="AIC-XXXX-XXXX-XXXX"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <button type="submit" className="btn-primary sm:mt-7" disabled={loading || !input.trim()}>
            {loading ? 'Checking…' : 'Verify certificate'}
          </button>
        </form>

        {error && (
          <div className="mt-6 rounded-lg bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200" role="alert">
            {error}
          </div>
        )}

        {result && (
          <section className="mt-8" aria-live="polite">
            {result.found ? (
              <div className="card overflow-hidden">
                <div className={`flex items-center justify-between px-6 py-4 ${result.status === 'valid' ? 'bg-emerald-50' : result.status === 'revoked' ? 'bg-red-50' : 'bg-saffron-50'}`}>
                  <h2 className="font-display text-lg font-semibold text-ink">
                    {result.status === 'valid' ? 'Certificate verified' : result.status === 'revoked' ? 'Certificate revoked' : 'Certificate expired'}
                  </h2>
                  <StatusBadge status={result.status!} />
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-600">{result.message}</p>
                  <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                    {[
                      ['Certificate holder', result.holderName],
                      ['Certification', result.title],
                      ['Issuing organization', result.org],
                      ['Certificate number', result.certificateNo],
                      ['Issue date', result.issueDate ? new Date(result.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'],
                      ['Score', result.scorePct != null ? `${result.scorePct}%` : '—'],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{k}</dt>
                        <dd className="mt-0.5 text-sm font-medium text-ink">{v ?? '—'}</dd>
                      </div>
                    ))}
                  </dl>
                  {result.expiryDate && (
                    <p className="mt-4 text-sm text-slate-600">
                      Expiry date:{' '}
                      {new Date(result.expiryDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500" aria-hidden>?</span>
                  <h2 className="font-display text-lg font-semibold text-ink">No matching certificate</h2>
                </div>
                <p className="mt-3 text-sm text-slate-600">{result.message}</p>
                <p className="mt-2 text-sm text-slate-600">
                  Check for typos, confirm the ID with the certificate holder, or contact the issuing organization.
                </p>
              </div>
            )}
          </section>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/certifications" className="btn-outline">Browse certifications</Link>
          <Link to="/" className="btn-ghost">Back to home</Link>
        </div>

        <p className="mt-10 text-center text-xs text-slate-500">
          Tip: scanning the QR code on a certificate opens this page with the ID already filled in.
        </p>
      </div>
    </div>
  );
}
