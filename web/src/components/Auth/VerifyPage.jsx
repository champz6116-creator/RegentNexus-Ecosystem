import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

export default function VerifyPage({ onSignIn }) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
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
    <main className="flex min-h-[85vh] items-center justify-center bg-slate-50 px-4 py-8 sm:px-6">
      {/* Expanded width max-w-lg and padding p-8 for a less cramped layout */}
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/40 border border-slate-100 space-y-8">
        <header className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Account Verification</h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {pendingMode === 'admin' 
              ? 'Your registration is under review.' 
              : `A 6-digit confirmation code was sent via ${pendingMode.toUpperCase()}.`}
          </p>
        </header>

        {pendingMode === 'admin' ? (
          <div className="rounded-2xl bg-amber-50 p-6 border border-amber-200/60 text-amber-900 text-sm space-y-4">
            <div className="flex items-center gap-2 justify-center font-semibold text-amber-950 text-base">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-amber-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Awaiting Manual Verification
            </div>
            <p className="text-sm text-center text-amber-900/80 leading-relaxed max-w-sm mx-auto">
              An administrator is reviewing your academic credentials. You will gain system platform access once your portal account state is cleared.
            </p>
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 shadow-sm mt-2"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <label className="block">
              {/* Prominent input label placement */}
              <span className="text-sm font-medium text-slate-700 tracking-wide block mb-2.5 ml-1">Verification Code</span>
              {/* Massive input field box, padding, and text-2xl fonts for effortless touch scanning */}
              <input 
                value={code} 
                onChange={(e) => setCode(e.target.value)} 
                maxLength={6} 
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-4 text-slate-950 text-center tracking-[0.5em] text-2xl font-black outline-none transition focus:border-amber-500 focus:bg-white focus:shadow-md focus:ring-4 focus:ring-amber-500/5" 
                placeholder="000000" 
              />
            </label>
            
            <button 
              type="button" 
              onClick={handleVerify} 
              disabled={loading} 
              className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-base font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? 'Verifying Identity…' : 'Verify Account'}
            </button>

            <div className="text-center pt-2">
              <button 
                type="button"
                disabled={resending}
                onClick={handleResend}
                className="text-sm font-bold text-slate-500 hover:text-amber-600 transition underline underline-offset-4 decoration-slate-300 disabled:opacity-60"
              >
                {resending ? 'Dispatched new code...' : "Didn't receive code? Resend"}
              </button>
            </div>
          </div>
        )}
        
        {message && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3.5 text-center text-sm font-semibold text-rose-700 border border-rose-100 animate-fade-in">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
