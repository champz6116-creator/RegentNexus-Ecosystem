import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ChevronRight, Smartphone, CreditCard, X, AlertTriangle, Info } from 'lucide-react';
import api from '../../api';

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Resolves a raw imageUrl value to a fully-qualified src string.
 * Handles:
 *  • absolute URLs (http/https, data:, blob:) → returned as-is
 *  • relative backend paths              → prepend backend origin
 *  • undefined / null                    → returns null (triggers fallback)
 */
const BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'https://regent-nexus-backend.onrender.com';

function resolveImageSrc(imageUrl) {
  if (!imageUrl) return null;
  if (/^(https?:\/\/|data:|blob:)/i.test(imageUrl)) return imageUrl;
  return `${BASE_URL}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

// ─── Pilot-Phase Modal ────────────────────────────────────────────────────────

function PilotNoticeModal({ paymentMethod, onClose }) {
  const label = paymentMethod === 'momo' ? 'Mobile Money Network' : 'Credit / Debit Card';
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pilot Payment Notice"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#fff',
          borderRadius: '24px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.20)',
          overflow: 'hidden',
        }}
      >
        {/* Amber header strip */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
            borderBottom: '1.5px solid #f59e0b',
            padding: '20px 24px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          <span
            style={{
              flexShrink: 0,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(245,158,11,0.30)',
            }}
          >
            <Info size={20} color="#fff" strokeWidth={2.5} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <AlertTriangle size={12} color="#b45309" strokeWidth={2.5} />
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#b45309',
                }}
              >
                Pilot Version Notice
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#78350f', lineHeight: 1.5 }}>
              Selected: <em>{label}</em>
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              flexShrink: 0,
              padding: '4px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: '#92400e',
            }}
            aria-label="Close notice"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px 24px' }}>
          <p style={{ margin: '0 0 16px', fontSize: '14px', lineHeight: 1.7, color: '#334155' }}>
            Direct electronic transaction tracking is disabled in this deployment phase.
            Please coordinate all payments externally via{' '}
            <strong style={{ fontWeight: 700, color: '#0f172a' }}>cash</strong> or{' '}
            <strong style={{ fontWeight: 700, color: '#0f172a' }}>Mobile Money (MoMo)</strong>{' '}
            during peer-to-peer exchanges.
          </p>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
            Once you have confirmed payment with your seller directly, your order will be
            marked complete. Contact your seller via the{' '}
            <strong style={{ fontWeight: 600 }}>Messages</strong> tab for coordination.
          </p>
          <button
            onClick={onClose}
            style={{
              marginTop: '20px',
              width: '100%',
              padding: '12px',
              background: '#0f172a',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              letterSpacing: '0.02em',
              transition: 'background 0.2s',
            }}
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CartPage({ user, onUpdateUser }) {
  const [cartItems, setCartItems]         = useState([]);
  const [starredServices, setStarredServices] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('momo');
  const [showPilotModal, setShowPilotModal] = useState(false);

  // ── Populate cart from user context ─────────────────────────────────────────
  // The /users/:id endpoint does NOT populate cart.item, so raw cart entries
  // contain only ObjectId references. We fetch each item's full details here.
  const populateCartItems = useCallback(async (rawCart) => {
    if (!rawCart || rawCart.length === 0) {
      setCartItems([]);
      return;
    }

    const populated = await Promise.all(
      rawCart.map(async (entry) => {
        // Already populated (object with _id, title, price, etc.)
        if (entry.item && typeof entry.item === 'object' && entry.item.title) {
          return entry;
        }
        // Bare ObjectId string or { item: ObjectId } — fetch details
        const itemId = typeof entry.item === 'string' ? entry.item : entry.item?._id || entry.item;
        if (!itemId) return entry;
        try {
          const { data } = await api.get(`/listings/${itemId}`);
          return { ...entry, item: data };
        } catch {
          return entry; // Keep skeleton on error; image/text fallbacks handle it
        }
      })
    );

    setCartItems(populated);
  }, []);

  // ── Populate saved (starred) services ────────────────────────────────────────
  // starredServices arrives as an array of bare ObjectIds from the backend.
  // We hydrate each one with full item data exactly the same way we do for cart.
  const populateStarredServices = useCallback(async (rawIds) => {
    if (!rawIds || rawIds.length === 0) {
      setStarredServices([]);
      return;
    }

    const populated = await Promise.all(
      rawIds.map(async (entry) => {
        // Already a full object
        if (entry && typeof entry === 'object' && entry.title) return entry;
        // Bare ObjectId string or ObjectId instance
        const id = typeof entry === 'string' ? entry : entry?._id?.toString() || entry?.toString();
        if (!id) return null;
        try {
          const { data } = await api.get(`/listings/${id}`);
          return data;
        } catch {
          return null; // Skip failed lookups silently
        }
      })
    );

    // Filter out any nulls from failed fetches
    setStarredServices(populated.filter(Boolean));
  }, []);

  useEffect(() => {
    if (user?.cart) populateCartItems(user.cart);
    if (user?.starredServices) populateStarredServices(user.starredServices);
  }, [user, populateCartItems, populateStarredServices]);

  // ── Cart mutations ───────────────────────────────────────────────────────────

  const handleRemoveFromCart = async (itemId) => {
    // Coerce to a plain string — Mongoose ObjectId objects must be serialised
    // before use as a route param, otherwise Express receives "[object Object]"
    // and the backend filter never finds a match.
    const idStr = String(itemId);
    try {
      const response = await api.delete(`/users/cart/remove/${idStr}`);
      // Only update state after a confirmed 200 OK from the backend
      if (response.status === 200) {
        // Apply the local filter using the same string comparison
        setCartItems((prev) =>
          prev.filter((ci) => String(ci.item?._id || ci.item) !== idStr)
        );
        // Propagate the authoritative updated user to global state
        if (onUpdateUser) onUpdateUser(response.data.user || response.data);
      }
    } catch (error) {
      // Log the exact backend error payload for diagnosis
      console.error(
        '[CartPage] handleRemoveFromCart failed:',
        error.response?.data ?? error.message
      );
      alert('Could not remove this item. Please try again.');
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(itemId);
      return;
    }

    const idStr = String(itemId);

    // Optimistic local update for quantity (non-destructive — safe to preview)
    setCartItems((prev) =>
      prev.map((ci) =>
        String(ci.item?._id || ci.item) === idStr ? { ...ci, quantity: newQuantity } : ci
      )
    );

    try {
      const response = await api.put(`/users/cart/update`, { itemId: idStr, quantity: newQuantity });
      if (response.status === 200 && onUpdateUser) {
        onUpdateUser(response.data.user || response.data);
      }
    } catch (error) {
      console.error(
        '[CartPage] handleUpdateQuantity failed:',
        error.response?.data ?? error.message
      );
      // Roll back the optimistic quantity change on failure
      if (user?.cart) populateCartItems(user.cart);
    }
  };

  const handleClearCart = async () => {
    try {
      const response = await api.delete('/users/cart/clear');
      // Only wipe the local state after the backend confirms the clear
      if (response.status === 200) {
        setCartItems([]);
        if (onUpdateUser) onUpdateUser(response.data.user || response.data);
      }
    } catch (error) {
      console.error(
        '[CartPage] handleClearCart failed:',
        error.response?.data ?? error.message
      );
      alert('Could not clear your cart.');
    }
  };

  // ── Totals ────────────────────────────────────────────────────────────────────

  const subtotal = cartItems.reduce(
    (sum, ci) => sum + (ci.item?.price || 0) * (ci.quantity || 1),
    0
  );
  const tax   = subtotal * 0.05;
  const total = subtotal + tax;

  // ── Pay Now: intercept and show pilot modal ──────────────────────────────────

  const handlePayNow = (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    setShowPilotModal(true);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {showPilotModal && (
        <PilotNoticeModal
          paymentMethod={paymentMethod}
          onClose={() => setShowPilotModal(false)}
        />
      )}

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
                <button
                  onClick={handleClearCart}
                  className="text-xs flex items-center gap-1.5 text-rose-600 font-bold tracking-wide border border-rose-100 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 transition dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400"
                >
                  <Trash2 size={13} /> Clear Cart
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-12 border border-dashed border-slate-200 dark:border-slate-700 rounded-3xl mt-5">
                Your shopping cart is empty.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {cartItems.map((cartItem) => {
                  const item     = cartItem.item || {};
                  const itemId   = item._id || cartItem.item;
                  const imgSrc   = resolveImageSrc(item.imageUrl);
                  const title    = item.title    || 'Unnamed Item';
                  const category = item.category || '';
                  const seller   = item.owner
                    ? `${item.owner.firstName || ''} ${item.owner.lastName || ''}`.trim()
                    : '';
                  const price    = item.price || 0;
                  const qty      = cartItem.quantity || 1;

                  return (
                    <article
                      key={itemId || Math.random()}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-850 shadow-sm gap-4"
                    >
                      {/* LEFT: image + metadata (clickable → detail screen) */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        {/* Image */}
                        <Link
                          to={`/listings/${itemId}`}
                          className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center"
                          tabIndex={-1}
                          aria-label={`View details for ${title}`}
                        >
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextSibling && (e.currentTarget.nextSibling.style.display = 'flex');
                              }}
                            />
                          ) : null}
                          <span
                            className="text-[10px] text-slate-300 font-bold uppercase"
                            style={{ display: imgSrc ? 'none' : 'flex' }}
                          >
                            Item
                          </span>
                        </Link>

                        {/* Text metadata */}
                        <div className="flex-1 min-w-0">
                          {/* Title — clickable link to detail screen */}
                          <Link
                            to={`/listings/${itemId}`}
                            className="font-semibold text-slate-900 dark:text-white truncate text-base hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors block"
                          >
                            {title}
                          </Link>

                          {/* Category */}
                          {category && (
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mt-0.5">
                              {category}
                            </span>
                          )}

                          {/* Seller */}
                          {seller && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Sold by <span className="font-semibold text-slate-700 dark:text-slate-300">{seller}</span>
                            </p>
                          )}

                          {/* Unit price */}
                          <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm mt-1">
                            GHS {price.toFixed(2)}
                          </p>

                          {/* Quantity Controls */}
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateQuantity(itemId, qty - 1)}
                              className="rounded px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition font-bold text-sm"
                            >
                              −
                            </button>
                            <span className="w-6 text-center font-semibold text-xs text-slate-700 dark:text-slate-300">
                              {qty}
                            </span>
                            <button
                              onClick={() => handleUpdateQuantity(itemId, qty + 1)}
                              className="rounded px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition font-bold text-sm"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT: line-total + delete */}
                      <div className="text-right shrink-0 flex flex-col items-end justify-between h-20">
                        <p className="font-bold text-slate-900 dark:text-white text-sm">
                          GHS {(price * qty).toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleRemoveFromCart(itemId)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Remove Item"
                          aria-label={`Remove ${title} from cart`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  );
                })}
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
                <p className="text-slate-400 text-xs py-6 text-center w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl">
                  You haven't starred any services yet.
                </p>
              ) : (
                starredServices.map((svc) => {
                  const svcImgSrc = resolveImageSrc(svc.imageUrl || svc.image);
                  const svcSeller = svc.owner
                    ? `${svc.owner.firstName || ''} ${svc.owner.lastName || ''}`.trim()
                    : '';
                  return (
                    <Link
                      key={svc._id}
                      to={`/listings/${svc._id}`}
                      className="w-44 shrink-0 block no-underline snap-start"
                      aria-label={`View details for ${svc.title || 'service'}`}
                    >
                      <article
                        className="w-full h-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3.5 rounded-2xl shadow-sm flex flex-col justify-between space-y-3 hover:border-emerald-400 hover:shadow-md transition-all duration-200"
                      >
                        <div className="w-full h-24 bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-700 flex items-center justify-center">
                          {svcImgSrc ? (
                            <img
                              src={svcImgSrc}
                              alt={svc.title || 'Service image'}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextSibling && (e.currentTarget.nextSibling.style.display = 'flex');
                              }}
                            />
                          ) : null}
                          <span
                            className="text-[10px] text-slate-300 font-bold uppercase items-center justify-center"
                            style={{ display: svcImgSrc ? 'none' : 'flex' }}
                          >
                            Service
                          </span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {svc.title || 'Untitled Service'}
                          </h4>
                          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mt-0.5">
                            {svc.category || ''}
                          </span>
                          {svcSeller && (
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                              by <span className="font-semibold">{svcSeller}</span>
                            </p>
                          )}
                        </div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          GHS {typeof svc.price === 'number' ? svc.price.toFixed(2) : '0.00'}
                        </p>
                      </article>
                    </Link>
                  );
                })
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
                ['card', 'Credit / Debit Card',  CreditCard],
              ].map(([method, displayLabel, IconComponent]) => (
                <label
                  key={method}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                    paymentMethod === method
                      ? 'border-slate-900 bg-slate-50/50 dark:border-emerald-500 dark:bg-slate-700'
                      : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComponent
                      size={16}
                      className={paymentMethod === method ? 'text-slate-900 dark:text-emerald-400' : 'text-slate-400'}
                    />
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
            onClick={handlePayNow}
            disabled={loading || cartItems.length === 0}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 text-sm"
          >
            {loading ? 'Processing payment...' : 'Pay Now'}
          </button>
        </section>
      </main>
    </>
  );
}
