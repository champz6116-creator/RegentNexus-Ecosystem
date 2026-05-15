import { useEffect, useState } from 'react';
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
