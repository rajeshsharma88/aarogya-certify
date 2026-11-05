import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { provider } from '../data';
import { useAsync } from '../hooks/useAsync';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

export function AssessmentStart() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, loading } = useAsync(async () => {
    const cert = await provider.getCertificationBySlug(slug);
    if (!cert) return null;
    const domains = await provider.listDomains();
    return { cert, domain: domains.find((d) => d.id === cert.domainId) };
  }, [slug]);

  const [name, setName] = useState(user?.fullName ?? '');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (loading) return <Spinner label="Preparing assessment…" />;
  if (!data) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Certification not found</h1>
        <Link to="/certifications" className="btn-primary mt-6">Back to directory</Link>
      </div>
    );
  }

  const { cert, domain } = data;

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (name.trim().length < 2) {
      setError('Please enter the full name to print on your certificate.');
      return;
    }
    if (!accepted) {
      setError('Please accept the assessment rules to continue.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const attempt = await provider.startAttempt(user.id, cert.id, name.trim());
      navigate(`/assess/${attempt.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the assessment.');
      setBusy(false);
    }
  }

  return (
    <div className="container-page py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link to="/certifications" className="hover:text-brand-700">Certifications</Link> /{' '}
        <Link to={`/certifications/${cert.slug}`} className="hover:text-brand-700">{cert.title}</Link> /{' '}
        <span className="text-slate-700">Start</span>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <h1 className="font-display text-3xl font-semibold text-ink">Before you begin</h1>
          <p className="mt-2 text-slate-600">
            {domain?.icon} {cert.title} · {Math.round(cert.durationSec / 60)} minutes · {cert.questionCount} questions ·
            pass at {cert.passScorePct}%
          </p>

          <form onSubmit={start} className="card mt-6 p-6">
            <h2 className="text-lg font-semibold text-ink">Your details</h2>
            <p className="mt-1 text-sm text-slate-600">This name will appear exactly as typed on your certificate.</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="candidate-name">Full name</label>
                <input id="candidate-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div>
                <label className="label" htmlFor="candidate-email">Email</label>
                <input id="candidate-email" className="input bg-slate-50" value={user?.email ?? ''} readOnly />
              </div>
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold text-ink">Assessment rules</legend>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                <li>• The timer starts as soon as you begin and cannot be paused.</li>
                <li>• Questions are objective (single- or multi-select). Your score is calculated automatically.</li>
                <li>• You may navigate between questions and change answers before submitting.</li>
                <li>• The assessment is submitted automatically when the timer reaches zero.</li>
                <li>• Answers are stored against your account; duplicate submissions are prevented.</li>
              </ul>
              <label className="mt-4 flex items-start gap-2.5 text-sm text-slate-700">
                <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-700 focus:ring-brand-500" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
                <span>I understand and accept the assessment rules, and I confirm the details above are correct.</span>
              </label>
            </fieldset>

            {error && <p className="mt-4 text-sm text-red-600" role="alert">{error}</p>}

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="submit" className="btn-primary" disabled={busy}>
                {busy ? 'Starting…' : 'Begin assessment'}
              </button>
              <Link to={`/certifications/${cert.slug}`} className="btn-outline">Cancel</Link>
            </div>
          </form>
        </div>

        <aside className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="font-semibold text-ink">What happens next</h2>
            <ol className="mt-4 space-y-4 text-sm text-slate-600">
              {[
                ['Timed questions', `${cert.questionCount} randomized questions in ${Math.round(cert.durationSec / 60)} minutes.`],
                ['Automatic scoring', 'Your answers are scored server-side against the answer key.'],
                ['Skill analysis', 'See a topic-by-topic breakdown with strengths and improvement areas.'],
                ['Certificate', `Pass at ${cert.passScorePct}% to receive a verifiable certificate with QR code.`],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
                  <span><strong className="block text-ink">{t}</strong>{b}</span>
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
