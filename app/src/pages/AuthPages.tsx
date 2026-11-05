import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FieldError } from '../components/ui';
import type { ReactNode } from 'react';

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
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={params.get('next') ?? '/dashboard'} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      navigate(params.get('next') ?? '/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
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
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-600">
          <p className="font-semibold text-slate-700">Local demo accounts</p>
          <p className="mt-1">Admin — admin@aarogya.in / Admin@12345</p>
          <p>Candidate — register any email above.</p>
        </div>
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
      setError(err instanceof Error ? err.message : 'Unable to create account.');
    } finally {
      setBusy(false);
    }
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
