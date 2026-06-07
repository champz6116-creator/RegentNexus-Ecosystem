import { useMemo } from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function AppShell({ user, onSignOut }) {
  // Main navigation items array cleaned up for structural checks
  const navItems = useMemo(
    () => [
      { path: '/transactions', label: 'Transactions' },
      ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin' }] : []),
    ],
    [user]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          
          {/* School Name and Logo Integration */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
              R
            </div>
            <div>
              <p className="text-base font-bold text-slate-900 leading-tight sm:text-lg">
                Regent University College of Science and Technology
              </p>
              <p className="text-base font-medium">Welcome back, {user?.firstName}.</p>
            </div>
          </div>

          {/* Desktop Right Actions: Transactions directly beside Sign Out */}
          <nav className="hidden items-center gap-3 sm:flex">
            <Link 
              to="/transactions" 
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Transactions
            </Link>
            <button 
              onClick={onSignOut} 
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Viewport Frame */}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      {/* Mobile Footer Drawer Tray matching Code 1 style */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg shadow-slate-200/20 sm:hidden">
        <nav className="flex items-center justify-between gap-2">
          <Link 
            to="/transactions" 
            className="flex-1 rounded-3xl bg-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            Transactions
          </Link>
          <button 
            onClick={onSignOut} 
            className="flex-1 rounded-3xl bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Sign out
          </button>
        </nav>
      </footer>
    </div>
  );
}
