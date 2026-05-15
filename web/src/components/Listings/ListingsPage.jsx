import { useEffect, useState } from 'react';
import api from '../../api';

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: '', type: 'item', note: '', price: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/listings?mine=true');
      setListings(data);
    } catch (error) {
      console.error('Fetch listings failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handlePublish = async () => {
    setMessage('');
    if (!form.title || !form.description || !form.price) {
      setMessage('Title, description, and price are required.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/listings', { ...form, price: Number(form.price) || 0 });
      setMessage('Listing published successfully.');
      setForm({ title: '', description: '', category: '', type: 'item', note: '', price: '' });
      fetchListings();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to publish listing');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    setLoading(true);
    try {
      await api.delete(`/listings/${id}`);
      setMessage('Listing removed.');
      fetchListings();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to remove listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="space-y-6">
      <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Create Listing</h2>
        <div className="mt-5 grid gap-4">
          {['title', 'description', 'category', 'note', 'price'].map((field) => (
            <label key={field} className="block">
              <span className="text-sm font-medium text-slate-700">{field.charAt(0).toUpperCase() + field.slice(1)}</span>
              <input
                value={form[field]}
                onChange={(e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900"
                placeholder={field === 'title' ? 'Listing title' : field === 'price' ? '0.00' : `Enter ${field}`}
                type={field === 'price' ? 'number' : 'text'}
              />
            </label>
          ))}
          <div className="grid gap-2 sm:grid-cols-2">
            {['item', 'service'].map((type) => (
              <button
                key={type}
                type="button"
                className={`rounded-3xl border px-4 py-3 text-sm font-semibold ${form.type === type ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-slate-50 text-slate-800'}`}
                onClick={() => setForm((prev) => ({ ...prev, type }))}
              >
                {type}
              </button>
            ))}
          </div>
          <button onClick={handlePublish} disabled={loading} className="w-full rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60">
            {loading ? 'Publishing…' : 'Publish Listing'}
          </button>
          {message && <p className="rounded-3xl bg-slate-100 px-4 py-3 text-sm text-slate-900">{message}</p>}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">My Listings</h2>
        <div className="mt-5 space-y-4">
          {listings.map((item) => (
            <article key={item._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.category} • {item.type}</p>
                </div>
                <button onClick={() => handleRemove(item._id)} className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-600">
                  Remove
                </button>
              </div>
              <p className="mt-3 text-slate-700">{item.description || item.note}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">GHS {item.price.toFixed(2)}</p>
            </article>
          ))}
        </div>
      </section>
    </article>
  );
}
