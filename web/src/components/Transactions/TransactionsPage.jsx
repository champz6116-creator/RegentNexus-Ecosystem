import { useEffect, useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import api from '../../api';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/transactions');
      setTransactions(data);
    } catch (error) {
      console.error('Fetch transactions failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
      <h2 className="text-2xl font-semibold text-slate-900">Transactions</h2>

      {/* ── Pilot Phase Notice Card ── */}
      <div
        role="alert"
        aria-label="Pilot Version Notice"
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '14px',
          marginTop: '20px',
          padding: '16px 20px',
          background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 60%, #fde68a22 100%)',
          border: '1.5px solid #f59e0b',
          borderRadius: '16px',
          boxShadow: '0 2px 12px 0 rgba(245,158,11,0.10)',
        }}
      >
        {/* Icon badge */}
        <span
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            boxShadow: '0 2px 8px rgba(245,158,11,0.30)',
          }}
        >
          <Info size={20} color="#fff" strokeWidth={2.5} />
        </span>

        {/* Text block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <AlertTriangle size={14} color="#b45309" strokeWidth={2.5} />
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: '#b45309',
              }}
            >
              Pilot Version Notice
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '13.5px',
              fontWeight: 500,
              lineHeight: '1.65',
              color: '#78350f',
            }}
          >
            Direct electronic transaction tracking is disabled in this deployment phase.
            Please coordinate all payments externally via{' '}
            <strong style={{ fontWeight: 700 }}>cash</strong> or{' '}
            <strong style={{ fontWeight: 700 }}>Mobile Money (MoMo)</strong> during
            peer-to-peer exchanges.
          </p>
        </div>
      </div>
      {/* ── /Pilot Phase Notice Card ── */}

      {loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading transactions…</p>
      ) : (
        <div className="mt-5 space-y-4">
          {transactions.map((tx) => (
            <article key={tx._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-lg font-semibold text-slate-900">GHS {tx.amount.toFixed(2)}</p>
              <p className="text-sm text-slate-600">Status: {tx.status}</p>
              <p className="text-sm text-slate-600">Seller: {tx.seller?.firstName} {tx.seller?.lastName}</p>
              <p className="mt-2 text-slate-700">{tx.listing?.title || 'Listing details unavailable'}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
