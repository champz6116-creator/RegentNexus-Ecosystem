import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// Auth Components
import AuthPage from './components/Auth/AuthPage';
import VerifyPage from './components/Auth/VerifyPage';

// Layout Components
import Header from './components/Layout/Header';
import Watermark from './components/Common/Watermark';
import AuthGuard from './components/Common/AuthGuard';
import FAB from './components/Common/FAB';
import AppShell from './components/Layout/AppShell';

// Main Components
import HomePage from './components/Home/HomePage';
import ListingsPage from './components/Listings/ListingsPage';
import DetailedScreen from './components/Listings/DetailedScreen';
import CartPage from './components/Cart/CartPage';
import TransactionsPage from './components/Transactions/TransactionsPage';
import ProfilePage from './components/Profile/ProfilePage';
import SettingsPage from './components/Settings/SettingsPage';
import MessagesPage from './components/Messages/MessagesPage';
import AdminPage from './components/Admin/AdminPage';
import HelpCenter from './components/Common/HelpCenter';

// ✅ Fixed Layout: Content passes through AppShell to reach the Outlet slot
function ProtectedLayout({ user, onSignOut }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white relative flex flex-col w-full">
      <Watermark />
      <Header user={user} onLogout={onSignOut} />
      
      <AppShell user={user} onSignOut={onSignOut}>
        <main className="relative z-10 w-full flex-1">
          <Outlet /> {/* 👈 Crucial! This is where HomePage, ListingsPage, etc. are injected */}
        </main>
      </AppShell>
      
      {user && <FAB />}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse user data', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleSignIn = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('pendingIdentifier');
    localStorage.removeItem('pendingMode');
    setToken(null);
    setUser(null);
  };

  const handleUserUpdate = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route
          path="/"
          element={user ? <Navigate to="/home" replace /> : <AuthPage onSignIn={handleSignIn} />}
        />
        <Route
          path="/verify"
          element={user ? <Navigate to="/home" replace /> : <VerifyPage onSignIn={handleSignIn} />}
        />

        {/* Protected Routes with Layout */}
        <Route
          element={
            <AuthGuard user={user}>
              <ProtectedLayout user={user} onSignOut={handleSignOut} />
            </AuthGuard>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/listings" element={<ListingsPage />} />
          
          {/* ✅ Updated line with user and onUpdateUser inputs */}
          <Route path="/listings/:itemId" element={<DetailedScreen user={user} onUpdateUser={handleUserUpdate} />} />
          
          <Route path="/cart" element={<CartPage user={user} />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/profile" element={<ProfilePage user={user} />} />
          <Route
            path="/settings"
            element={<SettingsPage user={user} onUpdate={handleUserUpdate} />}
          />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/help" element={<HelpCenter />} />
          {user?.role === 'admin' && <Route path="/admin" element={<AdminPage />} />}
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
