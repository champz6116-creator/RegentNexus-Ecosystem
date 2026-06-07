import { useEffect, useState } from 'react';
import { Trash2, ChevronRight, Smartphone, CreditCard } from 'lucide-react';
import api from '../../api';

export default function CartPage({ user, onUpdateUser }) {
  const [cartItems, setCartItems] = useState([]);
  const [starredServices, setStarredServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('momo');

  // Sync state with user context safely
  useEffect(() => {
    if (user?.cart) setCartItems(user.cart);
    if (user?.starredServices) setStarredServices(user.starredServices);
  }, [user]);

  const handleRemoveFromCart = async (itemId) => {
    try {
      const { data } = await api.delete(`/cart/remove/${itemId}`);
      const updatedUser = data.user || data;
      if (onUpdateUser) {
        onUpdateUser(updatedUser);
      } else {
        setCartItems(cartItems.filter((item) => item.item?._id !== itemId));
      }
    } catch (error) {
      console.error('Failed to remove item', error);
      alert('Could not remove this item. Please try again.');
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }

    // Optimistic local update
    const updatedCart = cartItems.map((item) =>
      item.item?._id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);

    try {
      const { data } = await api.put(`/cart/update`, { itemId, quantity: newQuantity });
      if (onUpdateUser) onUpdateUser(data.user || data);
    } catch (error) {
      console.error('Quantity sync failed', error);
    }
  };

  const handleClearCart = async () => {
    try {
      const { data } = await api.delete('/cart/clear');
      if (onUpdateUser) {
        onUpdateUser(data.user || data);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error(error);
      alert('Could not clear your cart.');
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.item?.price || 0) * item.quantity, 0);
  const tax = subtotal * 0.05; 
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    setLoading(true);
    try {
      // Connect to backend checkout processing endpoint
      const { data } = await api.post('/orders/checkout', { paymentMethod });
      alert(`Order processed successfully via ${paymentMethod.toUpperCase()}!`);
      if (onUpdateUser) onUpdateUser(data.user || data);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-2 grid gap-6 lg:grid-cols-3">
      {/* Primary Cart List & Saved Services Section */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Cart Items */}
        <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Shopping Cart</h2>
              <p className="text-xs text-slate-400 font-medium mt-0.5 uppercase tracking-widest">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            {cartItems.length > 0 && (
              <button onClick={handleClearCart} className="text-xs flex items-center gap-1.5 text-rose-600 font-bold tracking-wide border border-rose-100 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400">
                <Trash2 size={13} /> Clear Cart
              </button>
            )}
          </div>

          {cartItems.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl mt-5">Your shopping cart is empty.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {cartItems.map((cartItem) => (
                <article key={cartItem.item?._id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-850 shadow-sm gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {cartItem.item?.imageUrl ? (
                        <img src={cartItem.item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase">Item</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate text-base">{cartItem.item?.title}</h3>
                      <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm mt-0.5">GHS {cartItem.item?.price?.toFixed(2)}</p>
                      
                      {/* Quantity Controls */}
                      <div className="mt-2 flex items-center gap-2">
                        <button onClick={() => handleUpdateQuantity(cartItem.item?._id, cartItem.quantity - 1)} className="rounded px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition font-bold text-sm">−</button>
                        <span className="w-6 text-center font-semibold text-xs text-slate-700 dark:text-slate-300">{cartItem.quantity}</span>
                        <button onClick={() => handleUpdateQuantity(cartItem.item?._id, cartItem.quantity + 1)} className="rounded px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition font-bold text-sm">+</button>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex flex-col items-end justify-between h-16">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">GHS {((cartItem.item?.price || 0) * cartItem.quantity).toFixed(2)}</p>
                    <button onClick={() => handleRemoveFromCart(cartItem.item?._id)} className="p-1 text-slate-400 hover:text-rose-600 transition" title="Remove Item">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Saved Services Carousel */}
        <section className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-800 dark:border-slate-700 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Saved Services</h3>
            <ChevronRight size={18} className="text-slate-400" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
            {starredServices.length === 0 ? (
              <p className="text-slate-400 text-xs py-6 text-center w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl">You haven't starred any services yet.</p>
            ) : (
              starredServices.map((svc) => (
                <article key={svc._id} className="w-44 shrink-0 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3.5 rounded-2xl shadow-sm snap-start flex flex-col justify-between space-y-3">
                  <div className="w-full h-24 bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                    {svc.imageUrl ? (
                      <img src={svc.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-slate-300 font-bold uppercase">Service</span>
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{svc.title}</h4>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mt-0.5">{svc.category}</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">GHS {svc.price?.toFixed(2)}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Checkout Sidebar Card */}
      <section className="h-fit rounded-3xl bg-white dark:bg-slate-800 p-6 shadow-sm border border-slate-100 dark:border-slate-700 sticky top-24 space-y-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Order Summary</h3>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
            <span>Subtotal</span>
            <span>GHS {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500 dark:text-slate-400 font-medium">
            <span>Service Fee (5%)</span>
            <span>GHS {tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-100 dark:border-slate-700 pt-3 flex justify-between font-bold text-slate-900 dark:text-white text-base">
            <span>Total Amount Due</span>
            <span className="text-emerald-600 dark:text-emerald-400">GHS {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Gate Selection */}
        <div className="space-y-2 border-t border-slate-100 dark:border-slate-700 pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Payment Method</p>
          <div className="space-y-2 mt-2">
            {[
              ['momo', 'Mobile Money Network', Smartphone],
              ['card', 'Credit / Debit Card', CreditCard]
            ].map(([method, displayLabel, IconComponent]) => (
              <label key={method} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${paymentMethod === method ? 'border-slate-900 bg-slate-50/50 dark:border-emerald-500 dark:bg-slate-700' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50/30'}`}>
                <div className="flex items-center gap-2.5">
                  <IconComponent size={16} className={paymentMethod === method ? 'text-slate-900 dark:text-emerald-400' : 'text-slate-400'} />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{displayLabel}</span>
                </div>
                <input
                  type="radio"
                  name="payment"
                  value={method}
                  checked={paymentMethod === method}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 dark:accent-emerald-500"
                />
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading || cartItems.length === 0}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 text-sm"
        >
          {loading ? 'Processing payment...' : 'Pay Now'}
        </button>
      </section>
    </main>
  );
}
