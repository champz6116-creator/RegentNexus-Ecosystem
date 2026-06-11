import { useMemo } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Receipt, LogOut, GraduationCap, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 pb-16 sm:pb-0">
      
      {/* Institutional Top Context Bar (Premium Minimalist Retail Finish) */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-4 py-3.5 backdrop-blur-md sm:px-6 shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          
          {/* Institutional Branding Unit */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center text-white font-black shrink-0 shadow-sm border border-slate-700/10">
              <GraduationCap size={20} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-black bg-gradient-to-r from-slate-950 to-slate-800 bg-clip-text text-transparent tracking-tight truncate max-w-[280px] sm:max-w-md lg:max-w-none">
                Regent University College of Science and Technology
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Sparkles size={11} className="text-emerald-600 fill-current" />
                <p className="text-xs font-semibold text-slate-500">
                  Welcome back, <span className="text-slate-800 font-bold">{user?.firstName || 'Student'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Right Actions - Contrast Layout Pill Buttons */}
          <nav className="hidden items-center gap-2.5 sm:flex shrink-0">
            <Link 
              to="/transactions" 
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-98"
            >
              <Receipt size={15} className="text-slate-400" />
              Transactions
            </Link>
            <button 
              onClick={onSignOut} 
              className="flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-xs sm:text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-98 shadow-sm shadow-slate-950/10"
            >
              <LogOut size={15} className="text-slate-400" />
              Sign out
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Viewport Frame */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      {/* Mobile Footer Sticky Utility Tray Panel */}
      <footer className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200/80 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-md sm:hidden">
        <nav className="flex items-center justify-between gap-3">
          <Link 
            to="/transactions" 
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 text-center text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-98"
          >
            <Receipt size={14} className="text-slate-400" />
            Transactions
          </Link>
          <button 
            onClick={onSignOut} 
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-slate-950 py-2.5 text-center text-xs font-bold text-white transition hover:bg-slate-800 active:scale-98"
          >
            <LogOut size={14} className="text-slate-400" />
            Sign out
          </button>
        </nav>
      </footer>
    </div>
  );
}