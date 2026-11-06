/**
 * Turning GoTrue failures into something a candidate can act on.
 *
 * The auth endpoint used to fail with `throw new Error('Auth 400: ' + body)`, so
 * the sign-in form rendered raw JSON at people:
 *
 *   Auth 400: {"code":400,"error_code":"email_not_confirmed","msg":"Email not confirmed"}
 *
 * The status code and the server's own wording are kept on the error for the
 * console, but never shown — the UI reads `code` and picks its own sentence.
 */

import { SUPPORT_EMAIL } from '../brand/contact';

export type AuthErrorCode =
  /** The account exists but the address was never confirmed, so it cannot sign in. */
  | 'email_not_confirmed'
  /** Signup succeeded without a session: this instance requires confirmation first. */
  | 'email_confirmation_required'
  | 'invalid_credentials'
  | 'email_exists'
  | 'weak_password'
  | 'invalid_email'
  | 'signup_disabled'
  | 'rate_limited'
  /** The request never reached the server (offline, DNS, CORS, gateway down). */
  | 'network'
  | 'unknown';

export class AuthError extends Error {
  readonly code: AuthErrorCode;
  readonly status: number;
  /** The server's raw body. For logs and bug reports — not for the screen. */
  readonly detail: string;

  constructor(code: AuthErrorCode, status: number, detail = '') {
    super(AUTH_MESSAGES[code]);
    this.name = 'AuthError';
    this.code = code;
    this.status = status;
    this.detail = detail;
  }
}

const AUTH_MESSAGES: Record<AuthErrorCode, string> = {
  email_not_confirmed:
    'Your account exists, but the email address has not been confirmed yet. Open the confirmation link we sent you, then sign in again.',
  email_confirmation_required:
    'Account created. Check your inbox for a confirmation link — you can sign in once the address is confirmed.',
  invalid_credentials: 'That email and password do not match an account. Check both and try again.',
  email_exists: 'An account with this email already exists. Sign in instead, or reset the password.',
  weak_password: 'Choose a longer password — at least 8 characters.',
  invalid_email: 'That email address does not look valid. Check it and try again.',
  signup_disabled: `New registrations are closed at the moment. Write to ${SUPPORT_EMAIL} if you need an account.`,
  rate_limited: 'Too many attempts. Wait a minute and try again.',
  network: 'We could not reach the server. Check your connection and try again.',
  unknown: 'Something went wrong on our side. Please try again in a moment.',
};

/**
 * GoTrue's body shape has changed across versions and differs between the
 * `/signup`, `/token` and generic error paths, so every form is checked:
 *   { code, error_code, msg }            — current
 *   { error, error_description }         — OAuth-style, used by /token
 *   { msg } | { message } | { error }    — older / proxy errors
 */
export function parseAuthError(status: number, body: string): AuthError {
  let slug = '';
  let text = body;

  try {
    const json = JSON.parse(body) as Record<string, unknown>;
    slug = String(json.error_code ?? json.error ?? '').toLowerCase();
    text = String(json.msg ?? json.error_description ?? json.message ?? json.error ?? body);
  } catch {
    /* not JSON — fall back to matching the plain text below */
  }

  const haystack = `${slug} ${text}`.toLowerCase();
  const has = (...needles: string[]) => needles.some((n) => haystack.includes(n));

  // Rate limiting is checked first: it is reported with a variety of slugs but
  // 429 is unambiguous, and its advice ("wait") differs from everything else.
  if (status === 429 || has('rate limit', 'over_request_rate', 'over_email_send_rate')) {
    return new AuthError('rate_limited', status, body);
  }
  if (has('email_not_confirmed', 'email not confirmed')) {
    return new AuthError('email_not_confirmed', status, body);
  }
  if (has('invalid_credentials', 'invalid_grant', 'invalid login credentials')) {
    return new AuthError('invalid_credentials', status, body);
  }
  if (has('user_already_exists', 'email_exists', 'already registered', 'already been registered')) {
    return new AuthError('email_exists', status, body);
  }
  if (has('weak_password', 'password should be at least', 'password is too short')) {
    return new AuthError('weak_password', status, body);
  }
  if (has('email_address_invalid', 'validation_failed', 'unable to validate email')) {
    return new AuthError('invalid_email', status, body);
  }
  if (has('signup_disabled', 'signups not allowed', 'signup is disabled')) {
    return new AuthError('signup_disabled', status, body);
  }
  return new AuthError('unknown', status, body);
}

/**
 * The sentence to show for any thrown value. LocalProvider throws plain Errors
 * that are already written for people ("Invalid email or password."), so those
 * pass through; anything unrecognised is replaced rather than leaked, since an
 * unexpected message is as likely to be a stack trace as a sentence.
 */
export function authErrorMessage(err: unknown, fallback = AUTH_MESSAGES.unknown): string {
  if (err instanceof AuthError) return err.message;
  if (err instanceof Error && err.message && !looksTechnical(err.message)) return err.message;
  return fallback;
}

function looksTechnical(message: string): boolean {
  return /^(auth|supabase)\s\d{3}|[{[]|https?:\/\/|\bfetch\b|undefined|null\b/i.test(message);
}
