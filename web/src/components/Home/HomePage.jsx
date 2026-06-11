import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, ShoppingCart, ArrowRight, Tag, ShieldCheck, Sparkles } from 'lucide-react';
import api from '../../api';

export default function HomePage() {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState(() => localStorage.getItem('marketplaceView') || 'items');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchListings = async (query = '') => {
    setLoading(true);
    try {
      const filter = query ? `?q=${encodeURIComponent(query)}` : '';
      const { data } = await api.get(`/listings${filter}`);
      if (data && Array.isArray(data)) {
        setListings(data);
      }
    } catch (error) {
      console.error('Failed to load listings', error);
    } 
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // FIX 1: Instant search handler that catches form submissions
  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings(search);
  };

  // FIX 2: Client-side Filter & "Last-In, First-Up" Sorting Engine
  // This filters listings instantly as the user types, and puts the newest entries first.
  const filtered = listings
    .filter((l) => (view === 'items' ? l.type === 'item' : l.type === 'service'))
    // Instant client-side search fallback matching title or category
    .filter((l) => {
      const query = search.toLowerCase().trim();
      if (!query) return true;
      return (
        l.title?.toLowerCase().includes(query) || 
        l.category?.toLowerCase().includes(query) ||
        l.description?.toLowerCase().includes(query)
      );
    })
    // Sorts newest additions first (Last-In, First-Out)
    .sort((a, b) => {
      // Sorts by MongoDB ObjectId timestamp metadata if createdAt doesn't exist
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : a._id;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : b._id;
      return timeB > timeA ? 1 : -1;
    });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200 pb-20">
      
      {/* Premium Promo Banner with Grid Geometry */}
      <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 dark:from-slate-950 dark:via-emerald-950 dark:to-slate-950 text-white py-2.5 px-4 shadow-md relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#ffffff08_1px,transparent_1px)] bg-[size:30px_30px] opacity-30 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2.5 text-center sm:text-left w-full sm:w-auto">
            <span className="bg-white/15 backdrop-blur-sm text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1 flex-shrink-0">
              <Sparkles size={13} className="fill-current" /> Verified
            </span>
            <p className="text-xs sm:text-sm font-semibold tracking-wide">
              Secure campus marketplace connecting verified students
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition cursor-pointer group flex-shrink-0">
            Learn More <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* Premium Dark Hero Section with Gradient */}
      <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 dark:from-slate-900 dark:via-slate-950 dark:to-emerald-950 overflow-hidden pt-12 pb-32 lg:pb-40">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#10b98110_1px,transparent_1px),linear-gradient(#10b98110_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-600/5 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-8 max-w-3xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-tight mb-3">
              Find What You Need <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-amber-300 bg-clip-text text-transparent">
                On Campus
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-medium tracking-wide max-w-xl">
              The premium student marketplace. Verified traders. Secure transactions. Campus trust.
            </p>
          </div>
        </div>

        {/* Floating Search Card */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 -mb-20 lg:-mb-24">
          <form onSubmit={handleSearch} className="max-w-4xl">
            <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/60 transition duration-300 p-1 flex flex-col sm:flex-row items-stretch gap-1 sm:gap-1.5 group hover:shadow-3xl hover:border-emerald-400/30 dark:hover:border-emerald-500/30">
              <div className="flex items-center flex-1 pl-4 sm:pl-5">
                <Search className="text-slate-400 dark:text-slate-500 shrink-0" size={20} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)} // Re-triggers filtering instantly on input shift
                  placeholder={`Search ${view}...`}
                  className="w-full pl-3 pr-3 py-4 sm:py-3 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 text-sm sm:text-base focus:outline-none font-medium"
                />
              </div>
              <button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 active:scale-95 text-white px-6 sm:px-8 py-4 sm:py-3 rounded-xl font-bold text-sm tracking-wide shadow-lg shadow-emerald-600/30 transition duration-200 flex-shrink-0 m-1 sm:m-0"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tab Navigation Section */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pt-16 sm:pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 mb-8 items-center">
            <div className="inline-flex rounded-full bg-slate-100 dark:bg-slate-800/50 p-1 border border-slate-200/60 dark:border-slate-700/60">
              <button
                onClick={() => {
                  setView('items');
                  localStorage.setItem('marketplaceView', 'items');
                }}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base tracking-wide transition-all duration-200 flex items-center gap-2 ${
                  view === 'items'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Items
              </button>
              <button
                onClick={() => {
                  setView('services');
                  localStorage.setItem('marketplaceView', 'services');
                }}
                className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-full font-bold text-sm sm:text-base tracking-wide transition-all duration-200 flex items-center gap-2 ${
                  view === 'services'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg shadow-emerald-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Services
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dynamic Items Counter Bar */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-500 animate-pulse"></div>
            <p className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 tracking-wide uppercase">
              {filtered.length} {view === 'items' ? 'Items Available' : 'Services Offered'}
            </p>
          </div>
        </div>

        {/* Visual Content Delivery Engine */}
        {loading ? (
          <div className="flex flex-col items-center justify-center text-center py-32 space-y-4">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-3 border-slate-200 dark:border-slate-700"></div>
              <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-emerald-600 dark:border-t-emerald-500 animate-spin"></div>
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wide">Loading marketplace...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700/50 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/30 dark:to-slate-900/30 p-8 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <Search className="text-slate-400 dark:text-slate-500" size={28} />
            </div>
            <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-1">No {view} found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Try searching with different keywords or browse all listings</p>
          </div>
        ) : view === 'items' ? (
          
          /* Premium Jumia-Style Retail Grid Matrix */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
            {filtered.map((item) => (
              <button
                key={item._id}
                onClick={() => navigate(`/listings/${item._id}`)}
                className="group text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-150 dark:border-slate-700/80 overflow-hidden shadow-sm hover:shadow-2xl dark:hover:shadow-emerald-900/30 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative"
              >
                {item.imageUrl && (
                  <div className="w-full aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 overflow-hidden shrink-0 relative border-b border-slate-100 dark:border-slate-700/50">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600/90 backdrop-blur-sm text-white p-1.5 rounded-lg shadow-lg border border-emerald-400/30">
                      <ShieldCheck size={14} />
                    </div>
                  </div>
                )}
                
                <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 min-w-0">
                  <div className="min-w-0">
                    <div className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2 py-1 rounded-md mb-2 text-[10px] font-bold uppercase tracking-wider shrink-0">
                      <Tag size={11} />
                      {item.category || 'Item'}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white truncate text-xs sm:text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      {item.title}
                    </h3>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <p className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                      GHS {item.price.toFixed(2)}
                    </p>
                    <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white group-hover:bg-emerald-700 transition duration-200 flex items-center justify-center shadow-md shadow-emerald-600/30">
                      <ShoppingCart size={13} />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          
          /* Modern Streamlined Services Row Layout */
          <div className="space-y-3 sm:space-y-4">
            {filtered.map((service) => (
              <button
                key={service._id}
                onClick={() => navigate(`/listings/${service._id}`)}
                className="group text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-300 dark:hover:border-emerald-600/40 transition-all duration-300 flex flex-col sm:flex-row p-3 sm:p-4 gap-3.5 sm:gap-4 h-full min-w-0"
              >
                {service.imageUrl && (
                  <div className="w-full sm:w-32 sm:h-32 h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 rounded-xl overflow-hidden shrink-0 relative">
                    <img
                      src={service.imageUrl}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                )}
                
                <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                  <div className="min-w-0">
                    <span className="inline-flex text-[10px] uppercase font-extrabold tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-1 rounded-lg mb-2 border border-emerald-200 dark:border-emerald-500/30">
                      {service.category || 'Campus Service'}
                    </span>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                      {service.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {service.description || service.note}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Service Rate:</span>
                      <p className="font-black text-slate-900 dark:text-white text-sm sm:text-base">
                        GHS {service.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-bold text-sm">
                      <Star size={15} className="fill-amber-400 text-amber-400" />
                      <span className="tracking-wide">View Service</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}