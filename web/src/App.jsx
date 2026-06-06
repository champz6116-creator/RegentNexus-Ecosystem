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
import PeerProfileView from './components/Profile/PeerProfileView';

function ProtectedLayout({ user, onSignOut }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white relative flex flex-col w-full">
      <Watermark />
      <Header user={user} onLogout={onSignOut} />
      
      <AppShell user={user} onSignOut={onSignOut}>
        <main className="relative z-10 w-full flex-1">
          <Outlet />
        </main>
      </AppShell>
      
      {user && <FAB />}
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse user session data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoadingAuth(false);
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

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400 text-xs font-bold uppercase tracking-widest">
        Loading RegentNexus Ecosystem...
      </div>
    );
  }

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
          <Route path="/listings/:itemId" element={<DetailedScreen user={user} onUpdateUser={handleUserUpdate} />} />
          <Route path="/cart" element={<CartPage user={user} />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          
          {/* Linked updates directly to global state */}
          <Route path="/profile" element={<ProfilePage user={user} onUpdateUser={handleUserUpdate} />} />
          <Route path="/settings" element={<SettingsPage user={user} onUpdate={handleUserUpdate} />} />
          
          <Route path="/messages" element={<MessagesPage user={user} />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/peer/:userId" element={<PeerProfileView currentAccount={user} />} />
          
          {/* Secure Workspace Route Protection Boundary */}
          <Route 
            path="/admin" 
            element={user?.role === 'admin' ? <AdminPage /> : <Navigate to="/home" replace />} 
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
