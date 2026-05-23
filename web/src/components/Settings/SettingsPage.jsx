import { useState } from 'react';
import Modal from '../Common/Modal';
import StandardTextInput from '../Common/StandardTextInput';
import { Eye, EyeOff, Camera } from 'lucide-react';
import api from '../../api';

export default function SettingsPage({ user, onUpdate }) {
  // Field Modal States
  const [activeModalField, setActiveModalField] = useState(null); // 'firstName', 'lastName', 'schoolId', etc.
  const [modalInputValue, setModalInputValue] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Profile Photo Upload Engine State
  const [uploadingImage, setUploadingImage] = useState(false);

  // Preference Preferences State
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  // Password Security Gate Logic State
  const [verifiedForPasswordChange, setVerifiedForPasswordChange] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [requestedCode, setRequestedCode] = useState(false);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);

  // Dark Mode Handlers
  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  // Open Individual Focused Input Modals
  const openEditModal = (field, currentVal) => {
    setActiveModalField(field);
    setModalInputValue(currentVal || '');
  };

  // Process Singular Profile Metadata Mutations
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

      const { data } = await api.put(`/users/${user._id}`, payload);
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

  // NEW: Web Profile Photo Gallery Picker Engine
  const handlePickImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict image format verification check
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file framework.');
      return;
    }

    setUploadingImage(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'regent_nexus_preset'); // Cloudinary identifier node

    try {
      // Direct asset transfer to storage provider
      const response = await fetch('https://api.cloudinary.com/v1_1/your-cloud-name/image/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Cloudinary deployment handshake rejected.');
      const data = await response.json();

      // Patch database profiles with secure cloud resource url location
      const { data: updatedData } = await api.put(`/users/${user._id}`, {
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
      alert('Security token has been dispatched to your school mail handle.');
    } catch {
      alert('Could not dispatch verification tracking frame.');
    }
  };

  const verifyTokenHandler = async () => {
    try {
      await api.post('/auth/verify-password-otp', { email: user.schoolMail, code: verificationCode });
      setVerifiedForPasswordChange(true);
    } catch {
      alert('Token declaration rejected. Security execution suspended.');
    }
  };

  const executePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) return alert('Input credentials mismatch.');
    try {
      await api.post(`/users/${user._id}/password`, { password: passwords.new });
      alert('Authentication passphrase restructured successfully.');
      setVerifiedForPasswordChange(false);
      setRequestedCode(false);
      setVerificationCode('');
      setPasswords({ new: '', confirm: '' });
    } catch {
      alert('Could not synchronize new password declaration.');
    }
  };

  // Account Destruction Processing Node
  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete(`/users/${user._id}`);
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete account', error);
      alert('Account termination handshake dropped.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = () => {
    return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <main className="max-w-4xl mx-auto p-2 space-y-6">
      {/* Dynamic System Message Banner Node */}
      {message && (
        <div className="p-4 text-sm font-medium rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100">
          {message}
        </div>
      )}

      {/* Large Avatar Architecture Overview Panel */}
      <section className="flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-3xl text-center shadow-sm">
        
        {/* NEW: Interactive Upload Media Trigger Node Container */}
        <div className="relative group mb-3">
          <label className={`relative block w-24 h-24 rounded-full overflow-hidden shadow-md border-4 border-white tracking-wider cursor-pointer transition ${uploadingImage ? 'opacity-60 pointer-events-none' : 'hover:brightness-90'}`}>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handlePickImageFile} 
              disabled={uploadingImage}
            />
            
            {user.profilePicture ? (
              <img 
                src={user.profilePicture} 
                alt="Profile Avatar Layout" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-900 text-white flex items-center justify-center font-bold text-3xl">
                {getInitials()}
              </div>
            )}

            {/* Hover overlay indicator template layout block */}
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
              <Camera size={18} className="text-white" />
              <span className="text-[9px] text-white font-bold mt-1 uppercase tracking-wider">
                {uploadingImage ? 'Loading...' : 'Change'}
              </span>
            </div>
          </label>
        </div>

        <h2 className="text-xl font-bold text-slate-900">{user.firstName} {user.lastName}</h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5 uppercase tracking-widest">
          {user.role} profile node • {user.verified ? 'Verified Active' : 'Unverified State'}
        </p>
      </section>

      {/* Grid Profile Specifications Matrices Elements */}
      <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Account Parameters Matrix</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['First Name', user.firstName, 'firstName'],
            ['Last Name', user.lastName, 'lastName'],
            ['School ID Reference', user.schoolId, 'schoolId'],
            ['Academic Communication Node', user.schoolMail, 'schoolMail'],
            ['Contact Line Reference', user.phone, 'phone'],
            ['Gender Identity Mapping', user.gender || 'Not Selected', 'gender'],
          ].map(([label, value, fieldKey]) => (
            <article key={label} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center gap-2">
              <div className="overflow-hidden">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block">{label}</span>
                <span className="text-sm font-semibold text-slate-900 mt-1 block truncate">{value}</span>
              </div>
              <button 
                onClick={() => openEditModal(fieldKey, user[fieldKey])} 
                className="text-xs px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-slate-900 font-medium transition shrink-0"
              >
                Modify
              </button>
            </article>
          ))}
        </div>
      </section>

      {/* App Functional Preferences */}
      <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900">System Preferences</h3>
        <div className="space-y-4 max-w-md">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-semibold text-slate-700">Dark Interface View</span>
            <button
              onClick={handleToggleDarkMode}
              className={`relative h-8 w-14 rounded-full transition ${darkMode ? 'bg-slate-900' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 h-6 w-6 rounded-full bg-white transition transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-semibold text-slate-700">Push Notification Protocols</span>
            <input type="checkbox" className="h-5 w-5 rounded-lg border-slate-300 accent-slate-900" defaultChecked />
          </label>
        </div>
      </section>

      {/* Structured Verification Gateway Box */}
      <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Protected Cryptographic Passphrase Area</h3>
        {!requestedCode ? (
          <button onClick={requestVerificationToken} className="px-5 py-3 rounded-2xl bg-slate-100 text-slate-800 font-semibold text-sm hover:bg-slate-200 transition">
            Initialize Security Checkpoint Verification Loop
          </button>
        ) : !verifiedForPasswordChange ? (
          <div className="flex gap-2 max-w-md">
            <input type="text" placeholder="Enter OTP Token" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="flex-1 px-4 py-3 border border-slate-200 rounded-2xl text-sm" />
            <button onClick={verifyTokenHandler} className="px-5 py-3 rounded-2xl bg-slate-900 text-white font-semibold text-sm">Verify Token</button>
          </div>
        ) : (
          <div className="space-y-3 max-w-sm">
            <div className="relative">
              <input type={showPass ? 'text' : 'password'} placeholder="New Passphrase" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-3.5 text-slate-400">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <input type="password" placeholder="Confirm Passphrase" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm" />
            <button onClick={executePasswordChange} className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition">
              Commit Passphrase Restructuring
            </button>
          </div>
        )}
      </section>

      {/* Help & Support Admin Node Block */}
      {user.role === 'admin' && (
        <section className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Administrative Utilities</h3>
          <button className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 font-semibold text-sm transition hover:bg-slate-100">
            📚 Help Center Console
          </button>
        </section>
      )}

      {/* Risk-Mitigation Account Disruption Area */}
      <section className="bg-white border border-rose-100 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-rose-900">Danger Zone</h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Account deletion triggers complete and absolute cascade drops of your profile nodes across the RegentNexus marketplace topology.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="rounded-2xl border border-rose-300 bg-rose-50 px-5 py-3 font-semibold text-sm text-rose-700 transition hover:bg-rose-100"
        >
          🗑️ Terminate Profile Node Account
        </button>
      </section>

      {/* The Small, Focused Modal Selector Core Hook Override */}
      <Modal isOpen={activeModalField !== null} onClose={() => setActiveModalField(null)} title={`Modify ${activeModalField}`}>
        <div className="space-y-4 pt-2">
          {activeModalField === 'gender' ? (
            <select value={modalInputValue} onChange={e => setModalInputValue(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none">
              <option value="">Choose gender context...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          ) : (
            <input type="text" value={modalInputValue} onChange={e => setModalInputValue(e.target.value)} className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-slate-900" placeholder="Provide payload updates..." />
          )}
          <div className="flex gap-2 justify-end">
            <button onClick={() => setActiveModalField(null)} className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800">Cancel</button>
            <button onClick={handleUpdateField} disabled={loading} className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition disabled:opacity-50">OK</button>
          </div>
        </div>
      </Modal>

      {/* Destructive Account Disruption Modal Anchor */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Confirm Account Deletion">
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-600 leading-relaxed">
            Are you completely sure you want to delete your profile node? This operation breaks data states permanently across active registries.
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Processing Drop...' : 'Confirm Drop'}
            </button>
          </div>
        </div>
      </Modal>
    </main>
  );
}
