import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Star, ArrowLeft, ShoppingCart } from 'lucide-react';
import api from '../../api';

export default function DetailedScreen() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const { data } = await api.get(`/listings/${itemId}`);
        setItem(data);
      } catch (error) {
        console.error('Failed to load item', error);
      } finally {
        setLoading(false);
      }
    };
    fetchItem();
  }, [itemId]);

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!item) return <div className="text-center py-20">Item not found</div>;

  const avgRating = item.ratings?.length
    ? (item.ratings.reduce((sum, r) => sum + r.score, 0) / item.ratings.length).toFixed(1)
    : 'N/A';

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          {item.imageUrl && (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden h-96">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Details */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                {item.type === 'item' ? 'Item' : 'Service'} • {item.category}
              </p>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
                {item.title}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={20}
                      className={i < Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}
                    />
                  ))}
                </div>
                <span className="text-slate-600 dark:text-slate-400">
                  {avgRating} • {item.ratings?.length || 0} reviews
                </span>
              </div>
            </div>

            {/* Price */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-6">
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-2">Price</p>
              <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                GHS {item.price.toFixed(2)}
              </p>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Description</h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {item.description || item.note || 'No description provided'}
              </p>
            </div>

            {/* Item Info */}
            {item.type === 'item' && (
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">Available Stock</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {item.quantity} units
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            {item.type === 'item' && (
              <div className="flex items-center gap-4">
                <span className="text-slate-700 dark:text-slate-300">Quantity:</span>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 rounded-lg p-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(item.quantity, quantity + 1))}
                    className="px-3 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Provider Info */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Provider</h3>
              <div className="flex items-center gap-4 mb-4">
                {item.owner?.profileImage && (
                  <img
                    src={item.owner.profileImage}
                    alt={item.owner.firstName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {item.owner?.firstName} {item.owner?.lastName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    ID: {item.owner?.schoolId}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => item.owner?.phone && (window.location.href = `tel:${item.owner.phone}`)}
                  className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition"
                >
                  <Phone size={18} />
                  Call
                </button>
                <button
                  onClick={() => navigate(`/messages?userId=${item.owner?._id}`)}
                  className="flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 py-3 rounded-lg font-semibold transition"
                >
                  <MessageSquare size={18} />
                  Message
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            {item.type === 'item' && (
              <button className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-lg font-semibold text-lg transition">
                <ShoppingCart size={20} />
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
