import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, ArrowLeft, Image as ImageIcon, Bookmark, ShoppingCart, Briefcase } from 'lucide-react';
import api from '../../api';

export default function DetailedScreen({ user, onUpdateUser }) {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const { data } = await api.get(`/listings/${itemId}`);
        setItem(data);
      } catch (err) {
        console.error("Failed to load item details", err);
      } finally {
        setLoading(false); // 🌟 FIX: Change this from true to false so the component renders!
      }
    };
    if (itemId) fetchItemDetails();
  }, [itemId]);

  const handleAddToCart = async () => {
    const targetId = item?._id || itemId;
    if (!targetId) return alert("Item not found. Please try again.");
    
    try {
      const response = await api.post(`/listings/${targetId}/cart`, {
        quantity: item?.type === 'item' ? quantity : 1 
      });
      
      if (onUpdateUser && response.data?.user) {
        onUpdateUser(response.data.user);
      }
      
      alert(item?.type === 'item' ? 'Added to cart successfully!' : 'Service booked successfully!');
    } catch (error) {
      alert(`Could not add to cart: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleToggleStar = async () => {
    const targetId = item?._id || itemId;
    if (!targetId) return alert("Item not found.");

    try {
      const response = await api.post(`/listings/${targetId}/star`);
      
      if (onUpdateUser && response.data?.user) {
        onUpdateUser(response.data.user);
      }
      
      alert('Saved to your favorites!');
    } catch (error) {
      alert(`Could not save item: ${error.response?.data?.message || error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 dark:border-t-emerald-500 animate-spin"></div>
        </div>
        <p className="mt-6 text-sm font-semibold text-slate-600 dark:text-slate-300 tracking-wide">Loading details...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 px-4">
        <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-4">
          <ImageIcon className="text-slate-400 dark:text-slate-500" size={40} />
        </div>
        <p className="text-lg font-bold text-slate-900 dark:text-white mb-2 text-center">Item not found</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6">This listing may have been removed or is unavailable.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30 transition duration-200">
          Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      
      {/* Premium Navigation Header */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/60 dark:border-slate-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>
          
          <button 
            onClick={handleToggleStar} 
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md"
            title="Save to favorites"
          >
            <Bookmark 
              size={20} 
              className={(user?.starredServices?.includes(item?._id) || user?.starredServices?.includes(itemId)) 
                ? 'fill-emerald-600 text-emerald-600' 
                : 'text-slate-400 dark:text-slate-500'} 
            />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        
        {/* Premium Content Grid - Mobile First */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          
          {/* Image Container */}
          <div className="lg:col-span-3">
            <div className="w-full aspect-square bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden flex items-center justify-center relative border border-slate-200 dark:border-slate-700 shadow-lg">
              {item.imageUrl ? (
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="text-center p-8 space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center mx-auto">
                    <ImageIcon size={32} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 block">No Image Available</span>
                </div>
              )}
            </div>
          </div>

          {/* Details Panel */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="space-y-4">
              {/* Category & Title Section */}
              <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs px-3 py-1.5 rounded-full font-bold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/50">
                    {item.type === 'item' ? '🛍️ Item' : '💼 Service'}
                  </span>
                  <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-full font-semibold">
                    {item.category || 'General'}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">{item.title}</h1>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-400 dark:to-emerald-500 bg-clip-text text-transparent">
                    GHS {Number(item.price).toFixed(2)}
                  </p>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.type === 'item' ? 'per unit' : 'per service'}</p>
                </div>
              </div>

              {/* Description Block */}
              <div className="space-y-2 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-xs uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400">Description</h3>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item.description || 'No description provided.'}</p>
              </div>

              {/* Special Note Block */}
              {item.note && (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-2xl border border-amber-200 dark:border-amber-700/40 shadow-sm">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 block mb-1.5">📌 Important Note</span>
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 leading-relaxed">{item.note}</p>
                </div>
              )}
            </div>

            {/* Quantity Selector (Only for Items) */}
            {item.type === 'item' && (
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Stock Available</p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{item.quantity || 1} units</p>
                  </div>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-xl p-1.5 border border-slate-200 dark:border-slate-600 shadow-sm">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                      className="px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white transition"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-black text-base text-slate-900 dark:text-white">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(item.quantity || 1, quantity + 1))} 
                      className="px-2.5 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Seller Info */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Listed By</p>
                <h4 
                  onClick={() => navigate(`/peer/${item.owner?._id}`)}
                  className="font-bold text-sm mt-0.5 cursor-pointer hover:text-emerald-600 hover:underline transition-colors"
                >
                  {item.owner?.firstName} {item.owner?.lastName}
                </h4>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {item.owner?.schoolId || 'Not provided'}</p>
              </div>
              <div className="flex space-x-2">
                <a href={`tel:${item.owner?.phone}`} className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl transition shadow-xs flex items-center justify-center text-emerald-600" title="Call Provider">
                  <Phone size={18} />
                </a>
                
                <button 
                  onClick={() => {
                    const sellerId = item.owner?._id || item.recipientId || item.sender;
                    const itemTitle = item.title || item.itemName || 'Marketplace Item';
                    const fName = item.owner?.firstName || 'Campus';
                    const lName = item.owner?.lastName || 'Member';

                    // 🌟 INJECTED: Pass itemId along inside search parameters tracking string
                    navigate(
                      `/messages?recipientId=${sellerId}&itemName=${encodeURIComponent(itemTitle)}&sellerName=${encodeURIComponent(fName + ' ' + lName)}&itemId=${item._id}`
                    );
                  }}
                  className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition shadow-xs flex items-center justify-center" 
                  title="Message Provider"
                >
                  <MessageSquare size={18} />
                </button>
              </div>
            </div>

            {/* Action Button */}
            <button 
              onClick={item.type === 'item' ? handleAddToCart : () => handleAddToCart(1)} 
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold transition shadow-sm mt-4"
            >
              {item.type === 'item' ? (
                <>
                  <ShoppingCart size={18} /> 
                  <span>Add to Cart</span>
                </>
              ) : (
                <>
                  <Briefcase size={18} /> 
                  <span>Book Service</span>
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
