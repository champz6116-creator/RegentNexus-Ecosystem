import React, { useEffect, useState } from 'react';
import api from "../../api"; // Verified safe context tree depth path

export default function AdminPage() {
  const [currentTab, setCurrentTab] = useState('overview'); // Tab State Manager
  const [metrics, setMetrics] = useState({ users: 0, listings: 0, reports: 0, requests: 0 });
  const [users, setUsers] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Sync Global Diagnostic Dashboard Metrics
  useEffect(() => {
    const fetchAdminMetrics = async () => {
      try {
        const { data } = await api.get('/admin/dashboard-aggregations');
        setMetrics(data);
      } catch (error) {
        console.error('Could not load live analytics pipeline.', error);
      } finally {
        setLoadingMetrics(false);
      }
    };
    fetchAdminMetrics();
  }, [currentTab]);

  // Lazy load User Data Array only when moving to Users Tab
  useEffect(() => {
    if (currentTab === 'users') {
      setLoadingUsers(true);
      api.get('/admin/users')
        .then(({ data }) => setUsers(data))
        .catch(() => alert("Could not fetch active system identity directories."))
        .finally(() => setLoadingUsers(false));
    }
  }, [currentTab]);

  // Handle Account Constraint Actions (Ban / Deactivate Account Logic)
  const handleToggleBan = async (id) => {
    try {
      await api.post(`/admin/users/${id}/ban`);
      // Matches your layout configuration to toggle state immediately in the UI matrix
      setUsers(users.map(u => u._id === id ? { ...u, active: !u.active } : u));
      alert("User lifecycle restriction state updated successfully.");
    } catch {
      alert("Could not update user platform clearance status.");
    }
  };

  // --- RENDERING ROUTE PATH LAYOUTS USING HTML TAGS ---

  // Sub-Screen A: Main Overview Display Node
  const renderOverview = () => {
    if (loadingMetrics) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        </div>
      );
    }

    const dashItems = [
      { label: 'Total Users', value: metrics.users, target: 'users' },
      { label: 'Active Listings', value: metrics.listings, target: 'listings' },
      { label: 'Pending Reports', value: metrics.reports, target: 'reports' },
      { label: 'Pending Requests', value: metrics.requests, target: 'requests' },
    ];

    return (
      <div className="grid grid-cols-2 gap-4 mt-2">
        {dashItems.map((card) => (
          <button
            key={card.label}
            onClick={() => card.target === 'users' && setCurrentTab('users')}
            disabled={card.target !== 'users'} // Throttled safely until remaining fragments are configured
            className="p-5 text-left rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm transition duration-200 enabled:hover:scale-[1.02] disabled:opacity-80"
          >
            <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400">{card.label}</span>
            <span className="block text-3xl font-extrabold text-slate-900 dark:text-white mt-4">{card.value}</span>
          </button>
        ))}
      </div>
    );
  };

  // Sub-Screen B: User Directory Ledger Panel (Replaces FlatList with simple map array loop)
  const renderUsersScreen = () => {
    if (loadingUsers) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        </div>
      );
    }

    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">System Identity Ledger</h2>
          <button 
            onClick={() => setCurrentTab('overview')} 
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg transition"
          >
            ← Back
          </button>
        </div>

        <div className="space-y-3">
          {users.map((item) => (
            <div 
              key={item._id} 
              className="p-4 rounded-2xl bg-white dark:bg-slate-900 flex justify-between items-center border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">{item.firstName} {item.lastName}</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{item.schoolMail}</p>
              </div>
              <button 
                onClick={() => handleToggleBan(item._id)} 
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition duration-150 hover:opacity-90`}
                style={{ backgroundColor: !item.active ? '#10b981' : '#ef4444' }}
              >
                {!item.active ? 'Unban' : 'Ban Account'}
              </button>
            </div>
          ))}
          {users.length === 0 && (
            <p className="text-center py-6 text-slate-400 text-sm">No registered student identities matched.</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full p-6 bg-slate-50 dark:bg-slate-950 pt-12">
      <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-6">Governance Terminal</h1>
      {currentTab === 'overview' ? renderOverview() : renderUsersScreen()}
    </div>
  );
}
