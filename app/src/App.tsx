import { Link, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Directory } from './pages/Directory';
import { CertificationDetail } from './pages/CertificationDetail';
import { PanchkarmaLanding } from './pages/PanchkarmaLanding';
import { AssessmentStart } from './pages/AssessmentStart';
import { Assessment } from './pages/Assessment';
import { Results } from './pages/Results';
import { CertificatePage } from './pages/CertificatePage';
import { Verify } from './pages/Verify';
import { Dashboard } from './pages/Dashboard';
import { Admin } from './pages/Admin';
import { Login, Register, RequireAdmin, RequireAuth } from './pages/AuthPages';
import { ForgotPassword, ResetPassword } from './pages/PasswordResetPages';

function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-slate-600">The page you are looking for does not exist.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link to="/" className="btn-primary">Back to home</Link>
        <Link to="/certifications" className="btn-outline">Browse certifications</Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="certifications" element={<Directory />} />
        <Route path="certifications/:slug" element={<CertificationDetail />} />

        {/* Sales landing page. Declared before the catch-all so the marketing
            slug stays independent of the catalog route above. */}
        <Route path="panchkarma-therapy" element={<PanchkarmaLanding />} />

        <Route
          path="assess/:slug/start"
          element={
            <RequireAuth>
              <AssessmentStart />
            </RequireAuth>
          }
        />
        <Route
          path="assess/:attemptId"
          element={
            <RequireAuth>
              <Assessment />
            </RequireAuth>
          }
        />
        <Route
          path="assess/:attemptId/result"
          element={
            <RequireAuth>
              <Results />
            </RequireAuth>
          }
        />

        <Route
          path="certificates/:certificateNo"
          element={
            <RequireAuth>
              <CertificatePage />
            </RequireAuth>
          }
        />

        <Route path="verify" element={<Verify />} />
        <Route path="verify/:certificateId" element={<Verify />} />

        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />

        <Route
          path="dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
