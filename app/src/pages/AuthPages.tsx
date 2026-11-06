import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FieldError } from '../components/ui';
import { usingLocalBackend } from '../data';
import { SUPPORT_EMAIL, supportMailto } from '../brand/contact';
import { AuthError, authErrorMessage } from '../data/authError';
import type { ReactNode } from 'react';

/**
 * A failure the candidate can act on, rather than a red line of JSON.
 * `tone` is 'info' where nothing went wrong — an account awaiting its
 * confirmation email is a successful registration, not an error.
 */
function AuthNotice({ tone, title, children }: { tone: 'error' | 'info'; title: string; children?: ReactNode }) {
  const styles =
    tone === 'info'
      ? 'border-brand-200 bg-brand-50 text-brand-900'
      : 'border-red-200 bg-red-50 text-red-900';
  return (
    <div className={`rounded-lg border p-4 text-sm ${styles}`} role={tone === 'error' ? 'alert' : 'status'}>
      <p className="font-semibold">{title}</p>
      {children ? <div className="mt-1 space-y-1">{children}</div> : null}
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container-page py-20 text-center text-slate-500">Checking session…</div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container-page py-20 text-center text-slate-500">Checking session…</div>;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (user.role !== 'admin') {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Administrator access required</h1>
        <p className="mt-2 text-slate-600">Your account does not have permission to view this area.</p>
        <Link to="/dashboard" className="btn-primary mt-6">Go to my dashboard</Link>
      </div>
    );
  }
  return <>{children}</>;
}

export function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={params.get('next') ?? '/dashboard'} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setUnconfirmed(false);
    setBusy(true);
    try {
      await login(email, password);
      navigate(params.get('next') ?? '/dashboard');
    } catch (err) {
      // An unconfirmed address needs an explanation and a next step, not a
      // one-line field error — the password was correct and retyping it will
      // not help.
      if (err instanceof AuthError && err.code === 'email_not_confirmed') {
        setUnconfirmed(true);
      } else {
        setError(authErrorMessage(err, 'Unable to sign in. Please try again.'));
      }
      if (err instanceof AuthError) console.warn('[Aarogya] sign-in failed:', err.code, err.detail);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="font-display text-2xl font-semibold text-ink">Sign in</h1>
          <p className="mt-1 text-sm text-slate-600">Access your assessments and certificates.</p>
          {unconfirmed && (
            <div className="mt-5">
              <AuthNotice tone="error" title="Confirm your email address first">
                <p>
                  Your account exists, but the address has not been confirmed yet, so it cannot sign
                  in. Open the confirmation link sent to <span className="font-medium">{email}</span>,
                  then come back and sign in.
                </p>
                <p>
                  If no email arrived, check your spam folder, or write to{' '}
                  <a className="font-medium underline" href={supportMailto('Confirm my account')}>
                    {SUPPORT_EMAIL}
                  </a>{' '}
                  and we will confirm it for you.
                </p>
              </AuthNotice>
            </div>
          )}
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" required className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" autoComplete="current-password" required className="input" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <FieldError>{error}</FieldError>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="text-brand-700 hover:underline">
              Forgot your password?
            </Link>
          </p>
          <p className="mt-5 text-center text-sm text-slate-600">
            New here?{' '}
            <Link
              to={params.get('next') ? `/register?next=${encodeURIComponent(params.get('next')!)}` : '/register'}
              className="font-semibold text-brand-700 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
        {/*
          Only ever rendered against the browser-only demo backend. These are
          seeded demo credentials, but printing an admin email and password on a
          public sign-in page invites them to be tried against the real one.
        */}
        {usingLocalBackend && (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">Local demo accounts</p>
            <p className="mt-1">Admin — admin@aarogya.in / Admin@12345</p>
            <p>Candidate — register any email above.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={params.get('next') ?? '/dashboard'} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(fullName, email, password);
      navigate(params.get('next') ?? '/dashboard');
    } catch (err) {
      // The account was created; it just has no session until the address is
      // confirmed. Reporting that as a failure made people register twice.
      if (err instanceof AuthError && err.code === 'email_confirmation_required') {
        setAwaitingConfirmation(true);
      } else {
        setError(authErrorMessage(err, 'Unable to create your account. Please try again.'));
      }
      if (err instanceof AuthError) console.warn('[Aarogya] registration:', err.code, err.detail);
    } finally {
      setBusy(false);
    }
  }

  if (awaitingConfirmation) {
    return (
      <div className="container-page flex justify-center py-16">
        <div className="w-full max-w-md card p-8">
          <AuthNotice tone="info" title="Account created — one step left">
            <p>
              We have sent a confirmation link to <span className="font-medium">{email}</span>. Open it
              to activate your account, then sign in.
            </p>
            <p>There is no need to register again. Check your spam folder if it has not arrived.</p>
          </AuthNotice>
          <Link
            to={params.get('next') ? `/login?next=${encodeURIComponent(params.get('next')!)}` : '/login'}
            className="btn-primary mt-6 w-full justify-center"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-slate-600">Track assessments and keep your certificates in one place.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" required className="input" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="remail">Email</label>
              <input id="remail" type="email" required className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="rpassword">Password</label>
              <input id="rpassword" type="password" required minLength={8} className="input" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
            </div>
            <FieldError>{error}</FieldError>
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-600">
            Already registered?{' '}
            <Link
              to={params.get('next') ? `/login?next=${encodeURIComponent(params.get('next')!)}` : '/login'}
              className="font-semibold text-brand-700 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
