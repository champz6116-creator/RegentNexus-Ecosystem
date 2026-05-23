import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, Star, ArrowLeft, Image as ImageIcon, Bookmark, ShoppingCart, Briefcase } from 'lucide-react';
import api from '../../api';

export default function DetailedScreen({ user, onUpdateUser }) {
  const { itemId } = useParams(); // Extracts the exact match parameter from React Router DOM
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const { data } = await api.get(`/listings/${itemId}`);
        setItem(data);
        const previousRating = data.ratings?.find(r => r.rater === user?._id);
        if (previousRating) setUserRating(previousRating.score);
      } catch (err) {
        console.error("Item detail synchronization failed", err);
      } finally {
        setLoading(false);
      }
    };
    if (itemId) fetchItemDetails();
  }, [itemId, user]);

  const handleRating = async (score) => {
    setUserRating(score);
    try {
      const { data } = await api.post(`/listings/${itemId}/rate`, { score });
      setItem(data);
    } catch (error) {
      alert('Failed to save rating adjustments.');
    }
  };

  const handleAddToCart = async () => {
    if (!item?._id) return alert("Listing identifier profile context dropped.");
    
    try {
      const response = await api.post(`/listings/${item._id}/cart`, { 
        quantity: item.type === 'item' ? quantity : 1 
      });
      
      console.log("Cart Action Server Response Payload:", response.data);
      
      if (onUpdateUser && response.data?.user) {
        onUpdateUser(response.data.user);
      }
      
      alert(item.type === 'item' ? 'Added to your Cart successfully!' : 'Service booked successfully!');
    } catch (error) {
      // 🔍 This console log will print exactly what went wrong in your browser inspect tab!
      console.error("Detailed Frontend AddToCart Stack Failure Log:", error.response?.data || error.message);
      alert(`Could not update cart tracking elements: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleToggleStar = async () => {
    if (!item?._id) return alert("Listing identifier profile context dropped.");

    try {
      const response = await api.post(`/listings/${item._id}/star`);
      
      console.log("Star Action Server Response Payload:", response.data);
      
      if (onUpdateUser && response.data?.user) {
        onUpdateUser(response.data.user);
      }
      
      alert('Starred status updated!');
    } catch (error) {
      // 🔍 This console log will print exactly what went wrong in your browser inspect tab!
      console.error("Detailed Frontend ToggleStar Stack Failure Log:", error.response?.data || error.message);
      alert(`Could not adjust starred list status: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <p className="text-slate-500 dark:text-slate-400 font-medium">Item matching endpoint missing.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl">Go Back</button>
      </div>
    );
  }

  const avgRating = item.ratings?.length
    ? (item.ratings.reduce((sum, r) => sum + r.score, 0) / item.ratings.length).toFixed(1)
    : 'N/A';

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 transition-colors duration-200">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation Actions bar */}
        <div className="flex justify-between items-center mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
            <ArrowLeft size={16} />
            <span>Back to Marketplace</span>
          </button>
          
          <button onClick={handleToggleStar} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-xs">
            <Bookmark size={18} className={user?.starredServices?.includes(item._id) ? 'fill-emerald-600 text-emerald-600' : 'text-slate-400'} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          
          {/* Media Showcase Container Block */}
          <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex items-center justify-center relative border border-slate-200/50 dark:border-slate-700/50">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <ImageIcon size={48} className="mx-auto text-slate-400 mb-2" />
                <span className="text-xs text-slate-400">No Image Preview Available</span>
              </div>
            )}
          </div>

          {/* Product Profile Information */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="inline-block bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                  {item.type === 'item' ? 'Item' : 'Service'} • {item.category || 'Campus Asset'}
                </span>
                <h1 className="text-3xl font-black tracking-tight mt-2">{item.title}</h1>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">GHS {Number(item.price).toFixed(2)}</p>
              </div>
              
              {/* Star Evaluation Grading Interface */}
              <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div className="flex items-center space-x-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => handleRating(star)} className="focus:outline-none transition-transform active:scale-95">
                      <Star size={18} fill={star <= (userRating || Math.round(Number(avgRating))) ? "#fbbf24" : "none"} color={star <= (userRating || Math.round(Number(avgRating))) ? "#fbbf24" : "#94a3b8"} />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3">
                  Score: {avgRating} ({item.ratings?.length || 0} peer logs)
                </span>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <h3 className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-1">Full Description</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{item.description || 'No description provided.'}</p>
              </div>

              {item.note && (
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/10 rounded-2xl border border-amber-100/70 dark:border-amber-900/30">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-400 block">Fulfillment Context Note</span>
                  <p className="text-xs font-semibold text-amber-950 dark:text-amber-200 mt-1">{item.note}</p>
                </div>
              )}
            </div>

            {/* Quantity Selector Layout (Only for Items) */}
            {item.type === 'item' && (
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Available Stock</p>
                  <p className="text-sm font-bold mt-0.5">{item.quantity || 1} units on hand</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs font-bold">−</button>
                  <span className="w-4 text-center font-bold text-xs">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(item.quantity || 1, quantity + 1))} className="px-2 py-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-xs font-bold">+</button>
                </div>
              </div>
            )}

            {/* Merchant Identity Allocation Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Listed By</p>
                <h4 className="font-bold text-sm mt-0.5">{item.owner?.firstName} {item.owner?.lastName}</h4>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {item.owner?.schoolId || 'REGENT-PENDING'}</p>
              </div>
              <div className="flex space-x-2">
                <a href={`tel:${item.owner?.phone}`} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl transition shadow-xs flex items-center justify-center text-emerald-600" title="Call Provider">
                  <Phone size={18} />
                </a>
                
                {/* ✅ Direct P2P Channel Context Handshake Link */}
                <button 
                  onClick={() => navigate(`/messages?recipientId=${item.owner?._id}&itemName=${encodeURIComponent(item.title)}`)} 
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-xs flex items-center justify-center" 
                  title="Message Provider"
                >
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>

            {/* Operation Tray Execution Action */}
            <button 
              onClick={item.type === 'item' ? handleAddToCart : () => handleAddToCart(1)} 
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold transition shadow-sm mt-4"
            >
              {item.type === 'item' ? (
                <>
                  <ShoppingCart size={18} /> 
                  <span>Add to Campus Cart</span>
                </>
              ) : (
                <>
                  <Briefcase size={18} /> 
                  <span>Book Service Representation</span>
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
