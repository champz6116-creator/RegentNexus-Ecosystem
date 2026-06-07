import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StandardTextInput from '../Common/StandardTextInput';
import api from '../../api';

export default function AuthPage({ onSignIn }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    schoolId: '',
    schoolMail: '',
    phone: '',
    password: '',
    confirmPassword: '',
    identifier: '',
  });
  const [verificationMode, setVerificationMode] = useState('admin');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    setMessage('');
    if (!form.firstName || !form.lastName || !form.gender || !form.schoolId || !form.schoolMail || !form.phone || !form.password) {
      setMessage('Please fill all required fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        schoolId: form.schoolId,
        schoolMail: form.schoolMail,
        phone: form.phone,
        password: form.password,
        verificationMode,
      });

      if (data.verificationPending) {
        localStorage.setItem('pendingIdentifier', form.schoolMail);
        localStorage.setItem('pendingMode', verificationMode);
        navigate('/verify');
      } else {
        onSignIn(data.token, data.user);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setMessage('');
    if (!form.identifier || !form.password) {
      setMessage('Enter your email or phone and password.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        identifier: form.identifier,
        password: form.password,
      });
      onSignIn(data.token, data.user);
    } catch (error) {
      const response = error.response?.data;
      if (response?.needsVerification) {
        localStorage.setItem('pendingIdentifier', form.identifier);
        localStorage.setItem('pendingMode', 'admin');
        navigate('/verify');
      } else {
        setMessage(response?.message || 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-3xl flex-col px-4 py-8 sm:px-6">
      <header className="mb-6 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <p className="text-3xl font-semibold text-slate-900">Regent Nexus</p>
        <p className="mt-2 text-sm text-slate-500">Login or register your account to continue.</p>
      </header>

      <section className="grid gap-4 rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <nav className="flex flex-wrap gap-2">
          {['login', 'register'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
              onClick={() => {
                setMode(tab);
                setMessage('');
              }}
            >
              {tab === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </nav>

        {mode === 'register' ? (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">First Name</span>
              <input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" placeholder="Rooney" />
            </label>
            
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Last Name</span>
              <input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" placeholder="Uwho Victor" />
            </label>

            {/* Mandatory Dropdown field for Gender mapping */}
            <div className="space-y-1">
              <label className="text-xs uppercase font-bold text-slate-400 block">Gender</label>
              <select 
                value={form.gender} 
                onChange={e => setField('gender', e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:border-slate-900"
              >
                <option value="">Select Gender...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">School ID</span>
              <input value={form.schoolId} onChange={(e) => setField('schoolId', e.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" placeholder="00500122" />
            </label>
            
            <label className="block">
              <span className="text-sm font-medium text-slate-700">School Email</span>
              <input value={form.schoolMail} onChange={(e) => setField('schoolMail', e.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" placeholder="rooney.uwho@regent.edu.gh" />
            </label>
            
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Phone</span>
              <input value={form.phone} onChange={(e) => setField('phone', e.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" placeholder="+233530282249" />
            </label>
            
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setField('password', e.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
            
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Confirm Password</span>
              <div className="relative">
                <input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" placeholder="••••••••" />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
            
            <div className="grid gap-2 sm:grid-cols-3">
              {['email', 'sms', 'admin'].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`rounded-3xl border px-4 py-3 text-sm font-semibold ${verificationMode === option ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
                  onClick={() => setVerificationMode(option)}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
            
            <button type="button" onClick={handleRegister} disabled={loading} className="w-full rounded-3xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700 disabled:opacity-60">
              {loading ? 'Registering…' : 'Register'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email or Phone</span>
              <input value={form.identifier} onChange={(e) => setField('identifier', e.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" placeholder="rooney.uwho@regent.edu.gh" />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setField('password', e.target.value)} className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </label>
            <button type="button" onClick={handleLogin} disabled={loading} className="w-full rounded-3xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-700 disabled:opacity-60">
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </div>
        )}

        {message && <p className="rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>}
      </section>
    </main>
  );
}
