import { useMemo } from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function AppShell({ user, onSignOut }) {
  const navItems = useMemo(
    () => [
      { path: '/home', label: 'Home' },
      { path: '/listings', label: 'Listings' },
      { path: '/transactions', label: 'Transactions' },
      { path: '/settings', label: 'Settings' },
      { path: '/messages', label: 'Messages' },
      ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin' }] : []),
    ],
    [user]
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xl font-semibold text-slate-900">Regent Nexus</p>
            <p className="text-sm text-slate-500">Welcome back, {user.firstName}.</p>
          </div>
          <nav className="hidden items-center gap-3 sm:flex">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">
                {item.label}
              </Link>
            ))}
            <button onClick={onSignOut} className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700">
              Sign out
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-lg shadow-slate-200/20 sm:hidden">
        <nav className="flex items-center justify-between gap-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="flex-1 rounded-3xl bg-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-200">
              {item.label}
            </Link>
          ))}
        </nav>
      </footer>
    </div>
  );
}
