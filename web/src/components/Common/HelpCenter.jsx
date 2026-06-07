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
      alert('Please fill in all fields before sending.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/help', form);
      setSubmitted(true);
      setForm({ subject: '', message: '', category: 'other' });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      alert('Could not submit help request. Please check your network connection.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Help Center</h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8">
        Have a question or running into an issue? Let us know and we will help you out.
      </p>

      {submitted && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="text-green-600 dark:text-green-400" />
          <p className="text-green-700 dark:text-green-300 font-medium">
            Thank you! Your request has been sent successfully.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-6 shadow-sm">
        {/* Category Setup */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm transition"
          >
            <option value="technical">Technical Issue</option>
            <option value="account">Account Help</option>
            <option value="transaction">Transaction Issue</option>
            <option value="listing">Listing Help</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Subject String */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Subject
          </label>
          <input
            type="text"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            placeholder="What issue are you experiencing?"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
          />
        </div>

        {/* Text Area Description */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
            Message Description
          </label>
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Provide as much detail as possible..."
            rows="5"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition resize-none"
          />
        </div>

        {/* Submit Execution Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white py-3.5 rounded-xl font-bold transition shadow-sm"
        >
          <Send size={16} />
          {loading ? 'Submitting request...' : 'Submit Help Request'}
        </button>
      </form>

      {/* Info Status Cards */}
      <div className="mt-8 p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/50 rounded-2xl">
        <h3 className="font-bold text-blue-900 dark:text-blue-300 text-sm mb-2">What to expect:</h3>
        <ul className="text-xs text-blue-800 dark:text-blue-400 space-y-1.5 font-medium">
          <li>• Our support team reviews requests within 24 hours</li>
          <li>• You will receive direct updates via your registered student account email</li>
          <li>• Always check your platform Notifications tab for ticket status changes</li>
        </ul>
      </div>
    </div>
  );
}
