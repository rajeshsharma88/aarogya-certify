import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LEGAL, isMissing } from '../../brand/legal';

/**
 * Shared shell and primitives for the policy pages.
 *
 * `Fact` is the important one: it prints a business detail, or a visible
 * marker when that detail has not been supplied. Reviewers at Razorpay and
 * Meta read these pages against the registered business, so a blank that
 * announces itself is far safer than a plausible invention — and it stops an
 * unfinished policy going live unnoticed.
 */

export function Fact({ value, label }: { value: string; label: string }) {
  if (isMissing(value)) {
    return (
      <mark className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-900">
        [{label} — add this in src/brand/legal.ts]
      </mark>
    );
  }
  return <span>{value}</span>;
}

export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
          <Link to="/" className="hover:text-brand-700">
            Home
          </Link>{' '}
          / <span className="text-slate-700">{title}</span>
        </nav>

        <h1 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: {LEGAL.lastUpdated}</p>
        {intro && <p className="mt-4 text-slate-600">{intro}</p>}

        <div className="legal-body mt-8 space-y-6 text-slate-700">{children}</div>

        <div className="mt-12 border-t border-slate-200 pt-6 text-sm text-slate-600">
          <p>
            Questions about this policy? Write to{' '}
            <a className="font-medium text-brand-700 hover:underline" href={`mailto:${LEGAL.supportEmail}`}>
              {LEGAL.supportEmail}
            </a>
            .
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
            <li><Link className="hover:text-brand-700" to="/terms">Terms of Service</Link></li>
            <li><Link className="hover:text-brand-700" to="/privacy">Privacy Policy</Link></li>
            <li><Link className="hover:text-brand-700" to="/refund-policy">Refunds &amp; Cancellation</Link></li>
            <li><Link className="hover:text-brand-700" to="/delivery-policy">Delivery</Link></li>
            <li><Link className="hover:text-brand-700" to="/pricing">Pricing</Link></li>
            <li><Link className="hover:text-brand-700" to="/contact">Contact</Link></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-semibold text-ink">{heading}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** The registered business block, repeated on several policies. */
export function BusinessDetails() {
  return (
    <dl className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm">
      <div className="flex flex-wrap gap-x-2">
        <dt className="font-semibold text-ink">Legal entity:</dt>
        <dd><Fact value={LEGAL.legalEntityName} label="registered entity name" /></dd>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-2">
        <dt className="font-semibold text-ink">Entity type:</dt>
        <dd><Fact value={LEGAL.entityType} label="entity type" /></dd>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-2">
        <dt className="font-semibold text-ink">Trading as:</dt>
        <dd>{LEGAL.brandName}</dd>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-2">
        <dt className="font-semibold text-ink">Registered address:</dt>
        <dd><Fact value={LEGAL.registeredAddress} label="registered address" /></dd>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-2">
        <dt className="font-semibold text-ink">GSTIN:</dt>
        <dd><Fact value={LEGAL.gstin} label="GSTIN, or remove this row if unregistered" /></dd>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-2">
        <dt className="font-semibold text-ink">Email:</dt>
        <dd>
          <a className="text-brand-700 hover:underline" href={`mailto:${LEGAL.supportEmail}`}>
            {LEGAL.supportEmail}
          </a>
        </dd>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-2">
        <dt className="font-semibold text-ink">Phone:</dt>
        <dd><Fact value={LEGAL.phone} label="contact phone number" /></dd>
      </div>
    </dl>
  );
}
