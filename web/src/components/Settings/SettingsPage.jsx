import { useState } from 'react';
import Modal from '../Common/Modal';
import StandardTextInput from '../Common/StandardTextInput';
import { Camera, ShieldCheck, AlertCircle, CheckCircle, Moon, Settings, Trash2 } from 'lucide-react';
import api from '../../api';

export default function SettingsPage({ user, onUpdate }) {
  // Field Modal States
  const [activeModalField, setActiveModalField] = useState(null);
  const [modalInputValue, setModalInputValue] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Profile Photo Upload Engine State
  const [uploadingImage, setUploadingImage] = useState(false);

  // Preference States
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  // Password Security Gate Logic State (Upgraded Step-up Stack)
  const [requestedCode, setRequestedCode] = useState(false);
  const [verifiedForPasswordChange, setVerifiedForPasswordChange] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [securityStatus, setSecurityStatus] = useState({ type: '', message: '' });

  // Dark Mode Handlers
  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const openEditModal = (field, currentVal) => {
    setActiveModalField(field);
    setModalInputValue(currentVal || '');
  };

  // Process Profile Metadata Mutations
  const handleUpdateField = async () => {
    if (!modalInputValue.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const payload = {
        firstName: user.firstName,
        lastName: user.lastName,
        schoolId: user.schoolId,
        schoolMail: user.schoolMail,
        phone: user.phone,
        gender: user.gender || '',
        profilePicture: user.profilePicture || '',
        [activeModalField]: modalInputValue
      };

      const { data } = await api.put(`/users/${user._id || user.id}`, payload);
      if (onUpdate) onUpdate(data.user || data);
      setActiveModalField(null);
      setMessage('Account parameter updated successfully.');
    } catch (error) {
      console.error(error);
      alert('Field compilation update transmission failed.');
    } finally {
      setLoading(false);
    }
  };

  // Profile Photo Gallery Picker Engine
  const handlePickImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file framework.');
      return;
    }

    setUploadingImage(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'regent_nexus_preset');

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/your-cloud-name/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Cloudinary deployment handshake rejected.');
      const data = await response.json();

      const { data: updatedData } = await api.put(`/users/${user._id || user.id}`, {
        firstName: user.firstName,
        lastName: user.lastName,
        schoolId: user.schoolId,
        schoolMail: user.schoolMail,
        phone: user.phone,
        gender: user.gender || '',
        profilePicture: data.secure_url
      });

      if (onUpdate) onUpdate(updatedData.user || updatedData);
      setMessage('Profile avatar synchronized successfully.');
    } catch (err) {
      console.error(err);
      alert('Could not synchronize profile photo data updates.');
    } finally {
      setUploadingImage(false);
    }
  };

  // Password Security Cryptographic Lifecycle Actions
  const requestVerificationToken = async () => {
    try {
      await api.post('/auth/request-password-otp', { email: user.schoolMail });
      setRequestedCode(true);
      setSecurityStatus({ type: 'success', message: 'Security token dispatched to your school mail handle.' });
    } catch {
      setSecurityStatus({ type: 'error', message: 'Could not dispatch verification tracking frame.' });
    }
  };

  const verifyTokenHandler = async () => {
    try {
      await api.post('/auth/verify-password-otp', { email: user.schoolMail, code: verificationCode });
      setVerifiedForPasswordChange(true);
      setSecurityStatus({ type: 'success', message: 'Token identity verified. Proceed with configuration rewriting.' });
    } catch {
      setSecurityStatus({ type: 'error', message: 'Token declaration rejected. Security execution suspended.' });
    }
  };

  const executePasswordChange = async (e) => {
    if (e) e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setSecurityStatus({ type: 'error', message: 'Input credentials validation mismatch.' });
    }

    setLoading(true);
    setSecurityStatus({ type: '', message: '' });

    try {
      const { data } = await api.put('/users/profile/security/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      setSecurityStatus({ type: 'success', message: data.message || 'Authentication passphrase restructured successfully.' });
      setVerifiedForPasswordChange(false);
      setRequestedCode(false);
      setVerificationCode('');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setSecurityStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Could not synchronize new password declaration.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete(`/users/${user._id || user.id}`);
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete account', error);
      alert('Account termination handshake dropped.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-6 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {message && (
        <div className="p-4 text-xs font-bold rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle size={16} />
          <span>{message}</span>
        </div>
      )}

      {/* Profile Header Avatar Segment */}
      <section className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-center shadow-2xs">
        <div className="relative group mb-3">
          <label className={`relative block w-24 h-24 rounded-full overflow-hidden shadow-xs border-4 border-white dark:border-slate-800 tracking-wider cursor-pointer transition ${uploadingImage ? 'opacity-60 pointer-events-none' : 'hover:brightness-90'}`}>
            <input type="file" accept="image/*" className="hidden" onChange={handlePickImageFile} disabled={uploadingImage} />
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="Profile Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center font-bold text-2xl">
                {`${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
              <Camera size={18} className="text-white" />
              <span className="text-[9px] text-white font-bold mt-1 uppercase tracking-wider">{uploadingImage ? 'Loading...' : 'Change'}</span>
            </div>
          </label>
        </div>
        <h2 className="text-xl font-black">{user.firstName} {user.lastName}</h2>
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-0.5 uppercase tracking-widest">
          {user.role || 'Student'} Node • {user.verified ? 'Verified Active' : 'Unverified State'}
        </p>
      </section>

      {/* Parameter Fields Parameters Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-black flex items-center gap-2">
          <Settings size={18} className="text-emerald-600" />
          Account Parameters Matrix
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['First Name', user.firstName, 'firstName'],
            ['Last Name', user.lastName, 'lastName'],
            ['School ID Reference', user.schoolId, 'schoolId'],
            ['Academic Communication Node', user.schoolMail, 'schoolMail'],
            ['Contact Line Reference', user.phone, 'phone'],
            ['Gender Identity Mapping', user.gender || 'Not Selected', 'gender'],
          ].map(([label, value, fieldKey]) => (
            <article key={label} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800/60 flex justify-between items-center gap-2">
              <div className="overflow-hidden">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 block">{label}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-50 mt-1 block truncate">{value}</span>
              </div>
              <button onClick={() => openEditModal(fieldKey, user[fieldKey])} className="text-[11px] px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-900 dark:hover:border-slate-50 font-bold transition shrink-0">
                Modify
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* Dark View Preferences Interface */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-black flex items-center gap-2">
          <Moon size={18} className="text-emerald-600" />
          System Preferences
        </h3>
        <div className="space-y-4 max-w-md">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Dark Interface View</span>
            <button onClick={handleToggleDarkMode} className={`relative h-7 w-12 rounded-full transition ${darkMode ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-800'}`}>
              <div className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-xs transition transform ${darkMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </label>
        </div>
      </section>

      {/* Upgraded Protected Cryptographic Passphrase Area */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs space-y-4">
        <h3 className="text-base font-black flex items-center gap-2">
          <ShieldCheck className="text-emerald-600 dark:text-emerald-500" size={18} />
          Protected Cryptographic Passphrase Area
        </h3>

        {securityStatus.message && (
          <div className={`p-4 rounded-2xl flex items-center space-x-2 text-xs font-bold border ${
            securityStatus.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200' : 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200'
          }`}>
            <AlertCircle size={14} />
            <span>{securityStatus.message}</span>
          </div>
        )}

        {!requestedCode ? (
          <button onClick={requestVerificationToken} className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            Initialize Security Checkpoint Verification Loop
          </button>
        ) : !verifiedForPasswordChange ? (
          <div className="flex gap-2 max-w-md">
            <input type="text" placeholder="Enter OTP Token" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 outline-none focus:border-emerald-500" />
            <button onClick={verifyTokenHandler} className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-600 text-white font-bold text-xs transition">Verify Token</button>
          </div>
        ) : (
          <form onSubmit={executePasswordChange} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Current Password</label>
              <input type="password" required value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-50" />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">New Passphrase</label>
              <div className="relative flex items-center">
                <input type={showPass ? 'text' : 'password'} value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-50" required />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors focus:outline-hidden">
                  {showPass ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38.75.75 0 000-.536 10.048 10.048 0 00-11.16-6.73L3.28 2.22zM8.22 5.4a5.13 5.13 0 013.561 1.255L10.23 8.207a2.25 2.25 0 00-2.01 2.01L6.666 8.663A5.111 5.111 0 018.22 5.4z" clipRule="evenodd" />
                      <path d="M12.423 14.547a8.536 8.536 0 01-4.203.953A8.503 8.503 0 011 10c0-.687.082-1.354.238-1.996l2.155 2.156a3.75 3.75 0 004.49 4.49l2.54 2.541z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                      <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.18 10.051 10.051 0 0118.673 0 1.651 1.651 0 010 1.18 10.051 10.051 0 01-18.672 0zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Confirm New Passphrase</label>
              <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-950 outline-none focus:border-emerald-500 text-slate-900 dark:text-slate-50" required />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-2xs">
              {loading ? 'Processing Step-up Verification...' : 'Commit Passphrase Restructuring'}
            </button>
          </form>
        )}
      </section>

      {/* Danger Account Disruption Zone */}
      <section className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-950/40 rounded-3xl p-6 shadow-2xs space-y-3">
        <h3 className="text-base font-black text-rose-700 dark:text-rose-500 flex items-center gap-2">
          <Trash2 size={18} />
          Danger Zone
        </h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-bold leading-relaxed">Account deletion triggers complete and absolute cascade drops of your profile nodes across the market topology.</p>
        <button onClick={() => setShowDeleteModal(true)} className="rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/20 px-4 py-2 text-xs font-extrabold text-rose-700 dark:text-rose-400 transition hover:bg-rose-100 dark:hover:bg-rose-950/40">Terminate Profile Node Account</button>
      </section>

      {/* Global Context Specific Update Modal */}
      <Modal isOpen={activeModalField !== null} onClose={() => setActiveModalField(null)} title={`Modify ${activeModalField}`}>
        <div className="space-y-4 pt-2 dark:text-slate-100">
          {activeModalField === 'gender' ? (
            <select value={modalInputValue} onChange={e => setModalInputValue(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none">
              <option value="">Choose gender context...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          ) : (
            <input type="text" value={modalInputValue} onChange={e => setModalInputValue(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold outline-none" placeholder="Provide field data updates..." />
          )}
          <div className="flex gap-2 justify-end text-xs font-bold">
            <button onClick={() => setActiveModalField(null)} className="px-4 py-2 text-slate-400 hover:text-slate-600">Cancel</button>
            <button onClick={handleUpdateField} disabled={loading} className="px-4 py-2 text-white bg-slate-900 dark:bg-emerald-600 rounded-lg transition disabled:opacity-50">Confirm</button>
          </div>
        </div>
      </Modal>

      {/* Account Deletion Prompt Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Account Deletion">
        <div className="space-y-4 pt-2">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed">Are you completely sure you want to delete your profile node? This operation breaks data states permanently.</p>
          <div className="flex gap-3 justify-end text-xs font-bold">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-slate-400 hover:text-slate-600">Cancel</button>
            <button onClick={handleDeleteAccount} disabled={loading} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition disabled:opacity-50">Confirm Drop</button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
