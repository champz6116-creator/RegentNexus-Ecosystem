import { useState } from 'react'; // 1. ✅ Added useState import
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, MessageSquare, Settings, LogOut, Menu, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../../hooks/useDarkMode';

export default function Header({ user, onLogout }) {
  const [isDark, setIsDark] = useDarkMode();
  const location = useLocation();
  
  // 2. ✅ FIXED: Changed '= true' to proper 'useState(false)' state hook
  const [showMobileMenu, setShowMobileMenu] = useState(false); 

  const navItems = [
    { path: '/home', label: 'Home', icon: Home },
    { path: '/listings', label: 'Listings', icon: ShoppingCart },
    { path: '/cart', label: 'Cart', icon: ShoppingCart },
    { path: '/messages', label: 'Messages', icon: MessageSquare },
    { path: '/settings', label: 'Settings', icon: Settings },
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: Home }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/home" className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-white">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="hidden sm:inline">Regent Nexus</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                  isActive(path)
                    ? 'bg-emerald-500 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Section: Dark Mode & Profile */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle dark mode"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Profile Section */}
            {user && (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.firstName}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {user.role === 'admin' ? 'Administrator' : 'Student'}
                  </p>
                </div>

                {user.profileImage && (
                  <img
                    src={user.profileImage}
                    alt={user.firstName}
                    className="w-8 h-8 rounded-full object-cover border-2 border-slate-200 dark:border-slate-700"
                  />
                )}

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4 flex gap-2 overflow-x-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition ${
                isActive(path)
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
