import { useNavigate, useSearchParams } from 'react-router-dom';

export function PaymentFailed() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const errorReason = searchParams.get('reason') || 'Unknown error';

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-2xl">
        {/* Error Icon */}
        <div className="mb-6 flex justify-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-red-100">
            <span className="text-4xl">✕</span>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-center font-display text-3xl font-semibold">
          Payment Failed
        </h1>

        <p className="mt-2 text-center text-slate-600">
          Your payment could not be processed. Please try again.
        </p>

        {/* Error Details */}
        {errorReason && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              <strong>Reason:</strong> {errorReason}
            </p>
          </div>
        )}

        {/* Why Payment Failed */}
        <div className="mt-8 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
          <h2 className="font-semibold">This might happen if:</h2>
          <ul className="space-y-2 text-sm">
            <li>• Your payment method was declined by the bank</li>
            <li>• You cancelled the payment during the process</li>
            <li>• There was a network connection issue</li>
            <li>• Your card does not support online payments</li>
            <li>• You exceeded daily transaction limits</li>
          </ul>
        </div>

        {/* Troubleshooting */}
        <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <strong>Try:</strong> Using a different payment method, checking your card details,
            or contacting your bank to enable online transactions.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => navigate(-1)}
            className="btn-primary flex-1"
          >
            Try Again
          </button>
          <button onClick={() => navigate('/')} className="btn-outline flex-1">
            Back to Home
          </button>
        </div>

        {/* Support */}
        <p className="mt-6 text-center text-xs text-slate-600">
          Need help?{' '}
          <a href="mailto:support@aarogya.in" className="text-brand-600 underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
