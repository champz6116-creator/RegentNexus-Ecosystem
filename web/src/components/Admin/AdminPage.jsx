import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; 
import { 
  Users, Package, AlertTriangle, HelpCircle, Save,
  ShieldAlert, Ban, RefreshCw, Search, Eye,
  FileText, Download 
} from 'lucide-react';
import api from "../../api";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users'); 
  const [metrics, setMetrics] = useState({ users: 0, listings: 0, reports: 0, requests: 0 });
  const [dataGrid, setDataGrid] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); 
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Feature States
  const [selectedReport, setSelectedReport] = useState(null);
  const [stickyNotes, setStickyNotes] = useState({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('summary');
  const [generatedReportData, setGeneratedReportData] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Export File Configurations
  const [customFileName, setCustomFileName] = useState('');
  const [exportFormat, setExportFormat] = useState('excel');

  const fetchAdminMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const { data } = await api.get('/admin/dashboard-aggregations');
      setMetrics(data);
    } catch (error) {
      console.error('Could not load dashboard metrics.', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const fetchGridData = async () => {
    try {
      setLoadingGrid(true);
      const { data } = await api.get(`/admin/data/${activeTab}`);
      const fallbackArray = Array.isArray(data) ? data : [];
      setDataGrid(fallbackArray);

      if (activeTab === 'users') {
        const notesMap = {};
        fallbackArray.forEach(u => { notesMap[u._id] = u.adminNote || ''; });
        setStickyNotes(notesMap);
      }
    } catch (error) {
      console.error(`Could not fetch data for ${activeTab}.`, error);
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
      console.error("Account status change failed.", err);
      alert(err.response?.data?.message || "Failed to update user status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveStickyNote = async (id) => {
    try {
      setProcessingId(id);
      await api.post(`/admin/users/${id}/note`, { adminNote: stickyNotes[id] });
      alert("Note saved successfully.");
    } catch (err) {
      console.error("Failed to save admin note.", err);
      alert("Error saving note details.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolveReportCascade = async (id, actionType) => {
    try {
      setProcessingId(id);
      await api.post(`/admin/reports/${id}/resolve`, { actionType });
      setSelectedReport(null);
      await triggerGlobalSync(); 
    } catch (err) {
      console.error("Report response failed.", err);
      alert(err.response?.data?.message || "Failed to handle report.");
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
      console.error("Help request update failed.", err);
      alert(err.response?.data?.message || "Failed to update help request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerateSystemReport = async () => {
    try {
      setLoadingGrid(true); 
      const { data } = await api.get(`/admin/reports/generate?type=${selectedReportType}`);
      setGeneratedReportData(data); 
      
      const defaultName = `Marketplace_${selectedReportType}_Report_${new Date().toISOString().split('T')[0]}`;
      setCustomFileName(defaultName);
    } catch (error) {
      console.error("Report generation failed.", error);
      alert("Failed to create system report data.");
    } finally {
      setLoadingGrid(false);
    }
  };

  const handleExportDataFile = async () => {
    if (!selectedReportType) {
      alert("Please select a report type first.");
      return;
    }
    
    setDownloadingReport(true); 

    try {
      const response = await api.get(`/admin/export/download?type=${selectedReportType}&format=${exportFormat}`, {
        // We still need this to catch the actual file
        responseType: 'blob' 
      });

      // CRITICAL FIX: Check if the backend sent a JSON error instead of a file
      if (response.data && response.data.type === 'application/json') {
        // Convert the blob back to text to read the error
        const errorText = await response.data.text();
        const errorObj = JSON.parse(errorText);
        throw new Error(errorObj.message || "The server encountered an error generating the file.");
      }

      const defaultName = `Marketplace_${selectedReportType}_Report_${new Date().toISOString().split('T')[0]}`;
      const finalFileName = (customFileName?.trim() || defaultName).replace(/[/\\?%*:|"<>]/g, '-');
      
      let extension = 'json';
      let mimeType = 'application/json';
      
      if (exportFormat === 'word') {
        extension = 'docx';
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (exportFormat === 'excel') {
        extension = 'xlsx';
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (exportFormat === 'csv') {
        extension = 'csv';
        mimeType = 'text/csv;charset=utf-8;';
      }

      // Create the file package
      const blob = new Blob([response.data], { type: mimeType });
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Trigger download
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${finalFileName}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 10000);

    } catch (err) {
      console.error("Download processing broke:", err);
      // This will now correctly display the backend's hidden error message
      alert(`Export error: ${err.message || "Could not format file contents from backend."}`);
    } finally {
      setDownloadingReport(false);
      setShowReportModal(false);
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
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-slate-900 dark:text-white">
              <ShieldAlert className="text-emerald-600 dark:text-emerald-500" size={26} />
              Admin Control Panel
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage university users, monitor campus listings, and resolve reported issues.</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => { setShowReportModal(true); setGeneratedReportData(null); }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition shadow-sm"
            >
              <FileText size={14} />
              <span>Generate Reports</span>
            </button>
            <button 
              onClick={triggerGlobalSync}
              disabled={loadingGrid || loadingMetrics}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs disabled:opacity-50"
            >
              <RefreshCw size={15} className={loadingGrid || loadingMetrics ? "animate-spin" : ""} />
            </button>
          </div>
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
              <h3 className="text-base font-black capitalize tracking-tight">{activeTab} Directory List</h3>
              <p className="text-xs text-slate-400 mt-0.5">Viewing real-time records sourced straight from the backend database.</p>
            </div>
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search size={16} />
              </span>
              <input 
                type="text"
                placeholder={`Search current list...`}
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
              {activeTab === 'users' && (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase">
                      <th className="pb-3">Full Name</th>
                      <th className="pb-3">Campus ID / Mail</th>
                      <th className="pb-3 max-w-xs">Admin Memo Notes</th>
                      <th className="pb-3 text-right">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDataGrid.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 font-bold">
                          <Link to={`/peer/${item._id}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">
                            {item.firstName} {item.lastName}
                          </Link>
                        </td>
                        <td className="py-3.5">
                          <div className="font-mono text-xs text-slate-500 dark:text-slate-400">{item.schoolId || 'N/A'}</div>
                          <div className="text-[11px] text-slate-400">{item.schoolMail}</div>
                        </td>
                        <td className="py-3.5 max-w-xs">
                          <div className="flex items-center gap-1.5 pr-4">
                            <input
                              type="text"
                              value={stickyNotes[item._id] || ''}
                              placeholder="Type a private admin note..."
                              onChange={(e) => setStickyNotes({ ...stickyNotes, [item._id]: e.target.value })}
                              className="w-full px-2 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:border-amber-500 font-medium"
                            />
                            <button
                              onClick={() => handleSaveStickyNote(item._id)}
                              disabled={processingId === item._id}
                              className="p-1.5 text-slate-400 hover:text-amber-600 transition"
                              title="Save Note"
                            >
                              <Save size={14} />
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 text-right">
                          <button 
                            onClick={() => handleToggleBan(item._id)} 
                            disabled={processingId === item._id}
                            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition border ${
                              !item.active 
                                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100' 
                                : 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/60 text-red-600 dark:text-red-400 hover:bg-red-100'
                            }`}
                          >
                            <Ban size={13} />
                            <span>{!item.active ? 'Activate Account' : 'Ban User'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'listings' && (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase">
                      <th className="pb-3">Item Name</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDataGrid.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5 font-bold">
                          <Link to={`/listings/${item._id}`} className="text-emerald-600 dark:text-emerald-400 hover:underline">
                            {item.title}
                          </Link>
                        </td>
                        <td className="py-3.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">{item.category}</td>
                        <td className="py-3.5 font-black text-sm text-slate-900 dark:text-slate-50">
                          GHS {item.price && !isNaN(Number(item.price)) ? Number(item.price).toFixed(2) : '0.00'}
                        </td>
                        <td className="py-3.5 text-right">
                          <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-black uppercase rounded-full border border-emerald-200/40 dark:border-emerald-800/40">
                            {item.status || 'active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'reports' && (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase">
                      <th className="pb-3">Reported Item Type</th>
                      <th className="pb-3">Reason / Details</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredDataGrid.map((rep) => (
                      <tr key={rep._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="py-3.5">
                          <span className="font-bold text-slate-900 dark:text-white capitalize">{rep.targetType}</span>
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]" title={rep.targetData || rep.targetId}>
                            {rep.targetData || `ID: ${rep.targetId}`}
                          </div>
                        </td>
                        <td className="py-3.5 font-medium text-xs text-slate-600 dark:text-slate-300 max-w-md truncate">{rep.feedback}</td>
                        <td className="py-3.5 text-xs capitalize font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${rep.status === 'pending' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>
                            {rep.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button 
                            onClick={() => setSelectedReport(rep)} 
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
                          >
                            <Eye size={13} />
                            <span>Review Report</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 'requests' && (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase">
                      <th className="pb-3">User Email</th>
                      <th className="pb-3">Message Content</th>
                      <th className="pb-3 text-right">Manage Status</th>
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
                                className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 rounded-lg hover:bg-emerald-100 transition"
                              >
                                Mark Resolved
                              </button>
                              <button 
                                disabled={processingId === req._id}
                                onClick={() => handleResolveTicket(req._id, 'rejected')}
                                className="px-2.5 py-1 text-[10px] font-bold bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 text-red-600 rounded-lg hover:bg-red-100 transition"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className={`px-2.5 py-0.5 border text-[10px] font-black uppercase rounded-full ${
                              req.status === 'resolved' 
                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/40 dark:border-emerald-800/40' 
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200/40 dark:border-slate-700'
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
                  No records found in this category.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* OVERLAY VIEW: REPORT REVIEW MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-black text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md">
                  Review Module
                </span>
                <h3 className="text-base font-black mt-1 text-slate-900 dark:text-slate-50">
                  Reported Item: {selectedReport.targetType}
                </h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕ Close</button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 mb-6 border border-slate-100 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-300 max-h-48 overflow-y-auto">
              <strong>Reported Reason & Details:</strong>
              <p className="mt-1.5 italic">"{selectedReport.feedback}"</p>
            </div>

            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Choose Resolution Action:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  disabled={processingId === selectedReport._id}
                  onClick={() => handleResolveReportCascade(selectedReport._id, 'dismiss')}
                  className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Dismiss Report
                </button>
                <button
                  disabled={processingId === selectedReport._id || selectedReport.targetType !== 'listing'}
                  onClick={() => handleResolveReportCascade(selectedReport._id, 'delete-listing')}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-50 text-amber-700 border border-amber-200 dark:border-amber-900/40 hover:bg-amber-100 disabled:opacity-40"
                >
                  Delete Listing Only
                </button>
              </div>

              <button
                disabled={processingId === selectedReport._id}
                onClick={() => handleResolveReportCascade(selectedReport._id, 'ban-user-all')}
                className="w-full px-4 py-2.5 text-xs font-extrabold rounded-xl bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center gap-1.5"
              >
                <Ban size={14} />
                <span>Ban User and Remove All Postings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAY VIEW: GENERATE AND EXPORT REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                  Export Reports
                </span>
                <h3 className="text-base font-black mt-1 text-slate-900 dark:text-slate-50">Download Report</h3>
              </div>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕ Exit</button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Select Report Category:</label>
              <select 
                value={selectedReportType} 
                onChange={(e) => { setSelectedReportType(e.target.value); setGeneratedReportData(null); }}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium focus:outline-hidden text-slate-900 dark:text-white"
              >
                <option value="summary">Marketplace General Overview</option>
                <option value="users">User Profiles & Status List</option>
                <option value="listings">Active Listings & Product Pricing</option>
              </select>
            </div>

            <button
              onClick={handleGenerateSystemReport}
              disabled={loadingGrid}
              className="w-full py-2 mb-4 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
            >
              {loadingGrid ? 'Loading report...' : 'Generate Report Preview'}
            </button>

            {generatedReportData && (
              <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">File Name:</label>
                    <input 
                      type="text" 
                      value={customFileName}
                      onChange={(e) => setCustomFileName(e.target.value)}
                      placeholder="Name your file..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">File Format:</label>
                    <select 
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white"
                    >
                      <option value="excel">Microsoft Excel Spreadsheet (.xlsx)</option>
                      <option value="word">Microsoft Word Document (.docx)</option>
                      <option value="csv">Comma-Separated Text (.csv)</option>
                      <option value="json">Raw Developer Data (.json)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-3 max-h-32 overflow-y-auto border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Data Table Preview:</span>
                  <pre className="text-[10px] font-mono leading-relaxed text-slate-600 dark:text-slate-400">
                    {JSON.stringify(generatedReportData, null, 2)}
                  </pre>
                </div>
                
                <button
                  onClick={handleExportDataFile}
                  disabled={downloadingReport}
                  className="w-full mt-2 py-2 text-xs font-bold rounded-xl border border-emerald-600 dark:border-emerald-500 text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center justify-center gap-1.5"
                >
                  <Download size={14} />
                  <span>{downloadingReport ? 'Downloading...' : 'Save File to Machine'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}