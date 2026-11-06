import { describe, expect, it } from 'vitest';
import { AuthError, authErrorMessage, parseAuthError } from '../authError';

describe('parseAuthError', () => {
  it('reads the current GoTrue shape', () => {
    // The exact body that used to reach users as "Auth 400: {...}".
    const err = parseAuthError(400, '{"code":400,"error_code":"email_not_confirmed","msg":"Email not confirmed"}');
    expect(err.code).toBe('email_not_confirmed');
    expect(err.message).not.toContain('{');
    expect(err.message).not.toContain('400');
  });

  it('reads the OAuth-style shape used by the token endpoint', () => {
    const err = parseAuthError(400, '{"error":"invalid_grant","error_description":"Invalid login credentials"}');
    expect(err.code).toBe('invalid_credentials');
  });

  it('matches on the message when no slug is present', () => {
    expect(parseAuthError(400, '{"msg":"Email not confirmed"}').code).toBe('email_not_confirmed');
    expect(parseAuthError(422, '{"msg":"User already registered"}').code).toBe('email_exists');
  });

  it('treats any 429 as rate limiting, whatever the body says', () => {
    expect(parseAuthError(429, '').code).toBe('rate_limited');
    // Rate limiting must win over the slug: the advice is to wait, not to retype.
    expect(parseAuthError(429, '{"error_code":"invalid_credentials"}').code).toBe('rate_limited');
  });

  it('survives a non-JSON body', () => {
    const err = parseAuthError(502, '<html>502 Bad Gateway</html>');
    expect(err.code).toBe('unknown');
    expect(err.detail).toContain('502');
  });

  it('keeps the raw body for logs but out of the message', () => {
    const raw = '{"code":400,"error_code":"weak_password","msg":"Password should be at least 8 characters"}';
    const err = parseAuthError(400, raw);
    expect(err.code).toBe('weak_password');
    expect(err.detail).toBe(raw);
    expect(err.message).toBe(new AuthError('weak_password', 400).message);
  });
});

describe('authErrorMessage', () => {
  it('passes through LocalProvider messages, which are already written for people', () => {
    expect(authErrorMessage(new Error('Invalid email or password.'))).toBe('Invalid email or password.');
    expect(authErrorMessage(new Error('An account with this email already exists.'))).toBe(
      'An account with this email already exists.',
    );
  });

  it('replaces technical messages rather than showing them', () => {
    for (const raw of [
      'Auth 400: {"msg":"boom"}',
      'Supabase 500: internal',
      'Failed to fetch',
      "Cannot read properties of undefined (reading 'id')",
      'request to https://db.example.com failed',
    ]) {
      expect(authErrorMessage(new Error(raw))).not.toContain(raw);
    }
  });

  it('uses the supplied fallback for non-Errors', () => {
    expect(authErrorMessage('nope', 'Unable to sign in.')).toBe('Unable to sign in.');
    expect(authErrorMessage(undefined, 'Unable to sign in.')).toBe('Unable to sign in.');
  });
});
