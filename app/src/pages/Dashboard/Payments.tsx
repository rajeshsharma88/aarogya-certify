import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { provider } from '../../data';
import type { PaymentOrder } from '../../types';
import { Spinner } from '../../components/ui';

export function PaymentsDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    let active = true;
    provider
      .getUserPaymentOrders()
      .then((data) => {
        if (active) {
          setOrders(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load orders');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  if (!user) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">Sign in to view payments</h1>
        <p className="mt-2 text-slate-600">You need to be logged in to access this page.</p>
        <Link to="/login" className="btn-primary mt-6">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return <Spinner label="Loading payment history…" />;
  }

  return (
    <div className="container-page py-10">
      {/* Header */}
      <div className="mb-8">
        <p className="eyebrow">Payment Management</p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-ink sm:text-3xl">
          Payment History
        </h1>
        <p className="mt-2 text-slate-600">
          View your certificate purchases, invoices, and download receipts.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {orders.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-12 text-center">
          <p className="text-slate-600">
            No payments yet. Purchase a certificate to get started.
          </p>
          <Link to="/" className="btn-primary mt-6">
            Browse Certifications
          </Link>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Total Paid
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">
                ₹{(orders
                  .filter((o) => o.status === 'completed')
                  .reduce((sum, o) => sum + o.amountPaise, 0) / 100).toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Certificates Bought
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">
                {orders.filter((o) => o.status === 'completed').length}
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pending Orders
              </p>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">
                {orders.filter((o) => o.status === 'pending').length}
              </p>
            </div>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    Certificate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-slate-200 hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-ink">
                          {order.certificate?.title || 'Certificate'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.certificate?.certificateNo}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-ink">
                        ₹{(order.amountPaise / 100).toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <OrderActions order={order} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    completed: { bg: 'bg-green-100', text: 'text-green-700' },
    pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
    failed: { bg: 'bg-red-100', text: 'text-red-700' },
    refunded: { bg: 'bg-blue-100', text: 'text-blue-700' },
  };

  const color = colors[status] || colors.pending;

  return (
    <span className={`inline-flex rounded-full ${color.bg} px-2.5 py-1 text-xs font-semibold ${color.text}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function OrderActions({ order }: { order: PaymentOrder }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadInvoice = async () => {
    if (order.status !== 'completed') return;

    setDownloading(true);
    try {
      const blob = await provider.downloadInvoicePdf(order.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex justify-end gap-2">
      {order.status === 'completed' && (
        <>
          <Link
            to={`/certificate/${order.certificate?.certificateNo}`}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View
          </Link>
          <button
            onClick={handleDownloadInvoice}
            disabled={downloading}
            className="text-sm font-medium text-brand-600 hover:text-brand-700 disabled:opacity-50"
          >
            {downloading ? 'Downloading…' : 'Invoice'}
          </button>
        </>
      )}
      {order.status === 'pending' && (
        <Link
          to={`/certificate/${order.certificate?.certificateNo}/checkout`}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Complete
        </Link>
      )}
    </div>
  );
}
