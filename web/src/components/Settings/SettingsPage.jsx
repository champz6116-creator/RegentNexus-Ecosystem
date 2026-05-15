import { useState } from 'react';
import Modal from '../Common/Modal';
import api from '../../api';

export default function SettingsPage({ user, onUpdate }) {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [form, setForm] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
  });
  const [loading, setLoading] = useState(false);

  const handleToggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { data } = await api.put(`/users/${user._id}`, form);
      onUpdate?.(data);
      setShowProfileModal(false);
    } catch (error) {
      console.error('Failed to update profile', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete(`/users/${user._id}`);
      // Redirect to login
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete account', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Profile</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            ['Name', `${user.firstName} ${user.lastName}`],
            ['School ID', user.schoolId],
            ['Email', user.schoolMail],
            ['Phone', user.phone],
            ['Role', user.role],
            ['Verified', user.verified ? '✅ Yes' : '❌ No'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
              <p className="mt-2 text-slate-900">{value}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowProfileModal(true)}
          className="mt-6 rounded-3xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700"
        >
          Edit Profile
        </button>
      </section>

      {/* Preferences */}
      <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Preferences</h2>
        <div className="mt-5 space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-medium text-slate-700">Dark Mode</span>
            <button
              onClick={handleToggleDarkMode}
              className={`relative h-8 w-14 rounded-full transition ${darkMode ? 'bg-slate-900' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 h-6 w-6 rounded-full bg-white transition transform ${darkMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <span className="font-medium text-slate-700">Notifications</span>
            <input type="checkbox" className="h-6 w-6" defaultChecked />
          </label>
        </div>
      </section>

      {/* Help & Support */}
      {user.role === 'admin' && (
        <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Admin</h2>
          <button className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 px-6 py-3 font-semibold transition hover:bg-slate-100">
            📚 Help Center
          </button>
        </section>
      )}

      {/* Account Deletion */}
      <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Account</h2>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="mt-4 rounded-3xl border border-rose-300 bg-rose-50 px-6 py-3 font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          🗑️ Delete Account
        </button>
      </section>

      {/* Profile Modal */}
      <Modal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} title="Edit Profile">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">First Name</span>
            <input
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Last Name</span>
            <input
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Phone</span>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
            />
          </label>
          <button
            onClick={handleSaveProfile}
            disabled={loading}
            className="w-full rounded-3xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
        <div className="space-y-4">
          <p className="text-slate-700">
            Are you sure you want to delete your account? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 rounded-3xl border border-slate-200 px-4 py-3 font-semibold transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="flex-1 rounded-3xl bg-rose-600 px-4 py-3 font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
