import { Link } from 'react-router-dom';
import type { Certification, Domain } from '../types';
import { Badge } from './ui';

export function CertificationCard({ cert, domain }: { cert: Certification; domain?: Domain }) {
  const minutes = Math.round(cert.durationSec / 60);
  return (
    <Link
      to={`/certifications/${cert.slug}`}
      className="card group flex h-full flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-lg" aria-hidden>
          {domain?.icon ?? '📘'}
        </span>
        <Badge tone="saffron">{cert.popularity >= 90 ? 'Popular' : 'Free'}</Badge>
      </div>
      <h3 className="mt-3 font-semibold text-ink group-hover:text-brand-800">{cert.title}</h3>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600">{cert.shortDesc}</p>
      <div className="mt-4 flex items-center gap-3 text-xs text-slate-500">
        <span>{minutes} min</span>
        <span aria-hidden>•</span>
        <span>{cert.questionCount} questions</span>
        <span aria-hidden>•</span>
        <span>Pass {cert.passScorePct}%</span>
      </div>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
        View certification <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
