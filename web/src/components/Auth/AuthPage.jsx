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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      {/* Expanded to max-w-2xl and upgraded to p-8 padding for low cognitive load and spacing balance */}
      <section className="w-full max-w-md sm:max-w-xl md:max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/40 border border-slate-100 space-y-8">
        
        <header className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-white font-black text-xl tracking-tight shadow-md shadow-amber-500/20">
              RN
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">Portal Gateway</h1>
          </div>
          <p className="text-sm text-slate-500 max-w-sm leading-relaxed">Secure identity gateway for student commerce and services</p>
        </header>

        {/* Spacious touch-target selector navigation tabs */}
        <nav className="grid grid-cols-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/40">
          {['login', 'register'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`rounded-xl py-2.5 text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 ${
                mode === tab 
                  ? 'bg-white text-slate-950 shadow-sm border border-slate-200/60' 
                  : 'text-slate-500 hover:text-slate-950'
              }`}
              onClick={() => {
                setMode(tab);
                setMessage('');
                setErrors({});
              }}
            >
              {tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </nav>

        {mode === 'register' ? (
          <div className="space-y-6 animate-fade-in">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide block ml-0.5">First Name</span>
                <input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition duration-150 focus:bg-white focus:shadow-sm ${errors.firstName ? 'border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5' : 'border-slate-200 focus:border-amber-500'}`} placeholder="Rooney" />
                {errors.firstName && <p className="mt-1.5 text-xs font-semibold text-rose-600 ml-1">{errors.firstName}</p>}
              </label>
              
              <label className="block">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide block ml-0.5">Last Name</span>
                <input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition duration-150 focus:bg-white focus:shadow-sm ${errors.lastName ? 'border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5' : 'border-slate-200 focus:border-amber-500'}`} placeholder="Uwho Victor" />
                {errors.lastName && <p className="mt-1.5 text-xs font-semibold text-rose-600 ml-1">{errors.lastName}</p>}
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="block">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide block ml-0.5">Gender</span>
                <select 
                  value={form.gender} 
                  onChange={e => setField('gender', e.target.value)}
                  className={`mt-2 w-full px-4 py-3 rounded-2xl border bg-slate-50/50 text-slate-900 text-sm focus:outline-none transition duration-150 focus:bg-white focus:shadow-sm ${errors.gender ? 'border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5' : 'border-slate-200 focus:border-amber-500'}`}
                >
                  <option value="">Select Gender...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                {errors.gender && <p className="mt-1.5 text-xs font-semibold text-rose-600 ml-1">{errors.gender}</p>}
              </div>

              <label className="block">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide block ml-0.5">School ID Required</span>
                <input value={form.schoolId} onChange={(e) => setField('schoolId', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition duration-150 focus:bg-white focus:shadow-sm ${errors.schoolId ? 'border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5' : 'border-slate-200 focus:border-amber-500'}`} placeholder="00500122" />
                {errors.schoolId && <p className="mt-1.5 text-xs font-semibold text-rose-600 ml-1">{errors.schoolId}</p>}
              </label>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide block ml-0.5">School Email Address</span>
                <input type="email" value={form.schoolMail} onChange={(e) => setField('schoolMail', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition duration-150 focus:bg-white focus:shadow-sm ${errors.schoolMail ? 'border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5' : 'border-slate-200 focus:border-amber-500'}`} placeholder="rooney.uwho@regent.edu.gh" />
                {errors.schoolMail && <p className="mt-1.5 text-xs font-semibold text-rose-600 ml-1">{errors.schoolMail}</p>}
              </label>
              
              <label className="block">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide block ml-0.5">Phone Number</span>
                <input type="tel" value={form.phone} onChange={(e) => setField('phone', e.target.value)} className={`mt-2 w-full rounded-2xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition duration-150 focus:bg-white focus:shadow-sm ${errors.phone ? 'border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5' : 'border-slate-200 focus:border-amber-500'}`} placeholder="+233530282249" />
                {errors.phone && <p className="mt-1.5 text-xs font-semibold text-rose-600 ml-1">{errors.phone}</p>}
              </label>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide block ml-0.5">Security Password</span>
                <div className="relative mt-2">
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setField('password', e.target.value)} className={`w-full rounded-2xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition duration-150 pr-10 focus:bg-white focus:shadow-sm ${errors.password ? 'border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5' : 'border-slate-200 focus:border-amber-500'}`} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="mt-1.5 text-xs font-semibold text-rose-600 ml-1">{errors.password}</p>}
              </label>
              
              <label className="block">
                <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide block ml-0.5">Confirm Password</span>
                <div className="relative mt-2">
                  <input type={showConfirmPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={(e) => setField('confirmPassword', e.target.value)} className={`w-full rounded-2xl border bg-slate-50/50 px-4 py-3 text-sm text-slate-900 outline-none transition duration-150 pr-10 focus:bg-white focus:shadow-sm ${errors.confirmPassword ? 'border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5' : 'border-slate-200 focus:border-amber-500'}`} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConfirmPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1.5 text-xs font-semibold text-rose-600 ml-1">{errors.confirmPassword}</p>}
              </label>
            </div>
            
            <div className="space-y-2 pt-1">
              <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider ml-0.5">Verification Channel</span>
              <div className="grid gap-3 grid-cols-3">
                {['email', 'sms', 'admin'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`rounded-xl border py-3 text-xs font-bold tracking-wide transition-all duration-150 ${
                      verificationMode === option 
                        ? 'border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/10' 
                        : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100 focus:bg-white'
                    }`}
                    onClick={() => setVerificationMode(option)}
                  >
                    {option.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            
            <button type="button" onClick={handleRegister} disabled={loading} className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-base font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-60 mt-4">
              {loading ? 'Creating Account…' : 'Register Account'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in max-w-md mx-auto w-full">
            <label className="block">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide block ml-0.5">Email or Phone</span>
              <input 
                value={form.identifier} 
                onChange={(e) => setField('identifier', e.target.value)} 
                className={`mt-2 w-full rounded-2xl border bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition duration-150 focus:bg-white focus:shadow-sm ${errors.identifier ? 'border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5' : 'border-slate-200 focus:border-amber-500'}`} 
                placeholder="rooney.uwho@regent.edu.gh" 
              />
              {errors.identifier && <p className="mt-1.5 text-xs font-semibold text-rose-600 ml-1">{errors.identifier}</p>}
            </label>

            <label className="block">
              <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-wide block ml-0.5">Password</span>
              <div className="relative mt-2">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={form.password} 
                  onChange={(e) => setField('password', e.target.value)} 
                  className={`w-full rounded-2xl border bg-slate-50/50 px-4 py-3.5 text-sm text-slate-900 outline-none transition duration-150 pr-10 focus:bg-white focus:shadow-sm ${errors.password ? 'border-rose-400 bg-rose-50/10 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/5' : 'border-slate-200 focus:border-amber-500'}`} 
                  placeholder="••••••••" 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs font-semibold text-rose-600 ml-1">{errors.password}</p>}
            </label>

            <button type="button" onClick={handleLogin} disabled={loading} className="w-full rounded-2xl bg-slate-900 px-5 py-4 text-base font-semibold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-60 mt-4">
              {loading ? 'Verifying Session…' : 'Sign In'}
            </button>
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