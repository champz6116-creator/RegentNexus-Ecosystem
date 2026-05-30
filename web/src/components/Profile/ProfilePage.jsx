import React, { useState } from 'react';
import { User, Phone, Save, Edit2, X, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import api from '../../api';

export default function ProfilePage({ user: initialUser }) {
  const [user, setUser] = useState(initialUser || {});
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    gender: user.gender || ''
  });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      phone: user.phone || '',
      gender: user.gender || ''
    });
    setIsEditing(false);
    setStatus({ type: '', message: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const { data } = await api.put('/users/profile/update', formData);
      
      // Update local state with returned sanitized user profile fields
      setUser(prev => ({
        ...prev,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        phone: data.user.phone,
        gender: data.user.gender
      }));
      
      setStatus({ type: 'success', message: data.message });
      setIsEditing(false);
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Field compilation update transmission failed.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-xs border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Header Panel Layout */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Campus Profile</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Manage your RegentNexus account parameters safely.</p>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
          >
            <Edit2 size={13} />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {/* Action Notification Strip */}
      {status.message && (
        <div className={`mb-5 p-4 rounded-2xl flex items-center space-x-2 text-sm font-bold border ${
          status.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400' 
            : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400'
        }`}>
          {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          <span>{status.message}</span>
        </div>
      )}

      {isEditing ? (
        /* DYNAMIC FORM LAYER */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1">First Name</label>
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 focus-within:border-emerald-500">
                <User size={15} className="text-slate-400 mr-2" />
                <input 
                  type="text" name="firstName" value={formData.firstName} onChange={handleChange} required
                  className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-slate-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1">Last Name</label>
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 focus-within:border-emerald-500">
                <User size={15} className="text-slate-400 mr-2" />
                <input 
                  type="text" name="lastName" value={formData.lastName} onChange={handleChange} required
                  className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-slate-50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1">Contact Phone</label>
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 focus-within:border-emerald-500">
              <Phone size={15} className="text-slate-400 mr-2" />
              <input 
                type="text" name="phone" value={formData.phone} onChange={handleChange} required
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-900 dark:text-slate-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-slate-400 dark:text-slate-500 mb-1">Gender Identification</label>
            <select 
              name="gender" value={formData.gender} onChange={handleChange} required
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 outline-none text-sm font-bold text-slate-900 dark:text-slate-50 focus:border-emerald-500"
            >
              <option value="">Select Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>

          {/* Form Action Panel Control Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button" onClick={handleCancel} disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
            <button
              type="submit" disabled={loading}
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
            >
              <Save size={14} />
              <span>{loading ? 'Saving Changes...' : 'Save Updates'}</span>
            </button>
          </div>
        </form>
      ) : (
        /* READ-ONLY DISPLAY GRID LAYOUT (Maintains your structure but fixes dark mode) */
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['Full Name', `${user.firstName || ''} ${user.lastName || ''}`],
            ['School ID', user.schoolId || 'N/A'],
            ['Institutional Email', user.schoolMail || 'N/A'],
            ['Phone Number', user.phone || 'N/A'],
            ['Gender Block', user.gender || 'Not specified'],
            ['Network Ecosystem Role', user.role || 'student'],
          ].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">{label}</p>
              <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-50">{value}</p>
            </article>
          ))}
          
          <article className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 sm:col-span-2 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Security Verification Check</p>
              <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-50">
                {user.verified ? 'Active Campus Credential Verified Node' : 'Verification Under Review'}
              </p>
            </div>
            <Shield className={user.verified ? 'text-emerald-500' : 'text-amber-500'} size={22} />
          </article>
        </div>
      )}
    </section>
  );
}
