import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, MessageSquare, Settings, LogOut, Menu, X, Moon, Sun, Store, ShieldCheck } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';

export default function Header({ user, onLogout }) {
  const [isDark, setIsDark] = useDarkMode();
  const location = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navItems = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/listings', label: 'Listings', icon: Store },
    { path: '/cart', label: 'Cart', icon: ShoppingCart, hasBadge: true },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/settings', label: 'Settings', icon: Settings },
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: ShieldCheck }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Sticky Top Premium Navigation Panel with Soft Color Tint */}
      <header className="sticky top-0 z-40 w-full border-b border-emerald-100/40 dark:border-emerald-950/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left Action: Mobile Hamburger Menu Trigger */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="p-2 -ml-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-slate-800/60 transition md:hidden"
                aria-label="Open navigation menu"
              >
                <Menu size={22} />
              </button>

              {/* Logo Identity Unit - Blending Green & Orange Accents */}
              <Link to="/home" className="flex items-center gap-2.5 font-black text-xl text-slate-900 dark:text-white tracking-tight group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-emerald-700 flex items-center justify-center text-white font-black shadow-md shadow-emerald-600/10 group-hover:rotate-3 transition-transform">
                  R
                </div>
                <span className="bg-gradient-to-r from-emerald-600 to-slate-900 dark:from-white dark:to-slate-300 bg-clip-text text-transparent hidden sm:inline font-black tracking-tight">
                  Regent Marketplace
                </span>
              </Link>
            </div>

            {/* Middle Section: Desktop Inline Navigation Links with Premium Highlight States */}
            <nav className="hidden md:flex items-center gap-1.5">
              {navItems.map(({ path, label, icon: Icon, hasBadge }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm tracking-wide transition relative group ${
                    isActive(path)
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon size={17} className={isActive(path) ? 'animate-pulse' : 'text-slate-400 dark:text-slate-500 group-hover:text-emerald-500 transition-colors'} />
                  <span>{label}</span>
                  
                  {/* Floating Notification Indicator Badge - High Visual Impact Amber Counter */}
                  {hasBadge && (
                    <span className={`absolute top-1 right-1.5 h-2 w-2 rounded-full ${isActive(path) ? 'bg-amber-400' : 'bg-amber-500 animate-pulse'}`} />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Side Control Interface Action Layout */}
            <div className="flex items-center gap-2">
              
              {/* Theme Toggle Button */}
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-emerald-50/50 dark:hover:bg-slate-800/50 border border-transparent transition"
                title="Toggle visual style display theme mode"
              >
                {isDark ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} />}
              </button>

              {/* Dynamic User Authentication Workspace Profile Meta Block */}
              {user && (
                <div className="flex items-center gap-3 pl-2.5 border-l border-slate-200 dark:border-slate-800">
                  <div className="text-right hidden lg:block">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                      {user.firstName}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mt-0.5">
                      {user.role === 'admin' ? 'Admin' : 'Student'}
                    </p>
                  </div>

                  {user.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.firstName}
                      className="w-9 h-9 rounded-xl object-cover border border-emerald-100 dark:border-slate-700 shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-sm flex items-center justify-center border border-emerald-100/30 dark:border-slate-700/60 shrink-0">
                      {user.firstName?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Standard Logout Action Hook Button */}
                  <button
                    onClick={onLogout}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent transition"
                    title="Sign out of account"
                  >
                    <LogOut size={19} />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* Slide-out Mobile Overlay Sidebar Drawer (YouTube/WooCommerce Style Hybrid) */}
      <div className={`fixed inset-0 z-50 transition-all duration-300 md:hidden ${showMobileMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Backdrop Mask Blur */}
        <div 
          className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
          onClick={() => setShowMobileMenu(false)}
        />
        
        {/* Nav Drawer Menu Content Sheet Panel container */}
        <aside className={`absolute top-0 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="space-y-6">
            
            {/* Mobile Drawer Identity Heading & Close Trigger Button Layout Row */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-black text-slate-950 dark:text-white text-base tracking-tight">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-xs">R</div>
                <span className="text-slate-900 dark:text-white">Navigation</span>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700/50"
              >
                <X size={16} />
              </button>
            </div>

            {/* Mobile Drawer Link Navigation Lists Stream Stack */}
            <nav className="space-y-1">
              {navItems.map(({ path, label, icon: Icon, hasBadge }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setShowMobileMenu(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm tracking-wide transition ${
                    isActive(path)
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-emerald-50/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive(path) ? 'text-white' : 'text-slate-400 dark:text-slate-500'} />
                    <span>{label}</span>
                  </div>
                  {hasBadge && (
                    <span className={`h-2 w-2 rounded-full ${isActive(path) ? 'bg-amber-400' : 'bg-amber-500 animate-pulse'}`} />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Mobile Side Drawer Account Footer Block Metadata Profile card representation */}
          {user && (
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={user.firstName}
                    className="w-9 h-9 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center shrink-0">
                    {user.firstName?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                    {user.firstName}
                  </p>
                  <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 tracking-wide uppercase truncate">
                    {user.role === 'admin' ? 'Administrator' : 'Student'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMobileMenu(false);
                  onLogout();
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}