import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; 
import { 
  Users, Package, AlertTriangle, HelpCircle, 
  ShieldAlert, Ban, CheckCircle2, XCircle, RefreshCw, Search
} from 'lucide-react';
import api from "../../api";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users'); 
  const [metrics, setMetrics] = useState({ users: 0, listings: 0, reports: 0, requests: 0 });
  const [dataGrid, setDataGrid] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [processingId, setProcessingId] = useState(null); // Prevents UI race conditions during administrative operations

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

  const fetchGridData = async () => {
    try {
      setLoadingGrid(true);
      const { data } = await api.get(`/admin/data/${activeTab}`);
      setDataGrid(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(`Could not fetch system directories for ${activeTab}.`, error);
      setDataGrid([]); 
    } finally {
      setLoadingGrid(false);
    }
  };

  const triggerGlobalSync = async () => {
    await Promise.all([fetchAdminMetrics(), fetchGridData()]);
  };

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  useEffect(() => {
    fetchGridData();
    setSearchQuery(''); 
  }, [activeTab]);

  const handleToggleBan = async (id) => {
    try {
      setProcessingId(id);
      await api.post(`/admin/users/${id}/ban`);
      await triggerGlobalSync(); 
    } catch (err) {
      console.error("Account governance operation faulted.", err);
      alert(err.response?.data?.message || "Failed to update account clearance state.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReportAction = async (id, resolution) => {
    try {
      setProcessingId(id);
      await api.post(`/admin/reports/${id}/resolve`, { status: resolution });
      await triggerGlobalSync(); 
    } catch (err) {
      console.error("Report management operation faulted.", err);
      alert(err.response?.data?.message || "Failed to process content report action.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveTicket = async (id, resolutionState) => {
    try {
      setProcessingId(id);
      await api.post(`/admin/requests/${id}/resolve`, { status: resolutionState });
      await triggerGlobalSync();
    } catch (err) {
      console.error("Help center lifecycle adjustment faulted.", err);
      alert(err.response?.data?.message || "Failed to adjust help ticket status.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredDataGrid = dataGrid.filter((item) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();

    if (activeTab === 'users') {
      const fullName = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase();
      const studentId = (item.schoolId || '').toLowerCase();
      return fullName.includes(query) || studentId.includes(query);
    }
    if (activeTab === 'listings') {
      return (item.title || '').toLowerCase().includes(query);
    }
    if (activeTab === 'reports') {
      return (item.feedback || '').toLowerCase().includes(query) || (item.targetType || '').toLowerCase().includes(query);
    }
    if (activeTab === 'requests') {
      return (item.schoolMail || '').toLowerCase().includes(query) || (item.feedback || '').toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        
        {/* Title Banner */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-emerald-600 dark:text-emerald-500" size={26} />
              Admin Control Panel
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage university users, monitor campus listings, and resolve reported issues.</p>
          </div>
          <button 
            onClick={triggerGlobalSync}
            disabled={loadingGrid || loadingMetrics}
            className="self-start sm:self-center p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-50"
          >
            <RefreshCw size={15} className={loadingGrid || loadingMetrics ? "animate-spin" : ""} />
          </button>
        </div>

        {/* Metric Navigation Tiles */}
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

        {/* Administration Ledger Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs">
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-black capitalize tracking-tight">{activeTab} Administration Ledger</h3>
              <p className="text-xs text-slate-400 mt-0.5">Viewing real-time records sourced straight from the cloud engine.</p>
            </div>
            
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search size={16} />
              </span>
              <input 
                type="text"
                placeholder={`Search current grid segment...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-hidden focus:border-emerald-500 transition-colors font-medium"
              />
            </div>
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
                    {filteredDataGrid.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 font-bold">
                          <Link 
                            to={`/peer/${item._id}`} 
                            className="text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
                          >
                            {item.firstName} {item.lastName}
                          </Link>
                        </td>
                        <td className="py-3.5 font-mono text-xs text-slate-500 dark:text-slate-400">{item.schoolId || 'N/A'}</td>
                        <td className="py-3.5 text-xs font-semibold text-slate-600 dark:text-slate-400">{item.schoolMail}</td>
                        <td className="py-3.5 text-right">
                          <button 
                            onClick={() => handleToggleBan(item._id)} 
                            disabled={processingId === item._id}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border disabled:opacity-50 ${
                              !item.active 
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100' 
                                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-100'
                            }`}
                          >
                            <Ban size={13} />
                            <span>{processingId === item._id ? 'Updating...' : (!item.active ? 'Activate / Unban' : 'Ban Account')}</span>
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
                    {filteredDataGrid.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 font-bold">
                          <Link 
                            to={`/listings/${item._id}`} 
                            className="text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
                          >
                            {item.title}
                          </Link>
                        </td>
                        <td className="py-3.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{item.category}</td>
                        <td className="py-3.5 font-black text-sm text-slate-900 dark:text-slate-50">
                          GHS {item.price && !isNaN(Number(item.price)) ? Number(item.price).toFixed(2) : '0.00'}
                        </td>
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
                    {filteredDataGrid.map((rep) => (
                      <tr key={rep._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 font-black uppercase text-xs tracking-wider text-amber-600 dark:text-amber-500">{rep.targetType}</td>
                        <td className="py-3.5 font-medium text-xs text-slate-600 dark:text-slate-300">{rep.feedback}</td>
                        <td className="py-3.5 text-right space-x-2">
                          <button 
                            disabled={processingId === rep._id}
                            onClick={() => handleReportAction(rep._id, 'accepted')} 
                            className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200/20 rounded-xl hover:bg-emerald-100 transition disabled:opacity-50"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                          <button 
                            disabled={processingId === rep._id}
                            onClick={() => handleReportAction(rep._id, 'rejected')} 
                            className="p-1.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200/20 rounded-xl hover:bg-red-100 transition disabled:opacity-50"
                          >
                            <XCircle size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* GRID VIEW 4: HELP CENTER LOGS */}
              {activeTab === 'requests' && (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase">
                      <th className="pb-3">Sender Email</th>
                      <th className="pb-3">Assistance Ticket Content</th>
                      <th className="pb-3 text-right">Lifecycle Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDataGrid.map((req) => (
                      <tr key={req._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 font-semibold text-xs text-slate-700 dark:text-slate-400">{req.schoolMail}</td>
                        <td className="py-3.5 text-xs font-medium text-slate-600 dark:text-slate-300">{req.feedback}</td>
                        <td className="py-3.5 text-right">
                          {req.status === 'pending' ? (
                            <div className="inline-flex space-x-2">
                              <button 
                                disabled={processingId === req._id}
                                onClick={() => handleResolveTicket(req._id, 'resolved')}
                                className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-100 transition disabled:opacity-50"
                              >
                                {processingId === req._id ? 'Working...' : 'Mark Resolved'}
                              </button>
                              <button 
                                disabled={processingId === req._id}
                                onClick={() => handleResolveTicket(req._id, 'rejected')}
                                className="px-2.5 py-1 text-[10px] font-bold bg-red-50 dark:bg-red-950/20 border border-red-200 text-red-600 rounded-lg hover:bg-red-100 transition disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className={`px-2.5 py-0.5 border text-[10px] font-black uppercase rounded-full ${
                              req.status === 'resolved' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200/40' 
                                : 'bg-slate-50 text-slate-500 border-slate-200/40'
                            }`}>
                              {req.status}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {filteredDataGrid.length === 0 && (
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
