import { describe, expect, it } from 'vitest';
import { mapProfile, nameFromEmail } from '../supabase/SupabaseProvider';

/**
 * These exist because the un-mapped version of this shipped.
 *
 * profiles rows are snake_case and have no email column, so handing the raw
 * row back as a Profile left `fullName` undefined. The header renders
 * `user.fullName.split(' ')`, Layout wraps every route, and there was no error
 * boundary — so every signed-in candidate got a blank page and could not reach
 * /assess/:slug/start at all.
 *
 * The invariant worth holding: whatever the row looks like, a Profile comes
 * back with a usable string in every field the pages read.
 */

describe('mapProfile', () => {
  const row = {
    id: '11111111-1111-1111-1111-111111111111',
    full_name: 'Asha Menon',
    role: 'candidate',
    created_at: '2026-11-01T00:00:00Z',
  };

  it('maps snake_case to the Profile shape', () => {
    expect(mapProfile(row, 'asha@example.com')).toEqual({
      id: row.id,
      fullName: 'Asha Menon',
      email: 'asha@example.com',
      role: 'candidate',
      createdAt: '2026-11-01T00:00:00Z',
    });
  });

  it('never returns an undefined fullName, whatever the row holds', () => {
    // The exact failure that blanked the app: .split() on undefined.
    for (const value of [undefined, null, '', '   ']) {
      const p = mapProfile({ ...row, full_name: value }, 'asha@example.com');
      expect(typeof p.fullName).toBe('string');
      expect(p.fullName.length).toBeGreaterThan(0);
      expect(() => p.fullName.split(' ')[0]).not.toThrow();
    }
  });

  it('shows a name instead of the address for rows that stored the email', () => {
    // The earlier fallback insert wrote the email into full_name.
    const p = mapProfile({ ...row, full_name: 'asha.menon@example.com' });
    expect(p.fullName).toBe('Asha Menon');
    expect(p.fullName).not.toContain('@');
  });

  it('takes the email from auth.users, since profiles has no such column', () => {
    expect(mapProfile(row, 'asha@example.com').email).toBe('asha@example.com');
    expect(mapProfile(row).email).toBe('');
  });

  it('only recognises the two real roles, defaulting to candidate', () => {
    // A junk or absent role must never read as admin.
    expect(mapProfile({ ...row, role: 'admin' }).role).toBe('admin');
    expect(mapProfile({ ...row, role: 'superuser' }).role).toBe('candidate');
    expect(mapProfile({ ...row, role: undefined }).role).toBe('candidate');
  });
});

describe('nameFromEmail', () => {
  it('reads a name out of the local part', () => {
    expect(nameFromEmail('asha.menon@example.com')).toBe('Asha Menon');
    expect(nameFromEmail('ravi_kumar@example.com')).toBe('Ravi Kumar');
    expect(nameFromEmail('imrajesh8800@gmail.com')).toBe('Imrajesh');
  });

  it('falls back to Learner rather than an empty string', () => {
    expect(nameFromEmail('')).toBe('Learner');
    expect(nameFromEmail('12345@example.com')).toBe('Learner');
  });
});
