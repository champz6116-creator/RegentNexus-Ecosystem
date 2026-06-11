import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowLeft, Clock, AlertCircle } from 'lucide-react';
import api from '../../api';

export default function VerifyPage({ onUpdateUser }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🌟 PERSISTENT STATE RECOVERY: Check location.state first, fall back to localStorage on refresh
  const [identifier, setIdentifier] = useState(() => {
    return location.state?.identifier || localStorage.getItem('pendingIdentifier') || '';
  });
  
  const [mode, setMode] = useState(() => {
    return location.state?.verificationMode || localStorage.getItem('pendingVerificationMode') || 'email';
  });

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Sync state mutations cleanly down to storage instances to withstand hard refreshes
  useEffect(() => {
    if (identifier) {
      localStorage.setItem('pendingIdentifier', identifier);
    }
    if (mode) {
      localStorage.setItem('pendingVerificationMode', mode);
    }
  }, [identifier, mode]);

  // Handle absolute fallback route safety mapping
  useEffect(() => {
    if (!identifier) {
      setMessage('Missing account identity mapping context. Returning to sign-in...');
      const timer = setTimeout(() => navigate('/login'), 3000);
      return () => clearTimeout(timer);
    }
  }, [identifier, navigate]);

  /**
   * Clears out all verification cache footprints from the client storage 
   * space once a validation pipeline cycle successfully resolves.
   */
  const clearVerificationStorage = () => {
    localStorage.removeItem('pendingIdentifier');
    localStorage.removeItem('pendingVerificationMode');
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!code) return setMessage('Please enter the verification code.');
    
    setLoading(true);
    setMessage('');
    try {
      const response = await api.post('/api/auth/confirm-verification', {
        identifier,
        code
      });
      
      setMessage('Account verified successfully!');
      if (onUpdateUser && response.data?.user) {
        onUpdateUser(response.data.user);
      }
      
      localStorage.setItem('token', response.data.token);
      clearVerificationStorage(); // Safe housekeeping flush
      
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await api.post('/api/auth/request-verification', { identifier });
      setMessage(response.data?.message || 'A new verification code has been sent.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    clearVerificationStorage(); // Clean slate if user explicitly aborts
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-8 rounded-3xl shadow-xl space-y-6">
        
        {/* Navigation Headboard */}
        <div className="flex items-center justify-between">
          <button 
            onClick={handleBackToLogin} 
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-400 hover:text-emerald-600 transition"
          >
            <ArrowLeft size={16} />
            <span>Back to Sign In</span>
          </button>
          <span className="text-[10px] uppercase font-black tracking-widest px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-transparent">
            Security Gate
          </span>
        </div>

        {/* Dynamic Context Header Block */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            {mode === 'admin' ? <Clock size={28} className="animate-pulse" /> : <ShieldCheck size={28} />}
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {mode === 'admin' ? 'Approval Pending' : 'Verify Your Identity'}
          </h2>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-400 max-w-xs mx-auto">
            {mode === 'admin' 
              ? 'Your account request has been routed to the administration portal workflow configuration.' 
              : `A verification security parameter has been issued to ${identifier}`}
          </p>
        </div>

        {/* Global Error/Success Feedback Alerts */}
        {message && (
          <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-300 dark:border-slate-800 flex items-start gap-2.5">
            <AlertCircle className="text-slate-800 dark:text-emerald-400 shrink-0 mt-0.5" size={16} />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-relaxed">{message}</span>
          </div>
        )}

        {/* View Switch Matrix */}
        {mode === 'admin' ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/10 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-center">
              <span className="text-xs font-extrabold text-amber-950 dark:text-amber-400 uppercase tracking-wider block mb-1">ℹ️ Verification Notice</span>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 leading-relaxed">
                Administrators manual confirmation verification is operational. Once verified, your status upgrades automatically to grant workspace marketplace clearance.
              </p>
            </div>
            
            <button
              onClick={handleBackToLogin}
              className="w-full py-3.5 rounded-xl bg-slate-950 dark:bg-slate-800 hover:bg-slate-900 dark:hover:bg-slate-700 text-white text-xs font-black tracking-wide shadow-sm transition"
            >
              Awaiting Manual Approval (Return to Login)
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase font-extrabold tracking-wider text-slate-700 dark:text-slate-400 block">
                Verification Pin Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-800 rounded-xl focus:outline-none focus:border-slate-900 dark:focus:border-emerald-500 text-center text-lg font-black tracking-widest placeholder:tracking-normal placeholder:font-medium placeholder:text-sm"
                  placeholder="Enter 6-digit code"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 dark:text-slate-500" size={18} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !identifier}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition"
            >
              {loading ? 'Processing Validation...' : 'Confirm Account Verification'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleResendOTP}
                className="text-xs font-extrabold text-slate-800 dark:text-emerald-400 hover:underline hover:text-slate-900 dark:hover:text-emerald-300 transition"
              >
                Didn't acquire verification code parameters? Resend via Mail
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}