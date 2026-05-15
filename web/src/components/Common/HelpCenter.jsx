import { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import api from '../../api';

export default function HelpCenter() {
  const [form, setForm] = useState({
    subject: '',
    message: '',
    category: 'other'
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/help', form);
      setSubmitted(true);
      setForm({ subject: '', message: '', category: 'other' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      alert('Failed to submit help request');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Help Center</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Need assistance? Submit your request below and our team will get back to you shortly.
      </p>

      {submitted && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
          <AlertCircle size={20} className="text-green-600" />
          <p className="text-green-700 dark:text-green-300">
            Thank you! Your help request has been submitted successfully.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white"
          >
            <option value="technical">Technical Issue</option>
            <option value="account">Account Help</option>
            <option value="transaction">Transaction Issue</option>
            <option value="listing">Listing Help</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="Brief subject of your issue"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Message
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Describe your issue in detail..."
            rows="6"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white py-3 rounded-lg font-semibold transition"
        >
          <Send size={18} />
          {loading ? 'Submitting...' : 'Submit Help Request'}
        </button>
      </form>

      {/* Info Box */}
      <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">What to expect:</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
          <li>• Our team reviews requests within 24 hours</li>
          <li>• You'll receive updates via your registered email</li>
          <li>• Check the Notifications tab for status updates</li>
        </ul>
      </div>
    </div>
  );
}
