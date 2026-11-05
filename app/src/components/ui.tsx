import type { ReactNode } from 'react';
import type { CertificateStatus } from '../types';

export function Badge({ children, tone = 'brand' }: { children: ReactNode; tone?: 'brand' | 'saffron' | 'green' | 'red' | 'slate' }) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-800 ring-1 ring-brand-200',
    saffron: 'bg-saffron-50 text-saffron-700 ring-1 ring-saffron-200',
    green: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    slate: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: CertificateStatus | 'not_recognized' }) {
  if (status === 'valid') return <Badge tone="green">✓ Valid</Badge>;
  if (status === 'revoked') return <Badge tone="red">Revoked</Badge>;
  if (status === 'expired') return <Badge tone="saffron">Expired</Badge>;
  return <Badge tone="slate">Not recognized</Badge>;
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-700" />
      {label}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">○</div>
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="max-w-md text-sm text-slate-600">{body}</p>
      {action}
    </div>
  );
}

export function ProgressBar({ value, tone = 'brand' }: { value: number; tone?: 'brand' | 'saffron' }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${tone === 'brand' ? 'bg-brand-600' : 'bg-saffron-500'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-1.5 text-sm text-red-600" role="alert">
      {children}
    </p>
  );
}
