import { useState } from 'react';
import type { PaymentOrder } from '../types';
import { supportMailto } from '../brand/contact';

interface RefundRequestProps {
  order: PaymentOrder;
  onSubmit?: (reason: string) => void;
  onCancel?: () => void;
}

export function RefundRequest({ order, onSubmit, onCancel }: RefundRequestProps) {
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysElapsed = Math.floor(
    (Date.now() - Date.parse(order.createdAt)) / (1000 * 60 * 60 * 24)
  );
  const canRefund = daysElapsed <= 7; // 7-day refund policy

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canRefund) {
      setError('Refunds are only available within 7 days of purchase.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the refund.');
      return;
    }

    if (reason.length < 10) {
      setError('Please provide a detailed reason (at least 10 characters).');
      return;
    }

    setSubmitted(true);
    onSubmit?.(reason);
  };

  if (submitted) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
        <h3 className="font-semibold text-blue-900">Refund Request Submitted</h3>
        <p className="mt-2 text-sm text-blue-800">
          Thank you for your request. Our support team will review it and respond within 48 hours.
          You'll receive an email update at: {order.certificate?.certificateNo}
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="btn-outline mt-4"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-6">
      <div>
        <h3 className="font-semibold text-ink">Request a Refund</h3>
        <p className="mt-1 text-sm text-slate-600">
          Refunds are available within 7 days of purchase.
          {!canRefund && (
            <span className="block mt-2 text-red-600">
              ⚠️ This order is outside the 7-day refund window.
            </span>
          )}
        </p>
      </div>

      {/* Order Summary */}
      <div className="rounded-lg bg-slate-50 p-4">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Order ID</dt>
            <dd className="font-mono text-xs">{order.id.slice(0, 8)}...</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Amount</dt>
            <dd className="font-semibold">₹{(order.amountPaise / 100).toFixed(2)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Purchased</dt>
            <dd>{new Date(order.createdAt).toLocaleDateString()}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">Days Ago</dt>
            <dd>{daysElapsed} days</dd>
          </div>
        </dl>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Refund Policy Info */}
      <div className="rounded-lg bg-yellow-50 p-4">
        <p className="text-xs font-semibold text-yellow-900 uppercase">Refund Policy</p>
        <ul className="mt-2 space-y-1 text-xs text-yellow-800">
          <li>• Refunds processed within 5-7 business days</li>
          <li>• Original payment method will be credited</li>
          <li>• Digital products are non-refundable after 7 days</li>
          <li>• Refund does not restore certificate access</li>
        </ul>
      </div>

      {/* Reason Textarea */}
      <div>
        <label className="block text-sm font-medium text-ink">Reason for refund</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Please explain why you're requesting a refund..."
          className="input mt-2 resize-none"
          disabled={!canRefund}
        />
        <p className="mt-1 text-xs text-slate-500">
          {reason.length}/500 characters
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn-outline flex-1"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canRefund}
          className="btn-primary flex-1"
        >
          Submit Refund Request
        </button>
      </div>

      {/* Contact Support */}
      <p className="text-center text-xs text-slate-600">
        Have questions?{' '}
        <a href={supportMailto(`Refund request — order ${order.id}`)} className="text-brand-600 underline">
          Contact support
        </a>
      </p>
    </form>
  );
}

/**
 * Refund status display component
 */
interface RefundStatusProps {
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  reason?: string;
  rejectionReason?: string;
  createdAt?: string;
}

export function RefundStatus({
  status,
  reason,
  rejectionReason,
  createdAt,
}: RefundStatusProps) {
  const statusConfig = {
    pending: {
      icon: '⏳',
      label: 'Pending Review',
      description: 'Your refund request is under review. We typically respond within 48 hours.',
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-900',
    },
    approved: {
      icon: '✓',
      label: 'Approved',
      description: 'Your refund has been approved. It will be processed to your original payment method within 5-7 business days.',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-900',
    },
    rejected: {
      icon: '✕',
      label: 'Rejected',
      description: rejectionReason || 'Your refund request could not be approved.',
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-900',
    },
    completed: {
      icon: '✓✓',
      label: 'Refunded',
      description: 'Your refund has been successfully processed.',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-900',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-lg border p-4 ${config.color}`}>
      <div className="flex gap-3">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <h3 className={`font-semibold ${config.textColor}`}>
            {config.label}
          </h3>
          <p className={`mt-1 text-sm ${config.textColor}`}>
            {config.description}
          </p>
          {reason && (
            <p className={`mt-2 text-xs italic ${config.textColor}`}>
              Reason: {reason}
            </p>
          )}
          {createdAt && (
            <p className={`mt-1 text-xs ${config.textColor}`}>
              Requested: {new Date(createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
