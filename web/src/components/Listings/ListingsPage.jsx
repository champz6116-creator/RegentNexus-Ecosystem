import { useEffect, useState } from 'react';
import { Upload, X, Edit2, Trash2 } from 'lucide-react';
import { uploadListingImage } from '../../utils/cloudinary';
import api from '../../api';

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: '', type: 'item', note: '', price: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Editing UI Layer States
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', price: '', description: '', category: '', type: 'item', note: '' });

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!form.title || !form.description || !form.price || !form.category) {
      setMessage('Title, Description, Category, and Price parameters are completely required.');
      return;
    }
    if (form.type === 'item' && !imageFile) {
      setMessage('Ecosystem Guidelines Enforced: Item Listings must include an image upload payload.');
      return;
    }

    setLoading(true);
    try {
      let finalImageUrl = '';
      if (form.type === 'item' && imageFile) {
        finalImageUrl = await uploadListingImage(imageFile);
      }

      await api.post('/listings', {
        ...form,
        price: Number(form.price) || 0,
        imageUrl: finalImageUrl
      });

      setMessage('Listing published onto active network registry node successfully.');
      setForm({ title: '', description: '', category: '', type: 'item', note: '', price: '' });
      setImageFile(null);
      setImagePreview('');
      fetchListings();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Transaction submission error encountered.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to drop this listing node?')) return;
    setLoading(true);
    try {
      await api.delete(`/listings/${id}`);
      setMessage('Listing removed.');
      if (editingId === id) setEditingId(null);
      fetchListings();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to remove listing');
    } finally {
      setLoading(false);
    }
  };

  // Mount targeted object properties to editing subsystem
  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      title: item.title,
      price: item.price,
      description: item.description || '',
      category: item.category || '',
      type: item.type || 'item',
      note: item.note || ''
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/listings/${editingId}`, {
        ...editForm,
        price: Number(editForm.price) || 0
      });
      setMessage('Listing configuration state modified successfully.');
      setEditingId(null);
      fetchListings();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Mutation tracking update handshake rejected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="space-y-6 max-w-2xl mx-auto p-2">
      {/* Creation Pane */}
      <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Marketplace Listing</h2>
        
        {message && <div className="p-4 text-sm font-medium rounded-2xl bg-slate-100 text-slate-800 mb-4">{message}</div>}

        <form onSubmit={handlePublish} className="space-y-5">
          <div className="flex gap-4">
            {['item', 'service'].map((t) => (
              <label key={t} className="flex-1 text-center p-3 rounded-2xl border cursor-pointer capitalize font-semibold transition bg-slate-50 border-slate-200 select-none">
                <input type="radio" name="type" checked={form.type === t} onChange={() => setForm({...form, type: t})} className="sr-only" />
                <span className={form.type === t ? 'text-emerald-600 block scale-105' : 'text-slate-400 block'}>{t}</span>
              </label>
            ))}
          </div>

          {form.type === 'item' && (
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold tracking-widest text-slate-400">Product Photography (Mandatory)</span>
              <div className="relative border-2 border-dashed border-slate-200 rounded-3xl p-6 text-center hover:bg-slate-50/50 transition flex flex-col items-center justify-center min-h-[160px]">
                {imagePreview ? (
                  <div className="relative w-full max-h-[200px] overflow-hidden rounded-2xl">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }} className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-black">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload size={32} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Select product imagery payload file</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Listing Title</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-slate-900 text-sm" placeholder="MacBook, Tutoring service..." />
            </div>
            <div>
              <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Price (GHS)</label>
              <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-slate-900 text-sm" placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Category Domain</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-slate-900 text-sm bg-white">
              <option value="">Choose category block...</option>
              <option value="electronics">Electronics</option>
              <option value="academics">Academic Assistance</option>
              <option value="housing">Hostel & Housing</option>
              <option value="food">Food & Catering</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Detailed Operational Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-slate-900 text-sm resize-none" placeholder="Provide system descriptors..." />
          </div>

          <div>
            <label className="text-xs uppercase font-bold text-slate-400 block mb-1">Brief Platform Reference Note (Optional)</label>
            <input type="text" value={form.note} onChange={e => setForm({...form, note: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-slate-900 text-sm" placeholder="e.g., Pick up at library courtyard before 4 PM" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition text-sm disabled:opacity-50">
            {loading ? 'Processing & Broadcasting Assets...' : 'Publish Workspace Listing'}
          </button>
        </form>
      </section>

      {/* NEW: Re-engineered Management Workspace Area */}
      <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900 mb-5">My Store Workspace</h2>
        <div className="space-y-4">
          {listings.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No active registry nodes found for your profile.</p>
          ) : (
            listings.map((item) => (
              <article key={item._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all">
                {editingId === item._id ? (
                  /* Dynamic Inline Configuration Subform */
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input 
                        type="text" 
                        value={editForm.title} 
                        onChange={e => setEditForm({...editForm, title: e.target.value})} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-900"
                        placeholder="Update Title"
                      />
                      <input 
                        type="number" 
                        value={editForm.price} 
                        onChange={e => setEditForm({...editForm, price: e.target.value})} 
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-slate-900"
                        placeholder="Update Price"
                      />
                    </div>
                    <textarea 
                      rows={2}
                      value={editForm.description} 
                      onChange={e => setEditForm({...editForm, description: e.target.value})} 
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-600 focus:outline-none focus:border-slate-900 resize-none"
                      placeholder="Update Description..."
                    />
                    <div className="flex gap-2 justify-end">
                      <button 
                        type="button" 
                        onClick={() => setEditingId(null)} 
                        className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-500 font-bold text-xs hover:bg-slate-100"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Standard Operational Listing View Block */
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.title} className="w-12 h-12 object-cover rounded-xl border border-slate-200 bg-white" />
                        )}
                        <div>
                          <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                            {item.type} • {item.category}
                          </p>
                        </div>
                      </div>

                      {/* Side-by-Side Control Actions Module */}
                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button 
                          onClick={() => startEdit(item)}
                          className="p-2.5 bg-white rounded-xl border border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900 transition flex items-center justify-center shadow-sm"
                          title="Modify Listing parameters"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={() => handleRemove(item._id)} 
                          className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl border border-rose-100 transition flex items-center justify-center shadow-sm"
                          title="Drop Listing node"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{item.description || item.note}</p>
                    <p className="mt-2 text-sm font-bold text-emerald-600">GHS {Number(item.price).toFixed(2)}</p>
                  </>
                )}
              </article>
            ))
          )}
        </div>
      </section>
    </article>
  );
}
