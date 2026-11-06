import { describe, expect, it, vi } from 'vitest';
import { LocalProvider } from '../local/LocalProvider';

async function newProvider() {
  localStorage.clear();
  const p = new LocalProvider();
  await new Promise((r) => setTimeout(r, 0));
  return p;
}

type ConsoleSpy = { mock: { calls: unknown[][] } };

/** The console line is how the local backend "delivers" the code. */
function captureCode(spy: ConsoleSpy): string {
  const line = spy.mock.calls.map((c: unknown[]) => String(c[0])).find((s: string) => s.includes('recovery code'));
  const code = line?.match(/:\s*(\d{6})\s*$/)?.[1];
  if (!code) throw new Error('no recovery code was emitted');
  return code;
}

async function withUser() {
  const p = await newProvider();
  await p.register('Test Candidate', 'candidate@example.test', 'original-password');
  await p.logout();
  return p;
}

describe('password recovery', () => {
  it('lets a user set a new password with the emailed code', async () => {
    const p = await withUser();
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await p.requestPasswordReset('candidate@example.test');
    const code = captureCode(spy);
    spy.mockRestore();

    await p.verifyRecoveryCode('candidate@example.test', code);
    await p.updatePassword('a-brand-new-password');

    await expect(p.login('candidate@example.test', 'original-password')).rejects.toThrow();
    const profile = await p.login('candidate@example.test', 'a-brand-new-password');
    expect(profile.email).toBe('candidate@example.test');
  });

  it('does not reveal whether an address is registered', async () => {
    const p = await withUser();
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    // Resolves exactly like the registered case, and emits no code.
    await expect(p.requestPasswordReset('nobody@example.test')).resolves.toBeUndefined();
    expect(spy.mock.calls.map((c: unknown[]) => String(c[0])).some((s: string) => s.includes('recovery code'))).toBe(false);
    spy.mockRestore();
  });

  it('rejects a wrong code and leaves the old password working', async () => {
    const p = await withUser();
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await p.requestPasswordReset('candidate@example.test');
    const code = captureCode(spy);
    spy.mockRestore();

    const wrong = code === '000000' ? '111111' : '000000';
    await expect(p.verifyRecoveryCode('candidate@example.test', wrong)).rejects.toThrow();
    await expect(p.updatePassword('attacker-password')).rejects.toThrow();
    const profile = await p.login('candidate@example.test', 'original-password');
    expect(profile.email).toBe('candidate@example.test');
  });

  it('rejects an expired code', async () => {
    const p = await withUser();
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await p.requestPasswordReset('candidate@example.test');
    const code = captureCode(spy);
    spy.mockRestore();

    // Wind the stored expiry into the past rather than waiting 15 minutes.
    const stored = JSON.parse(localStorage.getItem('ac:recovery') as string);
    localStorage.setItem('ac:recovery', JSON.stringify({ ...stored, expiresAt: Date.now() - 1 }));

    await expect(p.verifyRecoveryCode('candidate@example.test', code)).rejects.toThrow(/expired/i);
  });

  it('will not reuse a code for a different account', async () => {
    const p = await withUser();
    await p.register('Someone Else', 'other@example.test', 'other-password');
    await p.logout();
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await p.requestPasswordReset('candidate@example.test');
    const code = captureCode(spy);
    spy.mockRestore();

    await expect(p.verifyRecoveryCode('other@example.test', code)).rejects.toThrow();
  });

  it('enforces a minimum password length', async () => {
    const p = await withUser();
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    await p.requestPasswordReset('candidate@example.test');
    const code = captureCode(spy);
    spy.mockRestore();

    await p.verifyRecoveryCode('candidate@example.test', code);
    await expect(p.updatePassword('short')).rejects.toThrow(/8 characters/);
  });
});
