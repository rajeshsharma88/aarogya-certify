import { useEffect, useState } from 'react';
import type { Certificate } from '../types';
import { LogoWordmark } from '../brand/Logo';
import { qrDataUrl, verificationUrl } from '../modules/certificate/qr';

export function CertificatePreview({ cert }: { cert: Certificate }) {
  const [qr, setQr] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    qrDataUrl(cert.certificateNo, 240)
      .then((url) => active && setQr(url))
      .catch(() => active && setQr(null));
    return () => {
      active = false;
    };
  }, [cert.certificateNo]);

  const issued = new Date(cert.issueDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="overflow-hidden rounded-xl border-4 border-brand-700 bg-white shadow-lift">
      <div className="border border-saffron-300 p-5 sm:p-10">
        <div className="text-center">
          <LogoWordmark />
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.32em] text-brand-700">
            Certificate of Achievement
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold tracking-wide text-ink sm:text-3xl">CERTIFICATE</h2>
          <p className="text-xs tracking-[0.28em] text-slate-500">OF ACHIEVEMENT</p>
        </div>

        <div className="mt-7 text-center">
          <p className="text-xs text-slate-500">This certificate is proudly presented to</p>
          <p className="mt-2 font-display text-3xl font-semibold text-brand-900 sm:text-4xl">{cert.holderName}</p>
          <div className="mx-auto mt-3 h-px w-56 bg-saffron-400" />
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-600">
            for successfully completing the <strong className="text-ink">{cert.title}</strong> assessment with a score of{' '}
            <strong className="text-ink">{cert.scorePct}%</strong>.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          <dl className="text-left text-xs">
            <dt className="font-semibold uppercase tracking-wider text-slate-400">Certificate ID</dt>
            <dd className="font-mono text-sm font-semibold text-ink">{cert.certificateNo}</dd>
            <dt className="mt-3 font-semibold uppercase tracking-wider text-slate-400">Issued on</dt>
            <dd className="text-sm font-semibold text-ink">{issued}</dd>
            <dt className="mt-3 font-semibold uppercase tracking-wider text-slate-400">Status</dt>
            <dd className="text-sm font-semibold uppercase text-ink">{cert.status}</dd>
          </dl>

          <div className="text-center">
            <p className="font-display text-lg font-semibold text-brand-800">Aarogya India</p>
            <div className="mx-auto mt-1 h-px w-36 bg-slate-400" />
            <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">Authorised Issuer</p>
          </div>

          <div className="text-center">
            {qr ? (
              <img src={qr} alt={`QR code to verify certificate ${cert.certificateNo}`} className="h-24 w-24" />
            ) : (
              <div className="h-24 w-24 animate-pulse rounded bg-slate-100" aria-hidden />
            )}
            <p className="mt-1 text-[10px] text-slate-500">Scan to verify</p>
          </div>
        </div>

        <p className="mt-7 border-t border-slate-200 pt-3 text-center text-[10px] leading-relaxed text-slate-500">
          Verify at <span className="font-mono">{verificationUrl(cert.certificateNo)}</span> · Issued for skill
          demonstration; not a government or university qualification.
        </p>
      </div>
    </div>
  );
}
