import { useEffect, useState } from 'react';
import api from '../../api';

export default function CartPage({ user }) {
  const [cartItems, setCartItems] = useState([]);
  const [starredServices, setStarredServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('momo');

  useEffect(() => {
    // Load cart and starred services from user object
    if (user?.cart) {
      setCartItems(user.cart);
    }
    if (user?.starredServices) {
      setStarredServices(user.starredServices);
    }
  }, [user]);

  const handleRemoveFromCart = async (itemId) => {
    try {
      await api.delete(`/cart/${itemId}`);
      setCartItems(cartItems.filter((item) => item.item._id !== itemId));
    } catch (error) {
      console.error('Failed to remove from cart', error);
    }
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCartItems(
      cartItems.map((item) =>
        item.item._id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.item.price * item.quantity, 0);
  const tax = subtotal * 0.05; // 5% tax
  const total = subtotal + tax;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual payment processing
      console.log('Checkout with', paymentMethod);
      alert(`Processing payment of GHS ${total.toFixed(2)} via ${paymentMethod.toUpperCase()}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Cart Items */}
      <div className="lg:col-span-2 space-y-6">
        <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
          <h2 className="text-2xl font-semibold text-slate-900">Shopping Cart</h2>
          {cartItems.length === 0 ? (
            <p className="mt-4 text-slate-500">Your cart is empty</p>
          ) : (
            <div className="mt-5 space-y-4">
              {cartItems.map((cartItem) => (
                <div key={cartItem.item._id} className="flex gap-4 border-b border-slate-200 pb-4">
                  {cartItem.item.imageUrl && (
                    <img src={cartItem.item.imageUrl} alt={cartItem.item.title} className="h-20 w-20 rounded-2xl object-cover" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900">{cartItem.item.title}</h3>
                    <p className="text-sm text-slate-600">GHS {cartItem.item.price.toFixed(2)}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(cartItem.item._id, cartItem.quantity - 1)}
                        className="rounded px-2 py-1 bg-slate-100 hover:bg-slate-200"
                      >
                        −
                      </button>
                      <span className="w-8 text-center">{cartItem.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(cartItem.item._id, cartItem.quantity + 1)}
                        className="rounded px-2 py-1 bg-slate-100 hover:bg-slate-200"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">GHS {(cartItem.item.price * cartItem.quantity).toFixed(2)}</p>
                    <button
                      onClick={() => handleRemoveFromCart(cartItem.item._id)}
                      className="mt-2 text-xs text-rose-600 hover:text-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Starred Services */}
        {starredServices.length > 0 && (
          <section className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
            <h2 className="text-2xl font-semibold text-slate-900">Your Starred Services</h2>
            <div className="mt-5 overflow-x-auto flex gap-4 pb-2">
              {starredServices.map((service) => (
                <div key={service._id} className="flex-shrink-0 w-60 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  {service.imageUrl && (
                    <img src={service.imageUrl} alt={service.title} className="h-32 w-full rounded-2xl object-cover" />
                  )}
                  <h3 className="mt-2 font-semibold text-slate-900">{service.title}</h3>
                  <p className="text-sm text-slate-600">GHS {service.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Order Summary & Checkout */}
      <section className="h-fit rounded-3xl bg-white p-6 shadow-sm shadow-slate-200 sticky top-24">
        <h3 className="text-xl font-semibold text-slate-900">Order Summary</h3>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span>GHS {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tax (5%)</span>
            <span>GHS {tax.toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
            <span>Total</span>
            <span>GHS {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-slate-700">Payment Method</p>
          {['momo', 'card'].map((method) => (
            <label key={method} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="payment"
                value={method}
                checked={paymentMethod === method}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="rounded-full"
              />
              <span className="text-sm font-medium text-slate-700">
                {method === 'momo' ? '📱 Mobile Money' : '💳 Card'}
              </span>
            </label>
          ))}
        </div>

        <button
          onClick={handleCheckout}
          disabled={loading || cartItems.length === 0}
          className="mt-6 w-full rounded-3xl bg-slate-900 px-4 py-3 font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? 'Processing…' : 'Proceed to Checkout'}
        </button>
      </section>
    </div>
  );
}
