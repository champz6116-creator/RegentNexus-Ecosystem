import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, ShoppingCart } from 'lucide-react';
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
      setListings(data);
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

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings(search);
  };

  const filtered = view === 'items'
    ? listings.filter((l) => l.type === 'item')
    : listings.filter((l) => l.type === 'service');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Category Toggles */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => {
              setView('items');
              localStorage.setItem('marketplaceView', 'items');
            }}
            className={`px-6 py-3 rounded-full font-semibold transition ${
              view === 'items'
                ? 'bg-emerald-500 text-white'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
            }`}
          >
            Items
          </button>
          <button
            onClick={() => {
              setView('services');
              localStorage.setItem('marketplaceView', 'services');
            }}
            className={`px-6 py-3 rounded-full font-semibold transition ${
              view === 'services'
                ? 'bg-emerald-500 text-white'
                : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
            }`}
          >
            Services
          </button>
        </div>

        {/* Marketplace Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${view}...`}
              className="w-full pl-12 pr-4 py-4 rounded-full border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-full font-semibold transition"
            >
              Search
            </button>
          </div>
        </form>

        {/* Counter Info */}
        <div className="mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Showing {filtered.length} {view === 'items' ? 'items' : 'services'}
          </p>
        </div>

        {/* Data Display Grids */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">Loading {view}...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">No {view} found. Try a different search.</p>
          </div>
        ) : view === 'items' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <button
                key={item._id}
                onClick={() => navigate(`/listings/${item._id}`)}
                className="group text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition"
              >
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    {item.category}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      GHS {item.price.toFixed(2)}
                    </p>
                    <ShoppingCart size={18} className="text-slate-400" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((service) => (
              <button
                key={service._id}
                onClick={() => navigate(`/listings/${service._id}`)}
                className="w-full text-left bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition flex"
              >
                {service.imageUrl && (
                  <img
                    src={service.imageUrl}
                    alt={service.title}
                    className="w-40 h-32 object-cover shrink-0"
                  />
                )}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                      {service.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {service.category}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-2 line-clamp-2">
                      {service.description || service.note}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-bold text-emerald-600 dark:text-emerald-400">
                      GHS {service.price.toFixed(2)}
                    </p>
                    <Star size={18} className="text-slate-400" />
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
