import { useNavigate, useParams } from 'react-router-dom';
import { useAsync } from '../hooks/useAsync';
import { Spinner } from '../components/ui';

export function PaymentSuccess() {
  const navigate = useNavigate();
  const { certificateId } = useParams();

  const { loading } = useAsync(async () => {
    if (!certificateId) {
      navigate('/');
      return;
    }

    try {
      // In a real app, we'd fetch the certificate and order details
      // For now, just redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard/payments');
      }, 2000);
    } catch (error) {
      console.error('Error loading payment details:', error);
      navigate('/');
    }
  }, [certificateId, navigate]);

  if (loading) {
    return (
      <div className="container-page flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl">
        {/* Success Icon */}
        <div className="mb-6 flex justify-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-green-100">
            <span className="text-4xl">✓</span>
          </div>
        </div>

        {/* Success Message */}
        <h1 className="text-center font-display text-3xl font-semibold">
          Payment Successful!
        </h1>

        <p className="mt-2 text-center text-slate-600">
          Your certificate is now ready to download and share.
        </p>

        {/* Next Steps */}
        <div className="mt-8 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
          <h2 className="font-semibold">What's next?</h2>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                1
              </span>
              <span className="text-sm">
                Download your certificate PDF from your dashboard
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                2
              </span>
              <span className="text-sm">
                Share your achievement on LinkedIn with a verified badge
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                3
              </span>
              <span className="text-sm">
                Access your invoice and payment receipt anytime
              </span>
            </li>
          </ol>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate('/dashboard/payments')}
            className="btn-primary flex-1"
          >
            Go to Dashboard
          </button>
          <button onClick={() => navigate('/')} className="btn-outline flex-1">
            Back to Home
          </button>
        </div>

        {/* Auto-redirect notice */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Redirecting to your dashboard in a moment...
        </p>
      </div>
    </div>
  );
}
