import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogoWordmark } from '../brand/Logo';
import { useAuth } from '../context/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { usingLocalBackend } from '../data';

const navLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
  }`;

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    setMenuOpen(false);
    navigate('/');
  }

  return (
    <div className="flex min-h-screen flex-col">
      {usingLocalBackend && (
        <div className="bg-saffron-100 text-center text-xs font-medium text-saffron-700">
          Local demo backend — data is stored in your browser. Configure Supabase to use the hosted database.
        </div>
      )}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4">
          <Link to="/" className="shrink-0" onClick={() => setMenuOpen(false)}>
            <LogoWordmark />
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            <NavLink to="/certifications" className={navLink}>
              Certifications
            </NavLink>
            <NavLink to="/verify" className={navLink}>
              Verify a certificate
            </NavLink>
            {user && (
              <NavLink to="/dashboard" className={navLink}>
                Dashboard
              </NavLink>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={navLink}>
                Admin
              </NavLink>
            )}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageSwitcher variant="button" compact />
            {user ? (
              <>
                <span className="text-sm text-slate-600">Hi, {user.fullName.split(' ')[0]}</span>
                <button type="button" className="btn-outline" onClick={handleLogout}>
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost">
                  Sign in
                </Link>
                <Link to="/certifications" className="btn-primary">
                  Get certified
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden">
            <div className="container-page flex flex-col gap-1 py-3">
              <Link to="/certifications" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>
                Certifications
              </Link>
              <Link to="/verify" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>
                Verify a certificate
              </Link>
              {user && (
                <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>
                  Dashboard
                </Link>
              )}
              {user?.role === 'admin' && (
                <Link to="/admin" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700" onClick={() => setMenuOpen(false)}>
                  Admin
                </Link>
              )}
              <div className="mt-2 flex flex-col gap-2 border-t border-slate-200 pt-3">
                <div className="px-2">
                  <LanguageSwitcher variant="pills" compact />
                </div>
                {user ? (
                  <button type="button" className="btn-outline" onClick={handleLogout}>
                    Sign out
                  </button>
                ) : (
                  <>
                    <Link to="/login" className="btn-outline text-center" onClick={() => setMenuOpen(false)}>
                      Sign in
                    </Link>
                    <Link to="/register" className="btn-primary text-center" onClick={() => setMenuOpen(false)}>
                      Create account
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 border-t border-slate-200 bg-white">
        <div className="container-page grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <LogoWordmark />
            <p className="mt-3 max-w-xs text-sm text-slate-600">
              Free, objective skill assessments with verifiable digital certificates for learners across India.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Platform</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li><Link className="hover:text-brand-700" to="/certifications">Certification directory</Link></li>
              <li><Link className="hover:text-brand-700" to="/verify">Verify a certificate</Link></li>
              <li><Link className="hover:text-brand-700" to="/dashboard">My dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">How it works</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Choose a skill</li>
              <li>Take the timed assessment</li>
              <li>Earn a verifiable certificate</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Trust</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Scoring computed server-side</li>
              <li>Unique, non-guessable certificate IDs</li>
              <li>Public verification, no login needed</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-200 py-5">
          <p className="container-page text-xs text-slate-500">
            © {new Date().getFullYear()} Aarogya India. Certificates are issued for skill demonstration and are not a
            government or university qualification.
          </p>
        </div>
      </footer>
    </div>
  );
}
