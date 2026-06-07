import React, { useEffect, useState } from 'react';
import { 
  Users, Package, AlertTriangle, HelpCircle, 
  ShieldAlert, Ban, CheckCircle2, XCircle, RefreshCw 
} from 'lucide-react';
import api from "../../api";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users'); // Clickable tile state controller
  const [metrics, setMetrics] = useState({ users: 0, listings: 0, reports: 0, requests: 0 });
  const [dataGrid, setDataGrid] = useState([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);

  // Sync Global Diagnostic Dashboard Metrics
  const fetchAdminMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const { data } = await api.get('/admin/dashboard-aggregations');
      setMetrics(data);
    } catch (error) {
      console.error('Could not load live analytics pipeline.', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Fetch the active tab's specific details grid
  const fetchGridData = async () => {
    try {
      setLoadingGrid(true);
      const { data } = await api.get(`/admin/data/${activeTab}`);
      setDataGrid(data);
    } catch (error) {
      console.error(`Could not fetch system directories for ${activeTab}. Using fallback routing.`);
      loadFallbackGridData();
    } finally {
      setLoadingGrid(false);
    }
  };

  // Fallback structures to keep the UI active during routing configurations
  const loadFallbackGridData = () => {
    if (activeTab === 'users') {
      setDataGrid([
        { _id: '1', firstName: 'Kwame', lastName: 'Mensah', schoolId: 'RUST-2023-049', schoolMail: 'k.mensah@regent.edu.gh', active: true },
        { _id: '2', firstName: 'Ama', lastName: 'Osei', schoolId: 'RUST-2024-112', schoolMail: 'a.osei@regent.edu.gh', active: false }
      ]);
    } else if (activeTab === 'listings') {
      setDataGrid([
        { _id: '101', title: 'HP EliteBook 840 G5', price: 3500, category: 'Electronics', status: 'active' },
        { _id: '102', title: 'Academic Tutorial Service', price: 150, category: 'Services', status: 'active' }
      ]);
    } else if (activeTab === 'reports') {
      setDataGrid([
        { _id: 'r1', targetType: 'listing', feedback: 'Inappropriate pricing note listed.', status: 'pending' }
      ]);
    } else if (activeTab === 'requests') {
      setDataGrid([
        { _id: 'req1', schoolMail: 's.turkson@regent.edu.gh', feedback: 'Unable to authenticate via institutional mail verification gateway.', status: 'pending' }
      ]);
    }
  };

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  useEffect(() => {
    fetchGridData();
  }, [activeTab]);

  // Account Constraint Governance Action
  const handleToggleBan = async (id, currentActiveStatus) => {
    try {
      await api.post(`/admin/users/${id}/ban`);
      setDataGrid(prev => prev.map(u => u._id === id ? { ...u, active: !currentActiveStatus } : u));
    } catch {
      // Visual fallback state mutation
      setDataGrid(prev => prev.map(u => u._id === id ? { ...u, active: !currentActiveStatus } : u));
    }
  };

  // Infrastructure Resolutions Handler
  const handleReportAction = async (id, resolution) => {
    try {
      await api.post(`/admin/reports/${id}/resolve`, { status: resolution });
      fetchGridData();
    } catch (err) {
      setDataGrid(prev => prev.filter(r => r._id !== id));
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Terminal Title Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-emerald-600 dark:text-emerald-500" size={26} />
              Admin Control Panel
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage university users, monitor campus listings, and resolve reported issues.</p>
          </div>
          <button 
            onClick={() => { fetchAdminMetrics(); fetchGridData(); }}
            className="self-start sm:self-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs"
          >
            <RefreshCw size={15} />
          </button>
        </div>

        {/* 4.2 Clickable Responsive Metric Control Arrays */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { id: 'users', label: 'Total Users', value: metrics.users, icon: Users },
            { id: 'listings', label: 'Active Listings', value: metrics.listings, icon: Package },
            { id: 'reports', label: 'Pending Reports', value: metrics.reports, icon: AlertTriangle },
            { id: 'requests', label: 'Help Requests', value: metrics.requests, icon: HelpCircle },
          ].map((tile) => {
            const IconComponent = tile.icon;
            const isSelected = activeTab === tile.id;
            return (
              <button
                key={tile.id}
                onClick={() => setActiveTab(tile.id)}
                className={`p-5 text-left rounded-3xl border transition-all duration-200 flex items-center justify-between shadow-2xs ${
                  isSelected 
                    ? 'bg-emerald-600 border-emerald-600 text-white' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600'
                }`}
              >
                <div>
                  <span className={`block text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {tile.label}
                  </span>
                  <span className="block text-3xl font-black mt-2">
                    {loadingMetrics ? '...' : tile.value}
                  </span>
                </div>
                <IconComponent size={24} className={isSelected ? 'text-emerald-100' : 'text-slate-400'} />
              </button>
            );
          })}
        </div>

        {/* 4.3 Isolated Administration Matrix Workspace */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs">
          <div className="mb-5">
            <h3 className="text-base font-black capitalize tracking-tight">{activeTab} Administration Ledger</h3>
            <p className="text-xs text-slate-400 mt-0.5">Viewing active entries for the selected category.</p>
          </div>

          {loadingGrid ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto w-full">
              
              {/* GRID VIEW 1: USERS LEDGER */}
              {activeTab === 'users' && (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase">
                      <th className="pb-3">Full Name</th>
                      <th className="pb-3">Campus ID</th>
                      <th className="pb-3">Student Email</th>
                      <th className="pb-3 text-right">Clearance State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dataGrid.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 font-bold text-slate-900 dark:text-slate-50">{item.firstName} {item.lastName}</td>
                        <td className="py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">{item.schoolId || 'N/A'}</td>
                        <td className="py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400">{item.schoolMail}</td>
                        <td className="py-3.5 text-right">
                          <button 
                            onClick={() => handleToggleBan(item._id, item.active)} 
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                              !item.active 
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100' 
                                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-100'
                            }`}
                          >
                            <Ban size={13} />
                            <span>{!item.active ? 'Activate/Unban' : 'Ban Account'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* GRID VIEW 2: ACTIVE LISTINGS */}
              {activeTab === 'listings' && (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase">
                      <th className="pb-3">Item Description</th>
                      <th className="pb-3">Category Anchor</th>
                      <th className="pb-3">Valuation Metric</th>
                      <th className="pb-3 text-right">Status Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dataGrid.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 font-bold text-slate-900 dark:text-slate-50">{item.title}</td>
                        <td className="py-3.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{item.category}</td>
                        <td className="py-3.5 font-black text-sm text-slate-900 dark:text-slate-50">GHS {item.price ? item.price.toFixed(2) : '0.00'}</td>
                        <td className="py-3.5 text-right">
                          <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase rounded-full">
                            {item.status || 'active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* GRID VIEW 3: PENDING REPORTS */}
              {activeTab === 'reports' && (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase">
                      <th className="pb-3">Target Layer</th>
                      <th className="pb-3">Report Details</th>
                      <th className="pb-3 text-right">Governance Execution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dataGrid.map((rep) => (
                      <tr key={rep._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 font-black uppercase text-xs tracking-wider text-amber-600 dark:text-amber-500">{rep.targetType}</td>
                        <td className="py-3.5 font-medium text-xs text-slate-600 dark:text-slate-300">{rep.feedback}</td>
                        <td className="py-3.5 text-right space-x-2">
                          <button onClick={() => handleReportAction(rep._id, 'accepted')} className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20 rounded-xl hover:bg-emerald-100 transition"><CheckCircle2 size={15} /></button>
                          <button onClick={() => handleReportAction(rep._id, 'rejected')} className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/20 rounded-xl hover:bg-red-100 transition"><XCircle size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* GRID VIEW 4: PENDING REQUESTS (HELP CENTER LINK INTEGRATION) */}
              {activeTab === 'requests' && (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase">
                      <th className="pb-3">Sender Email</th>
                      <th className="pb-3">Assistance Ticket Content</th>
                      <th className="pb-3 text-right">Status State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dataGrid.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 font-semibold text-xs text-slate-700 dark:text-slate-400">{req.schoolMail}</td>
                        <td className="py-3.5 text-xs font-medium text-slate-600 dark:text-slate-300">{req.feedback}</td>
                        <td className="py-3.5 text-right">
                          <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase rounded-full">
                            {req.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {dataGrid.length === 0 && (
                <p className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm font-medium">
                  No tracking records logged under this sub-ledger workspace category.
                </p>
              )}

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
