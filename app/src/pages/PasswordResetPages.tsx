import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { provider, usingLocalBackend } from '../data';
import { authErrorMessage } from '../data/authError';
import { FieldError, Spinner } from '../components/ui';

/**
 * Password recovery, in two pages.
 *
 * GoTrue offers two routes back from the email, and the message it sends
 * advertises both, so both are supported here:
 *   - the link, which returns to /reset-password with a grant in the URL
 *     fragment;
 *   - a six digit code, for when the link is mangled by a mail client or the
 *     recipient is reading mail on another device.
 */

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await provider.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(authErrorMessage(err, 'We could not start the reset. Please try again.'));
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="container-page flex justify-center py-16">
        <div className="w-full max-w-md card p-8">
          <h1 className="font-display text-2xl font-semibold text-ink">Check your email</h1>
          {/* Deliberately not "if that address is registered": the wording is the
              same either way so the form cannot be used to discover accounts. */}
          <p className="mt-2 text-sm text-slate-600">
            If <span className="font-medium">{email}</span> has an account, a reset link and a six digit
            code are on their way. The link expires in about an hour.
          </p>
          {usingLocalBackend && (
            <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
              Local demo backend: no email is sent. Your code was written to the browser console.
            </p>
          )}
          <Link to="/reset-password" className="btn-primary mt-6 w-full justify-center">
            I have a code
          </Link>
          <p className="mt-4 text-center text-sm">
            <Link to="/login" className="text-brand-700 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md card p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter the email you registered with and we will send you a reset link.
        </p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="label" htmlFor="fp-email">
              Email
            </label>
            <input
              id="fp-email"
              type="email"
              required
              autoComplete="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <FieldError>{error}</FieldError>
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        <p className="mt-5 text-center text-sm">
          <Link to="/login" className="text-brand-700 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export function ResetPassword() {
  const navigate = useNavigate();
  // 'checking' while the URL fragment is inspected; 'code' when the visitor has
  // to identify themselves; 'password' once a recovery session exists.
  const [stage, setStage] = useState<'checking' | 'code' | 'password'>('checking');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;
    provider
      .consumeRecoveryFromUrl()
      .then((ok) => active && setStage(ok ? 'password' : 'code'))
      .catch((err) => {
        if (!active) return;
        // An expired or reused link lands here. Say so, and let them fall back
        // to the code or request another link.
        setError(authErrorMessage(err, 'That reset link is no longer valid. Request a new one.'));
        setStage('code');
      });
    return () => {
      active = false;
    };
  }, []);

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await provider.verifyRecoveryCode(email, code);
      setStage('password');
    } catch (err) {
      setError(authErrorMessage(err, 'That code is not correct or has expired.'));
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Choose a password of at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      await provider.updatePassword(password);
      // Sign out so the new password is actually exercised on the next sign-in,
      // rather than leaving a session created by the recovery grant.
      await provider.logout().catch(() => undefined);
      setDone(true);
    } catch (err) {
      setError(authErrorMessage(err, 'We could not set that password. Request a new reset link.'));
    } finally {
      setBusy(false);
    }
  }

  if (stage === 'checking') {
    return (
      <div className="container-page py-20">
        <Spinner label="Checking your reset link…" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="container-page flex justify-center py-16">
        <div className="w-full max-w-md card p-8 text-center">
          <h1 className="font-display text-2xl font-semibold text-ink">Password updated</h1>
          <p className="mt-2 text-sm text-slate-600">You can now sign in with your new password.</p>
          <button type="button" className="btn-primary mt-6 w-full justify-center" onClick={() => navigate('/login')}>
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-md card p-8">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {stage === 'code' ? 'Enter your reset code' : 'Choose a new password'}
        </h1>

        {stage === 'code' ? (
          <>
            <p className="mt-1 text-sm text-slate-600">
              Enter the email you registered with and the six digit code from the message.
            </p>
            <form onSubmit={submitCode} className="mt-6 space-y-4" noValidate>
              <div>
                <label className="label" htmlFor="rp-email">
                  Email
                </label>
                <input
                  id="rp-email"
                  type="email"
                  required
                  autoComplete="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="rp-code">
                  Six digit code
                </label>
                <input
                  id="rp-code"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  className="input tracking-[0.4em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <FieldError>{error}</FieldError>
              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? 'Checking…' : 'Continue'}
              </button>
            </form>
            <p className="mt-5 text-center text-sm">
              <Link to="/forgot-password" className="text-brand-700 hover:underline">
                Send me a new code
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="mt-1 text-sm text-slate-600">At least 8 characters.</p>
            <form onSubmit={submitPassword} className="mt-6 space-y-4" noValidate>
              <div>
                <label className="label" htmlFor="rp-password">
                  New password
                </label>
                <input
                  id="rp-password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <label className="label" htmlFor="rp-confirm">
                  Confirm new password
                </label>
                <input
                  id="rp-confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="input"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
              <FieldError>{error}</FieldError>
              <button type="submit" className="btn-primary w-full" disabled={busy}>
                {busy ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
