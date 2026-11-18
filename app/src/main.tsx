import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { provider } from './data';
import { ErrorBoundary } from './components/ErrorBoundary';
import { hasMissingLegalDetails, missingLegalFields } from './brand/legal';

// Dev-only test hook (used by scripts/e2e.mjs). Never exposed in production builds.
if (import.meta.env.DEV) {
  (window as unknown as { __AC__: unknown }).__AC__ = provider;
}

// Unfilled legal details are visible on the policy pages themselves, but an
// operator deploying a build is unlikely to read every page. Say it once, loudly,
// where a deploy check would see it: Razorpay and Meta both reject these pages
// when the business details are blank.
if (hasMissingLegalDetails()) {
  console.warn(
    `[Aarogya] Legal pages are incomplete — Razorpay and Meta review will fail. ` +
      `Fill these in src/brand/legal.ts: ${missingLegalFields().join(', ')}`,
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
);
