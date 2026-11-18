import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { Profile } from '../../types';

/**
 * Layout wraps every route, so anything it throws while rendering unmounts the
 * whole app and the candidate gets a blank page with no explanation. That is
 * exactly what happened: the header greeted the user with
 * `user.fullName.split(' ')` while the Supabase adapter was handing it an
 * unmapped profiles row with no fullName — so no signed-in page,
 * /assess/:slug/start included, rendered at all.
 *
 * This asserts the header survives a malformed profile. It guards the blast
 * radius; mapping the profile correctly is pinned in profileMapping.test.ts.
 */

const auth = vi.hoisted(() => ({ user: null as Profile | null }));

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: auth.user,
    loading: false,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const { Layout } = await import('../Layout');
const { LanguageProvider } = await import('../../context/LanguageContext');

function renderStartPage(user: Profile | null) {
  auth.user = user;
  return render(
    <MemoryRouter initialEntries={['/assess/panchkarma-therapy/start']}>
      <LanguageProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="assess/:slug/start" element={<p>assessment start page</p>} />
          </Route>
        </Routes>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

const complete: Profile = {
  id: 'u1',
  fullName: 'Asha Menon',
  email: 'asha@example.com',
  role: 'candidate',
  createdAt: '2026-11-01T00:00:00Z',
};

describe('Layout header', () => {
  it('renders the start page for a signed-out visitor', () => {
    renderStartPage(null);
    expect(screen.getByText('assessment start page')).toBeInTheDocument();
  });

  it('renders the start page for a signed-in candidate', () => {
    renderStartPage(complete);
    expect(screen.getByText('assessment start page')).toBeInTheDocument();
    expect(screen.getByText(/Asha/)).toBeInTheDocument();
  });

  it('still renders the page when the profile has no name', () => {
    // The regression: an undefined fullName must cost the greeting, not the page.
    renderStartPage({ ...complete, fullName: undefined as unknown as string });
    expect(screen.getByText('assessment start page')).toBeInTheDocument();
  });
});
