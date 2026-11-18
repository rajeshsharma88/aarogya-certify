import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

/**
 * Last line of defence against a blank page.
 *
 * A render error anywhere under here unmounts the whole React tree, and the
 * result is a white screen with nothing to report — which is how a one-line
 * fault in the header became "the site does not work". A candidate who hits
 * one should at least see that something broke, be able to get back to a
 * working page, and have something to quote to support.
 *
 * It deliberately does not try to recover state: reloading is the only honest
 * remedy once a render has thrown.
 */
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Kept in the console so a support request can quote something specific.
    console.error('[Aarogya] render failed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="container-page py-20 text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">This page could not be displayed</h1>
        <p className="mx-auto mt-3 max-w-prose text-slate-600">
          The error has been logged. Reloading usually clears it. If it keeps happening, tell us what
          you were doing and we will fix it.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>
            Reload the page
          </button>
          <a href="/" className="btn-outline">
            Back to home
          </a>
        </div>
        <p className="mt-6 text-xs text-slate-400">{error.message}</p>
      </div>
    );
  }
}
