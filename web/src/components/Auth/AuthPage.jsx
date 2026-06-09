import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [errors, setErrors] = useState({});
  const [verificationMode, setVerificationMode] = useState('admin');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Combined Live Validation Engine
  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    
    let errorMsg = '';
    
    // Name Validation
    if ((key === 'firstName' || key === 'lastName') && value.trim() !== '') {
      if (!/^[A-Za-zÀ-ÿ\s'-]+$/.test(value)) {
        errorMsg = 'Letters, hyphens, or spaces only.';
      }
    }
    
    // Email Validation
    if (key === 'schoolMail' && value.trim() !== '') {
      if (!value.trim().toLowerCase().endsWith('@regent.edu.gh')) {
        errorMsg = 'Must be an official @regent.edu.gh email.';
      }
    }
    
    // Phone Validation
    if (key === 'phone' && value.trim() !== '') {
      if (!/^\+?[0-9\s-]*$/.test(value)) {
        errorMsg = 'Numbers and international indicators (+) only.';
      } else if (value.trim().length < 10 || value.trim().length > 15) {
        errorMsg = 'Must be between 10 to 15 digits.';
      }
    }
    
    // Live Password Feedback (Enforced during registration only)
    if (mode === 'register' && key === 'password' && value.length > 0 && value.length < 8) {
      errorMsg = 'Password must be at least 8 characters long.';
    }
    
    // Confirm Password Match
    if (key === 'confirmPassword' && value !== form.password && value !== '') {
      errorMsg = 'Passwords do not match.';
    }

    setErrors((prev) => ({ ...prev, [key]: errorMsg }));
  };

  // Final Registration Submission Validator
  const validateRegisterForm = () => {
    const currentErrors = {};
    const nameRegex = /^[A-Za-zÀ-ÿ\s'-]+$/;
    const phoneRegex = /^\+?[0-9\s-]{10,15}$/;

    if (!nameRegex.test(form.firstName.trim())) currentErrors.firstName = 'Valid first name required.';
    if (!nameRegex.test(form.lastName.trim())) currentErrors.lastName = 'Valid last name required.';
    if (!phoneRegex.test(form.phone.trim())) currentErrors.phone = 'Valid phone number required (10-15 digits).';
    if (form.password.length < 8) currentErrors.password = 'Must be at least 8 characters.';
    if (form.password !== form.confirmPassword) currentErrors.confirmPassword = 'Passwords do not match.';
    if (!form.gender) currentErrors.gender = 'Gender selection required.';
    if (!form.schoolId.trim()) currentErrors.schoolId = 'School ID required.';
    
    if (!form.schoolMail.trim()) {
      currentErrors.schoolMail = 'School email required.';
    } else if (!form.schoolMail.trim().toLowerCase().endsWith('@regent.edu.gh')) {
      currentErrors.schoolMail = 'Registration requires an official @regent.edu.gh email.';
    }

    setErrors(currentErrors);
    return Object.keys(currentErrors).length === 0;
  };

  const handleRegister = async () => {
    setMessage('');
    if (!validateRegisterForm()) {
      setMessage('Please correct the validation errors in the form.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender,
        schoolId: form.schoolId.trim(),
        schoolMail: form.schoolMail.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        verificationMode,
      });

      if (data.verificationPending) {
        localStorage.setItem('pendingIdentifier', form.schoolMail.trim().toLowerCase());
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
    const currentErrors = {};

    if (!form.identifier.trim()) {
      currentErrors.identifier = 'Email or phone number is required.';
    }
    if (!form.password) {
      currentErrors.password = 'Password is required.';
    }

    if (Object.keys(currentErrors).length > 0) {
      setErrors(currentErrors);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        identifier: form.identifier.trim().toLowerCase(),
        password: form.password,
      });
      onSignIn(data.token, data.user);
    } catch (error) {
      const response = error.response?.data;
      if (response?.needsVerification) {
        localStorage.setItem('pendingIdentifier', form.identifier.trim().toLowerCase());
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
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-8 sm:px-6">
      <section className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-sm border border-slate-200 space-y-6">
        
        <header className="flex flex-col items-center justify-center text-center">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-base tracking-tight">
              RN
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Regent Nexus</h1>
          </div>
          <p className="mt-2 text-sm text-slate-500">Login or register your account to continue.</p>
        </header>

        <nav className="flex justify-center gap-2 border-b border-slate-100 pb-4">
          {['login', 'register'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rounded-full px-6 py-2 text-sm font-semibold transition-all ${
                mode === tab ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              onClick={() => {
                setMode(tab);
                setMessage('');
                setErrors({});
              }}
            >
              {tab === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </nav>

        {mode === 'register' ? (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">First Name</span>
                <input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:bg-white transition ${errors.firstName ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-900'}`} placeholder="Rooney" />
                {errors.firstName && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.firstName}</p>}
              </label>
              
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Last Name</span>
                <input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:bg-white transition ${errors.lastName ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-900'}`} placeholder="Uwho Victor" />
                {errors.lastName && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.lastName}</p>}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <span className="text-sm font-medium text-slate-700 block">Gender</span>
                <select 
                  value={form.gender} 
                  onChange={e => setField('gender', e.target.value)}
                  className={`mt-2 w-full px-4 py-3 rounded-2xl border bg-slate-50 text-slate-900 text-sm focus:outline-none focus:bg-white transition ${errors.gender ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-900'}`}
                >
                  <option value="">Select Gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.gender}</p>}
              </div>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">School ID</span>
                <input value={form.schoolId} onChange={(e) => setField('schoolId', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:bg-white transition ${errors.schoolId ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-900'}`} placeholder="00500122" />
                {errors.schoolId && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.schoolId}</p>}
              </label>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">School Email</span>
                <input type="email" value={form.schoolMail} onChange={(e) => setField('schoolMail', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:bg-white transition ${errors.schoolMail ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-900'}`} placeholder="rooney.uwho@regent.edu.gh" />
                {errors.schoolMail && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.schoolMail}</p>}
              </label>
              
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Phone</span>
                <input type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:bg-white transition ${errors.phone ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-900'}`} placeholder="+233530282249" />
                {errors.phone && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.phone}</p>}
              </label>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <div className="relative mt-2">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setField('password', e.target.value)} className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:bg-white transition pr-12 ${errors.password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-900'}`} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.password}</p>}
              </label>
              
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Confirm Password</span>
                <div className="relative mt-2">
                  <input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:bg-white transition pr-12 ${errors.confirmPassword ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-900'}`} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.confirmPassword}</p>}
              </label>
            </div>
            
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">Verification Mode</span>
              <div className="grid gap-2 sm:grid-cols-3">
                {['email', 'sms', 'admin'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${verificationMode === option ? 'border-slate-900 bg-slate-900 text-white shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100'}`}
                    onClick={() => setVerificationMode(option)}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            <button type="button" onClick={handleRegister} disabled={loading} className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-white font-semibold shadow-sm transition hover:bg-slate-800 disabled:opacity-60">
              {loading ? 'Registering…' : 'Register'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email or Phone</span>
              <input 
                value={form.identifier} 
                onChange={(e) => setField('identifier', e.target.value)} 
                className={`mt-2 w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:bg-white transition ${errors.identifier ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-900'}`} 
                placeholder="rooney.uwho@regent.edu.gh" 
              />
              {errors.identifier && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.identifier}</p>}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <div className="relative mt-2">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={form.password} 
                  onChange={(e) => setField('password', e.target.value)} 
                  className={`w-full rounded-2xl border bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:bg-white transition pr-12 ${errors.password ? 'border-rose-400 focus:border-rose-500' : 'border-slate-200 focus:border-slate-900'}`} 
                  placeholder="••••••••" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs font-medium text-rose-600">{errors.password}</p>}
            </label>

            <button type="button" onClick={handleLogin} disabled={loading} className="w-full rounded-2xl bg-slate-900 px-5 py-3.5 text-white font-semibold shadow-sm transition hover:bg-slate-800 disabled:opacity-60">
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </div>
        )}

        {message && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-700 border border-rose-100">{message}</p>}
      </section>
    </main>
  );
}
