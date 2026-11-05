import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Attempt, Certificate, Certification, Domain, Question } from "../types";
import { provider } from '../data';
import { Badge, Spinner, StatusBadge } from '../components/ui';

type Tab = 'overview' | 'domains' | 'certifications' | 'questions' | 'attempts' | 'certificates';

const TABS: Array<[Tab, string]> = [
  ['overview', 'Overview'],
  ['domains', 'Domains'],
  ['certifications', 'Certifications'],
  ['questions', 'Questions'],
  ['attempts', 'Attempts'],
  ['certificates', 'Certificates'],
];

export function Admin() {
  const [tab, setTab] = useState<Tab>('overview');
  const [domains, setDomains] = useState<Domain[]>([]);
  const [certs, setCerts] = useState<Certification[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [analytics, setAnalytics] = useState<Awaited<ReturnType<typeof provider.analytics>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [d, c, a, ce, an] = await Promise.all([
      provider.listDomains(),
      provider.listCertifications(),
      provider.listAllAttempts(),
      provider.listAllCertificates(),
      provider.analytics(),
    ]);
    setDomains(d);
    setCerts(c);
    setAttempts(a);
    setCertificates(ce);
    setAnalytics(an);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const certById = useMemo(() => new Map(certs.map((c) => [c.id, c])), [certs]);

  if (loading) return <Spinner label="Loading admin data…" />;

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Administration</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Platform console</h1>
        </div>
        <button type="button" className="btn-outline" onClick={() => void refresh()}>Refresh data</button>
      </div>

      {notice && (
        <div className="mt-4 rounded-lg bg-brand-50 px-4 py-2 text-sm text-brand-800 ring-1 ring-brand-200" role="status">
          {notice}
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition ${
              tab === id ? 'bg-brand-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
            aria-current={tab === id ? 'page' : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && analytics && (
        <section className="mt-6">
          <dl className="grid gap-4 sm:grid-cols-4">
            {[
              ['Candidates', analytics.totalUsers],
              ['Attempts', analytics.totalAttempts],
              ['Certificates', analytics.totalCertificates],
              ['Pass rate', `${analytics.passRate}%`],
            ].map(([label, value]) => (
              <div key={String(label)} className="card p-5">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
                <dd className="mt-1 font-display text-2xl font-semibold text-brand-800">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="card mt-6 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Domain</th>
                  <th className="px-4 py-3 font-semibold">Attempts</th>
                  <th className="px-4 py-3 font-semibold">Certificates</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.byDomain.map((d) => (
                  <tr key={d.domain}>
                    <td className="px-4 py-3 font-medium text-ink">{d.domain}</td>
                    <td className="px-4 py-3 text-slate-600">{d.attempts}</td>
                    <td className="px-4 py-3 text-slate-600">{d.certificates}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'domains' && <DomainsTab domains={domains} onSaved={refresh} setNotice={setNotice} />}
      {tab === 'certifications' && (
        <CertificationsTab domains={domains} certs={certs} onSaved={refresh} setNotice={setNotice} />
      )}
      {tab === 'questions' && <QuestionsTab certs={certs} onSaved={refresh} setNotice={setNotice} />}

      {tab === 'attempts' && (
        <section className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Candidate</th>
                <th className="px-4 py-3 font-semibold">Certification</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Started</th>
                <th className="px-4 py-3 font-semibold"><span className="sr-only">Result</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attempts.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3 font-medium text-ink">{a.candidateName}</td>
                  <td className="px-4 py-3 text-slate-600">{certById.get(a.certificationId)?.title ?? a.certificationId}</td>
                  <td className="px-4 py-3">
                    <Badge tone={a.status === 'in_progress' ? 'saffron' : 'slate'}>{a.status.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{new Date(a.startedAt).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    {a.status !== 'in_progress' && (
                      <Link to={`/assess/${a.id}/result`} className="text-sm font-semibold text-brand-700 hover:underline">
                        Result
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
              {attempts.length === 0 && (
                <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={5}>No attempts recorded.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {tab === 'certificates' && (
        <section className="card mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Certificate</th>
                <th className="px-4 py-3 font-semibold">Holder</th>
                <th className="px-4 py-3 font-semibold">Certification</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Issued</th>
                <th className="px-4 py-3 font-semibold"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {certificates.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{c.certificateNo}</td>
                  <td className="px-4 py-3 font-medium text-ink">{c.holderName}</td>
                  <td className="px-4 py-3 text-slate-600">{c.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-slate-600">{new Date(c.issueDate).toLocaleDateString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">
                    {c.status === 'valid' ? (
                      <button
                        type="button"
                        className="text-sm font-semibold text-red-600 hover:underline"
                        onClick={async () => {
                          await provider.revokeCertificate(c.id);
                          setNotice(`Certificate ${c.certificateNo} revoked. Public verification now reports it as revoked.`);
                          await refresh();
                        }}
                      >
                        Revoke
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {certificates.length === 0 && (
                <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={6}>No certificates issued yet.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function DomainsTab({
  domains,
  onSaved,
  setNotice,
}: {
  domains: Domain[];
  onSaved: () => Promise<void>;
  setNotice: (s: string | null) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📘');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await provider.upsertDomain({ name: name.trim(), description, icon });
      setNotice(`Domain “${name.trim()}” saved.`);
      setName('');
      setDescription('');
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save domain.');
    }
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-3">
      <form onSubmit={submit} className="card h-fit p-5">
        <h2 className="font-semibold text-ink">Add domain</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="d-name">Name</label>
            <input id="d-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="d-desc">Description</label>
            <input id="d-desc" className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="d-icon">Icon</label>
            <input id="d-icon" className="input" value={icon} onChange={(e) => setIcon(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full">Save domain</button>
        </div>
      </form>

      <div className="card overflow-hidden lg:col-span-2">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Domain</th>
              <th className="px-4 py-3 font-semibold">Slug</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {domains.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3 font-medium text-ink">{d.icon} {d.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.slug}</td>
                <td className="px-4 py-3"><Badge tone={d.isActive ? 'green' : 'slate'}>{d.isActive ? 'Active' : 'Inactive'}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CertificationsTab({
  domains,
  certs,
  onSaved,
  setNotice,
}: {
  domains: Domain[];
  certs: Certification[];
  onSaved: () => Promise<void>;
  setNotice: (s: string | null) => void;
}) {
  const [title, setTitle] = useState('');
  const [domainId, setDomainId] = useState(domains[0]?.id ?? '');
  const [shortDesc, setShortDesc] = useState('');
  const [durationMin, setDurationMin] = useState(7);
  const [questionCount, setQuestionCount] = useState(10);
  const [passScore, setPassScore] = useState(60);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!domainId && domains[0]) setDomainId(domains[0].id);
  }, [domains, domainId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !domainId) return;
    try {
      await provider.upsertCertification({
        title: title.trim(),
        domainId,
        shortDesc,
        description: shortDesc,
        durationSec: durationMin * 60,
        questionCount,
        passScorePct: passScore,
        topics: ['General'],
      });
      setNotice(`Certification “${title.trim()}” created.`);
      setTitle('');
      setShortDesc('');
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save certification.');
    }
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-3">
      <form onSubmit={submit} className="card h-fit p-5">
        <h2 className="font-semibold text-ink">Create certification</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="c-title">Title</label>
            <input id="c-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="c-domain">Domain</label>
            <select id="c-domain" className="input" value={domainId} onChange={(e) => setDomainId(e.target.value)}>
              {domains.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="c-desc">Short description</label>
            <input id="c-desc" className="input" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="c-duration">Minutes</label>
              <input id="c-duration" type="number" min={1} className="input" value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value) || 7)} />
            </div>
            <div>
              <label className="label" htmlFor="c-pass">Pass %</label>
              <input id="c-pass" type="number" min={1} max={100} className="input" value={passScore} onChange={(e) => setPassScore(Number(e.target.value) || 60)} />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="c-count">Questions per attempt</label>
            <input id="c-count" type="number" min={1} className="input" value={questionCount} onChange={(e) => setQuestionCount(Number(e.target.value) || 10)} />
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full">Create certification</button>
        </div>
      </form>

      <div className="card overflow-hidden lg:col-span-2">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Certification</th>
              <th className="px-4 py-3 font-semibold">Minutes</th>
              <th className="px-4 py-3 font-semibold">Pass %</th>
              <th className="px-4 py-3 font-semibold">Questions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {certs.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3 font-medium text-ink">{c.title}</td>
                <td className="px-4 py-3 text-slate-600">{Math.round(c.durationSec / 60)}</td>
                <td className="px-4 py-3 text-slate-600">{c.passScorePct}</td>
                <td className="px-4 py-3 text-slate-600">{c.questionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function QuestionsTab({
  certs,
  onSaved,
  setNotice,
}: {
  certs: Certification[];
  onSaved: () => Promise<void>;
  setNotice: (s: string | null) => void;
}) {
  const [certId, setCertId] = useState(certs[0]?.id ?? '');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [body, setBody] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correct, setCorrect] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!certId && certs[0]) setCertId(certs[0].id);
  }, [certs, certId]);

  useEffect(() => {
    if (!certId) return;
    let active = true;
    provider.listQuestions(certId).then((qs) => active && setQuestions(qs));
    return () => {
      active = false;
    };
  }, [certId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || options.some((o) => !o.trim())) {
      setError('Enter the question text and all four options.');
      return;
    }
    setError(null);
    const qid = `q-admin-${Date.now()}`;
    await provider.upsertQuestion({
      certificationId: certId,
      body: body.trim(),
      topic: 'General',
      options: options.map((label, i) => ({
        id: `o-admin-${Date.now()}-${i}`,
        questionId: qid,
        label: label.trim(),
        isCorrect: i === correct,
        sortOrder: i,
      })),
    });
    setNotice('Question added to the bank.');
    setBody('');
    setOptions(['', '', '', '']);
    setCorrect(0);
    setQuestions(await provider.listQuestions(certId));
    await onSaved();
  }

  return (
    <section className="mt-6 grid gap-6 lg:grid-cols-2">
      <form onSubmit={submit} className="card h-fit p-5">
        <h2 className="font-semibold text-ink">Add question</h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="label" htmlFor="q-cert">Certification</label>
            <select id="q-cert" className="input" value={certId} onChange={(e) => setCertId(e.target.value)}>
              {certs.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="q-body">Question</label>
            <textarea id="q-body" className="input" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          {options.map((opt, i) => (
            <label key={i} className="flex items-center gap-3 text-sm">
              <input
                type="radio"
                name="correct-option"
                checked={correct === i}
                onChange={() => setCorrect(i)}
                aria-label={`Mark option ${i + 1} as correct`}
              />
              <input
                className="input"
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => setOptions((prev) => prev.map((x, j) => (j === i ? e.target.value : x)))}
                aria-label={`Option ${i + 1}`}
              />
            </label>
          ))}
          <p className="text-xs text-slate-500">Select the radio button next to the correct answer.</p>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button type="submit" className="btn-primary w-full">Add question</button>
        </div>
      </form>

      <div className="card p-5">
        <h2 className="font-semibold text-ink">Question bank ({questions.length})</h2>
        <ul className="mt-3 max-h-[520px] space-y-3 overflow-y-auto pr-1">
          {questions.map((q) => (
            <li key={q.id} className="rounded-lg border border-slate-200 p-3 text-sm">
              <p className="font-medium text-ink">{q.body}</p>
              <ul className="mt-1.5 space-y-0.5 text-xs">
                {q.options.map((o) => (
                  <li key={o.id} className={o.isCorrect ? 'font-semibold text-emerald-700' : 'text-slate-600'}>
                    {o.isCorrect ? '✓ ' : '· '}{o.label}
                  </li>
                ))}
              </ul>
            </li>
          ))}
          {questions.length === 0 && <li className="text-sm text-slate-500">No questions in this bank yet.</li>}
        </ul>
      </div>
    </section>
  );
}
