import { useEffect, useState } from 'react';
import { Upload, X, Edit2, Trash2, Package, Sparkles } from 'lucide-react';
import { uploadListingImage } from '../../utils/cloudinary';
import api from '../../api';

export default function ListingsPage() {
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: '', type: 'item', note: '', price: '', quantity: '1' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Editing Workspaces
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', price: '', description: '', category: '', type: 'item', note: '', quantity: 1 });

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/listings/user/me');
      setListings(data);
    } catch (error) {
      console.error('Fetch listings failed:', error);
      setMessage('Could not load your listings.');
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
      setMessage('Please fill in the Title, Price, Category, and Description.');
      return;
    }
    if (form.type === 'item' && !imageFile) {
      setMessage('Please add an image for your item.');
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
        quantity: form.type === 'item' ? (Number(form.quantity) || 1) : 1,
        imageUrl: finalImageUrl
      });

      setMessage('Listing published successfully!');
      setForm({ title: '', description: '', category: '', type: 'item', note: '', price: '', quantity: '1' });
      setImageFile(null);
      setImagePreview('');
      fetchListings();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to submit your listing.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Are you sure you want to remove this listing?')) return;
    setLoading(true);
    try {
      await api.delete(`/listings/${id}`);
      setMessage('Listing removed successfully.');
      if (editingId === id) setEditingId(null);
      fetchListings();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to remove listing.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      title: item.title,
      price: item.price,
      description: item.description || '',
      category: item.category || '',
      type: item.type || 'item',
      note: item.note || '',
      quantity: item.quantity || 1
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put(`/listings/${editingId}`, {
        title: editForm.title,
        price: Number(editForm.price) || 0,
        description: editForm.description,
        category: editForm.category,
        type: editForm.type,
        note: editForm.note || '',
        quantity: editForm.type === 'item' ? (Number(editForm.quantity) || 1) : 1
      });
      setMessage('Listing updated successfully.');
      setEditingId(null);
      fetchListings();
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to save changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="space-y-6 max-w-2xl mx-auto p-4 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Creation Pane */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-300 dark:border-slate-800">
        <div className="flex items-center space-x-2 mb-6">
          <Sparkles className="text-emerald-700 dark:text-emerald-400" size={22} />
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Create Marketplace Listing</h2>
        </div>
        
        {message && (
          <div className="p-4 text-sm font-semibold rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mb-4 border border-slate-200 dark:border-slate-700">
            {message}
          </div>
        )}

        <form onSubmit={handlePublish} className="space-y-5">
          <div className="flex gap-4">
            {['item', 'service'].map((t) => (
              <label key={t} className="flex-1 text-center p-3 rounded-2xl border cursor-pointer capitalize font-bold transition bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 select-none">
                <input type="radio" name="type" checked={form.type === t} onChange={() => setForm({...form, type: t})} className="sr-only" />
                <span className={form.type === t ? 'text-emerald-600 dark:text-emerald-400 block scale-105' : 'text-slate-700 dark:text-slate-400 block'}>{t}</span>
              </label>
            ))}
          </div>

          {form.type === 'item' && (
            <div className="space-y-2">
              <span className="text-xs uppercase font-extrabold tracking-widest text-slate-700 dark:text-slate-500">Product Image (Required)</span>
              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition flex flex-col items-center justify-center min-h-[160px]">
                {imagePreview ? (
                  <div className="relative w-full max-h-[200px] overflow-hidden rounded-2xl">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }} className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-black">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload size={32} className="text-slate-700 dark:text-slate-500" />
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-400">Click to upload product image</span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase font-extrabold text-slate-700 dark:text-slate-500 block mb-1">Listing Title</label>
              <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 text-sm font-semibold" placeholder="MacBook, Tutoring, etc..." />
            </div>
            <div>
              <label className="text-xs uppercase font-extrabold text-slate-700 dark:text-slate-500 block mb-1">Price (GHS)</label>
              <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 text-sm font-semibold" placeholder="0.00" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs uppercase font-extrabold text-slate-700 dark:text-slate-500 block mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 text-sm font-semibold">
                <option value="">Select a category...</option>
                <option value="electronics">Electronics</option>
                <option value="academics">Academic Assistance</option>
                <option value="housing">Hostel & Housing</option>
                <option value="food">Food & Catering</option>
              </select>
            </div>
            <div>
              <label className="text-xs uppercase font-extrabold text-slate-700 dark:text-slate-500 block mb-1">Available Quantity</label>
              <input 
                type="number" 
                disabled={form.type === 'service'} 
                value={form.type === 'service' ? 1 : form.quantity} 
                onChange={e => setForm({...form, quantity: e.target.value})} 
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 text-sm font-semibold disabled:opacity-40" 
                min="1" 
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase font-extrabold text-slate-700 dark:text-slate-500 block mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 text-sm font-semibold resize-none" placeholder="Provide details about what you are listing..." />
          </div>

          <div>
            <label className="text-xs uppercase font-extrabold text-slate-700 dark:text-slate-500 block mb-1">Fulfillment Note (Optional)</label>
            <input type="text" value={form.note} onChange={e => setForm({...form, note: e.target.value})} className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 text-sm font-semibold" placeholder="e.g., Pick up at library courtyard before 4 PM" />
          </div>

          <button type="submit" disabled={loading} className="w-full py-4 rounded-2xl bg-slate-950 dark:bg-emerald-600 hover:bg-slate-900 dark:hover:bg-emerald-500 text-white font-bold transition text-sm disabled:opacity-50 shadow-sm">
            {loading ? 'Publishing...' : 'Publish Listing'}
          </button>
        </form>
      </section>

      {/* Management Workspace Area */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mb-5">My Store Workspace</h2>
        <div className="space-y-4">
          {listings.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800/50 p-4">
              <Package size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-500">You haven't posted any listings yet.</p>
            </div>
          ) : (
            listings.map((item) => (
              <article key={item._id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 transition-all">
                {editingId === item._id ? (
                  /* Dynamic Inline Configuration Subform */
                  <form onSubmit={handleUpdate} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input 
                        type="text" 
                        value={editForm.title} 
                        onChange={e => setEditForm({...editForm, title: e.target.value})} 
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100"
                        placeholder="Update Title"
                      />
                      <input 
                        type="number" 
                        value={editForm.price} 
                        onChange={e => setEditForm({...editForm, price: e.target.value})} 
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100"
                        placeholder="Update Price"
                      />
                    </div>
                    
                    <div className="grid gap-3 sm:grid-cols-2">
                      <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100">
                        <option value="electronics">Electronics</option>
                        <option value="academics">Academic Assistance</option>
                        <option value="housing">Hostel & Housing</option>
                        <option value="food">Food & Catering</option>
                      </select>
                      <input 
                        type="number" 
                        disabled={editForm.type === 'service'} 
                        value={editForm.type === 'service' ? 1 : editForm.quantity} 
                        onChange={e => setEditForm({...editForm, quantity: e.target.value})} 
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 disabled:opacity-40"
                        placeholder="Update Stock Quantity"
                        min="1"
                      />
                    </div>

                    <textarea 
                      rows={2}
                      value={editForm.description} 
                      onChange={e => setEditForm({...editForm, description: e.target.value})} 
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-300 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 resize-none"
                      placeholder="Update Description..."
                    />
                    <div className="flex gap-2 justify-end">
                      <button 
                        type="button" 
                        onClick={() => setEditingId(null)} 
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-400 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700"
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
                          <img src={item.imageUrl} alt={item.title} className="w-12 h-12 object-cover rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                        )}
                        <div>
                          <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{item.title}</h3>
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {item.type} • {item.category} {item.type === 'item' && `• ${item.quantity || 1} left`}
                          </p>
                        </div>
                      </div>

                      {/* Control Actions Module */}
                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button 
                          onClick={() => startEdit(item)}
                          className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-900 dark:hover:border-slate-100 hover:text-slate-900 dark:hover:text-white transition flex items-center justify-center shadow-sm"
                          title="Edit Listing"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleRemove(item._id)} 
                          className="p-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-900/30 transition flex items-center justify-center shadow-sm"
                          title="Delete Listing"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs font-semibold text-slate-800 dark:text-slate-400 leading-relaxed">{item.description || item.note}</p>
                    <p className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">GHS {Number(item.price).toFixed(2)}</p>
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