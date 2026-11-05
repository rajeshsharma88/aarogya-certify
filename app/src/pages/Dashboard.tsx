import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Attempt, Certificate, Certification, Result } from '../types';
import { provider } from '../data';
import { useAuth } from '../context/AuthContext';
import { Badge, Spinner, StatusBadge } from '../components/ui';

interface Row {
  attempt: Attempt;
  cert: Certification | undefined;
  result: Result | undefined;
}

export function Dashboard() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const [attempts, certs, certifications] = await Promise.all([
        provider.listAttempts(user.id),
        provider.listCertificates(user.id),
        provider.listCertifications(),
      ]);
      const enriched = await Promise.all(
        attempts.map(async (attempt) => ({
          attempt,
          cert: certifications.find((c) => c.id === attempt.certificationId),
          result: attempt.status === 'in_progress' ? undefined : await provider.getResult(attempt.id),
        })),
      );
      if (!active) return;
      setRows(enriched);
      setCertificates(certs);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [user]);

  if (!user) return null;
  if (loading) return <Spinner label="Loading your dashboard…" />;

  const inProgress = rows.filter((r) => r.attempt.status === 'in_progress');
  const completed = rows.filter((r) => r.attempt.status !== 'in_progress');
  const passed = completed.filter((r) => r.result?.passed).length;

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">My dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">Welcome, {user.fullName}</h1>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
        </div>
        <Link to="/certifications" className="btn-primary">Take a new assessment</Link>
      </div>

      <dl className="mt-8 grid gap-4 sm:grid-cols-4">
        {[
          ['Assessments completed', completed.length],
          ['Passed', passed],
          ['Certificates', certificates.length],
          ['In progress', inProgress.length],
        ].map(([label, value]) => (
          <div key={String(label)} className="card p-5">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
            <dd className="mt-1 font-display text-2xl font-semibold text-brand-800">{value}</dd>
          </div>
        ))}
      </dl>

      {/* In progress */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Assessments in progress</h2>
        {inProgress.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">You have no unfinished assessments.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {inProgress.map(({ attempt, cert }) => (
              <li key={attempt.id} className="card flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold text-ink">{cert?.title ?? 'Assessment'}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Started {new Date(attempt.startedAt).toLocaleString('en-IN')}
                  </p>
                </div>
                <Link to={`/assess/${attempt.id}`} className="btn-primary shrink-0">Resume</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Certificates */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Earned certificates</h2>
        {certificates.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">Pass an assessment to earn your first certificate.</p>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((c) => (
              <li key={c.id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink">{c.title}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-1 font-mono text-xs text-slate-500">{c.certificateNo}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Issued {new Date(c.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {c.scorePct}%
                </p>
                <div className="mt-4 flex gap-2">
                  <Link to={`/certificates/${c.certificateNo}`} className="btn-outline text-xs">View</Link>
                  <Link to={`/verify/${c.certificateNo}`} className="btn-ghost text-xs">Verify link</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* History */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink">Assessment history</h2>
        {completed.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">No completed assessments yet.</p>
        ) : (
          <div className="card mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Certification</th>
                  <th className="px-4 py-3 font-semibold">Submitted</th>
                  <th className="px-4 py-3 font-semibold">Score</th>
                  <th className="px-4 py-3 font-semibold">Result</th>
                  <th className="px-4 py-3 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completed.map(({ attempt, cert, result }) => (
                  <tr key={attempt.id}>
                    <td className="px-4 py-3 font-medium text-ink">{cert?.title ?? 'Assessment'}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{result ? `${result.scorePct}%` : '—'}</td>
                    <td className="px-4 py-3">
                      {result ? (
                        result.passed ? <Badge tone="green">Passed</Badge> : <Badge tone="red">Not passed</Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/assess/${attempt.id}/result`} className="text-sm font-semibold text-brand-700 hover:underline">
                        View result
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
