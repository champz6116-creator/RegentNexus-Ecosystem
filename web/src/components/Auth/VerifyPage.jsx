import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function VerifyPage({ onSignIn }) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false); // 🌟 State for resend feedback
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

  // 🌟 New Resend Controller hooked into your backend endpoint
  const handleResend = async () => {
    setMessage('');
    setResending(true);
    try {
      const { data } = await api.post('/auth/request-verification', {
        identifier: pendingIdentifier,
        mode: pendingMode
      });
      setMessage(data.message || `A fresh code has been issued via ${pendingMode.toUpperCase()}.`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to dispatch replacement code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-8">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
        <header className="mb-6 text-center">
          <p className="text-2xl font-bold text-slate-900">Account Verification</p>
          <p className="mt-2 text-sm text-slate-500">
            {pendingMode === 'admin' 
              ? 'Your registration is under review.' 
              : `A 6-digit code was sent by ${pendingMode.toUpperCase()}.`}
          </p>
        </header>

        {pendingMode === 'admin' ? (
          <div className="rounded-2xl bg-amber-50 p-5 border border-amber-200 text-amber-900 text-sm">
            <p className="font-semibold text-center">Awaiting Manual Verification</p>
            <p className="mt-2 text-center text-amber-800/80">
              An administrator is reviewing your school credentials. You will be able to log in once your status is cleared.
            </p>
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="mt-6 w-full rounded-2xl bg-slate-900 px-4 py-2.5 text-white font-medium hover:bg-slate-800 transition"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700 ml-1">Verification Code</span>
              <input 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                maxLength={6} 
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-slate-900 text-center tracking-[0.5em] text-lg font-bold focus:ring-2 focus:ring-slate-900 outline-none" 
                placeholder="000000" 
              />
            </label>
            
            <button 
              type="button" 
              onClick={handleVerify} 
              disabled={loading} 
              className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-white font-semibold transition hover:bg-slate-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Account'}
            </button>

            {/* 🌟 Functional code extraction trigger */}
            <div className="text-center mt-4">
              <button 
                type="button"
                disabled={resending}
                onClick={handleResend}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 transition underline decoration-dotted underline-offset-4 disabled:opacity-50"
              >
                {resending ? 'Dispatched new code...' : "Didn't receive code? Resend"}
              </button>
            </div>
          </div>
        )}
        
        {message && (
          <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700 border border-rose-100">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
