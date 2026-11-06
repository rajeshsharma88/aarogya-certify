import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Certification, CatalogFilter, Domain } from '../types';
import { provider } from '../data';
import { CertificationCard } from '../components/CertificationCard';
import { EmptyState, Spinner } from '../components/ui';

export function Directory() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [domainSlug, setDomainSlug] = useState(params.get('domain') ?? '');
  const [sort, setSort] = useState<CatalogFilter['sort']>((params.get('sort') as CatalogFilter['sort']) ?? 'popular');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    provider.listDomains().then(setDomains).catch(() => setDomains([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      provider
        .listCertifications({ search, domainSlug: domainSlug || undefined, sort })
        .then((rows) => active && setCerts(rows))
        .finally(() => active && setLoading(false));
    }, 150);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, domainSlug, sort]);

  // keep URL shareable
  useEffect(() => {
    const next = new URLSearchParams();
    if (search) next.set('q', search);
    if (domainSlug) next.set('domain', domainSlug);
    if (sort && sort !== 'popular') next.set('sort', sort);
    setParams(next, { replace: true });
  }, [search, domainSlug, sort, setParams]);

  const domainById = useMemo(() => new Map(domains.map((d) => [d.id, d])), [domains]);
  const activeDomain = domains.find((d) => d.slug === domainSlug);

  return (
    <div className="container-page py-10 sm:py-14">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link to="/" className="hover:text-brand-700">
          Home
        </Link>{' '}
        / <span className="text-slate-700">Certifications</span>
      </nav>

      <header className="mt-4 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Certification directory</h1>
        <p className="mt-2 text-slate-600">
          Browse {certs.length || 'all'} assessments across {domains.length || 'all'}{' '}
          {domains.length === 1 ? 'professional domain' : 'professional domains'}. Every assessment is free,
          timed and objectively scored.
        </p>
      </header>

      <div className="mt-8 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <label htmlFor="dir-search" className="sr-only">
            Search certifications
          </label>
          <input
            id="dir-search"
            className="input pl-10"
            placeholder="Search by skill, topic or keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
            ⌕
          </span>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="dir-sort" className="text-sm text-slate-600">
            Sort
          </label>
          <select
            id="dir-sort"
            className="input w-auto"
            value={sort}
            onChange={(e) => setSort(e.target.value as CatalogFilter['sort'])}
          >
            <option value="popular">Most popular</option>
            <option value="newest">Newest</option>
            <option value="az">A–Z</option>
          </select>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by domain">
        <button
          type="button"
          className={`chip ${domainSlug === '' ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300'}`}
          onClick={() => setDomainSlug('')}
          aria-pressed={domainSlug === ''}
        >
          All domains
        </button>
        {domains.map((d) => (
          <button
            key={d.id}
            type="button"
            className={`chip ${domainSlug === d.slug ? 'bg-brand-700 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300'}`}
            onClick={() => setDomainSlug(d.slug)}
            aria-pressed={domainSlug === d.slug}
          >
            {d.icon} {d.name}
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-slate-500" aria-live="polite">
          {loading ? 'Loading…' : `${certs.length} certification${certs.length === 1 ? '' : 's'}`}
          {activeDomain ? ` in ${activeDomain.name}` : ''}
          {search ? ` matching “${search}”` : ''}
        </p>
        {(search || domainSlug) && (
          <button
            type="button"
            className="text-sm font-medium text-brand-700 hover:underline"
            onClick={() => {
              setSearch('');
              setDomainSlug('');
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      {loading ? (
        <Spinner label="Loading certifications…" />
      ) : certs.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No certifications found"
            body="Try a different keyword, choose another domain, or clear your filters."
            action={
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setSearch('');
                  setDomainSlug('');
                }}
              >
                Reset filters
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {certs.map((c) => (
            <CertificationCard key={c.id} cert={c} domain={domainById.get(c.domainId)} />
          ))}
        </div>
      )}
    </div>
  );
}
