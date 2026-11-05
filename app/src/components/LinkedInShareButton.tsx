import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { provider } from '../data';
import type { Certificate, PaymentOrder } from '../types';

interface LinkedInShareButtonProps {
  certificate: Certificate;
  paymentOrder?: PaymentOrder;
  onSuccess?: (linkedInPostId: string) => void;
  onError?: (error: Error) => void;
  variant?: 'button' | 'icon';
}

export function LinkedInShareButton({
  certificate,
  paymentOrder,
  onSuccess,
  onError,
  variant = 'button',
}: LinkedInShareButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [shareText, setShareText] = useState(
    `I just earned the ${certificate.title} certification! 🎓\n\nScore: ${certificate.scorePct}%\n\nVerify my credential:\n`
  );

  // Only show if certificate is paid
  const canShare = paymentOrder?.status === 'completed' || certificate.status === 'valid';

  if (!canShare) {
    return null;
  }

  const handleShare = async () => {
    if (!user) {
      onError?.(new Error('Not authenticated'));
      return;
    }

    setLoading(true);
    try {
      // Call LinkedIn share API through provider
      const result = await provider.shareToLinkedIn(certificate.id, shareText);

      setIsOpen(false);
      onSuccess?.(result.linkedinPostId || '');

      // Show success message
      alert('Certificate shared to LinkedIn! 🎉');
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to share');
      onError?.(err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={loading}
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-linkedin hover:bg-blue-50 disabled:opacity-50"
        title="Share on LinkedIn"
      >
        <LinkedInIcon />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        disabled={loading}
        className="btn-outline inline-flex items-center gap-2"
      >
        <LinkedInIcon className="h-4 w-4" />
        {loading ? 'Sharing...' : 'Share on LinkedIn'}
      </button>

      {isOpen && (
        <LinkedInShareModal
          certificate={certificate}
          shareText={shareText}
          onShareTextChange={setShareText}
          onShare={handleShare}
          onClose={() => setIsOpen(false)}
          loading={loading}
        />
      )}
    </>
  );
}

function LinkedInIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className || 'h-5 w-5'}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.475-2.236-1.986-2.236-1.081 0-1.722.732-2.004 1.438-.103.249-.129.597-.129.946v5.421h-3.554s.05-8.806 0-9.714h3.554v1.377c.43-.664 1.198-1.61 2.914-1.61 2.132 0 3.729 1.39 3.729 4.377v5.57zM5.337 8.855c-1.144 0-1.915-.758-1.915-1.708 0-.951.77-1.708 1.971-1.708 1.201 0 1.915.757 1.94 1.708 0 .95-.739 1.708-1.996 1.708zm1.582 11.597H3.714V9.538h3.205v10.914zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
    </svg>
  );
}

interface LinkedInShareModalProps {
  certificate: Certificate;
  shareText: string;
  onShareTextChange: (text: string) => void;
  onShare: () => Promise<void>;
  onClose: () => void;
  loading: boolean;
}

function LinkedInShareModal({
  certificate,
  shareText,
  onShareTextChange,
  onShare,
  onClose,
  loading,
}: LinkedInShareModalProps) {
  const verificationUrl = `${window.location.origin}/verify/${certificate.certificateNo}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-w-md rounded-lg bg-white shadow-lg">
        {/* Header */}
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">
            Share Certificate on LinkedIn
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Tell your network about your achievement
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Preview */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase text-slate-600">
              Preview
            </p>
            <p className="mt-2 text-sm text-slate-700">
              <strong>{certificate.title}</strong>
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Score: {certificate.scorePct}%
            </p>
          </div>

          {/* Share Text */}
          <div>
            <label className="block text-sm font-medium text-ink">
              Your message
            </label>
            <textarea
              value={shareText}
              onChange={(e) => onShareTextChange(e.target.value)}
              rows={4}
              className="input mt-2 resize-none"
              placeholder="Share what you learned..."
            />
          </div>

          {/* Verification Link */}
          <div>
            <p className="text-xs font-semibold uppercase text-slate-600">
              Verification Link (auto-added)
            </p>
            <code className="mt-2 block truncate rounded bg-slate-100 px-3 py-2 text-xs text-slate-700">
              {verificationUrl}
            </code>
          </div>

          {/* Certificate Badge Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-900">
              ✓ Verified Badge
            </p>
            <p className="mt-1 text-xs text-blue-800">
              Your certificate includes a verified badge that anyone can validate.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1">
            Cancel
          </button>
          <button
            onClick={onShare}
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Sharing...' : 'Share Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
