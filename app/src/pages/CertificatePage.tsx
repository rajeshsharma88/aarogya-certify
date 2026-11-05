import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Certificate } from '../types';
import { provider } from '../data';
import { useAuth } from '../context/AuthContext';
import { CertificatePreview } from '../components/CertificatePreview';
import { Spinner, StatusBadge } from '../components/ui';
import { verificationUrl } from '../modules/certificate/qr';

export function CertificatePage() {
  const { certificateNo = '' } = useParams();
  const { user } = useAuth();
  const [cert, setCert] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    provider
      .getCertificateByNo(certificateNo)
      .then((c) => active && setCert(c ?? null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [certificateNo]);

  if (loading) return <Spinner label="Loading certificate…" />;
  if (!cert) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">Certificate not found</h1>
        <p className="mt-2 text-slate-600">Check the certificate ID or verify it publicly.</p>
        <Link to="/verify" className="btn-primary mt-6">Verify a certificate</Link>
      </div>
    );
  }

  const isOwner = user?.id === cert.userId;
  const isAdmin = user?.role === 'admin';
  if (!isOwner && !isAdmin) {
    return (
      <div className="container-page py-20 text-center">
        <h1 className="font-display text-2xl font-semibold">This certificate belongs to another account</h1>
        <p className="mt-2 text-slate-600">Anyone can confirm its authenticity through the public verification page.</p>
        <Link to={`/verify/${cert.certificateNo}`} className="btn-primary mt-6">Verify publicly</Link>
      </div>
    );
  }

  const link = verificationUrl(cert.certificateNo);

  async function download() {
    if (!cert) return;
    setDownloading(true);
    setNotice(null);
    try {
      const { downloadCertificatePdf } = await import('../modules/certificate/pdf');
      await downloadCertificatePdf(cert);
      setNotice('PDF downloaded.');
    } catch (e) {
      setNotice(e instanceof Error ? `Download failed: ${e.message}` : 'Download failed.');
    } finally {
      setDownloading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setNotice('Verification link copied to clipboard.');
    } catch {
      setNotice(`Copy this link: ${link}`);
    }
  }

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Your certificate</p>
          <h1 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">{cert.title}</h1>
        </div>
        <StatusBadge status={cert.status} />
      </div>

      <div className="mt-6">
        <CertificatePreview cert={cert} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={() => void download()} disabled={downloading}>
          {downloading ? 'Preparing PDF…' : 'Download PDF certificate'}
        </button>
        <button type="button" className="btn-outline" onClick={() => void copyLink()}>
          Copy verification link
        </button>
        <Link to={`/verify/${cert.certificateNo}`} className="btn-ghost">
          Open public verification
        </Link>
        <Link to="/dashboard" className="btn-ghost">Back to dashboard</Link>
      </div>

      {notice && <p className="mt-3 text-sm text-brand-700" role="status">{notice}</p>}

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Certificate ID</dt>
          <dd className="mt-1 font-mono text-sm font-semibold text-ink">{cert.certificateNo}</dd>
        </div>
        <div className="card p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Issued</dt>
          <dd className="mt-1 text-sm font-semibold text-ink">
            {new Date(cert.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </dd>
        </div>
        <div className="card p-4">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Score</dt>
          <dd className="mt-1 text-sm font-semibold text-ink">{cert.scorePct}%</dd>
        </div>
      </dl>
    </div>
  );
}
