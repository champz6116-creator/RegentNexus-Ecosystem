import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function VerifyPage({ onSignIn }) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const pendingIdentifier = localStorage.getItem('pendingIdentifier');
  const pendingMode = localStorage.getItem('pendingMode') || 'email';

  const handleVerify = async () => {
    setMessage('');
    if (!pendingIdentifier || !code) {
      setMessage('Enter the code and make sure you requested verification.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/confirm-verification', {
        identifier: pendingIdentifier,
        code,
      });
      localStorage.removeItem('pendingIdentifier');
      localStorage.removeItem('pendingMode');
      onSignIn(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/home');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-[calc(100vh-80px)] max-w-3xl px-4 py-8 sm:px-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <header className="mb-4">
          <p className="text-2xl font-semibold text-slate-900">Enter your verification code</p>
          <p className="mt-2 text-sm text-slate-500">A 6-digit code was sent by {pendingMode.toUpperCase()}.</p>
        </header>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Verification Code</span>
          <input value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" placeholder="123456" />
        </label>
        <button type="button" onClick={handleVerify} disabled={loading} className="mt-6 w-full rounded-3xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700 disabled:opacity-60">
          {loading ? 'Verifying…' : 'Verify Account'}
        </button>
        {message && <p className="mt-4 rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>}
      </section>
    </main>
  );
}
