import { useEffect, useState } from 'react';
import api from '../../api';

export default function AdminPage() {
  const [overview, setOverview] = useState({ users: 0, listings: 0, reports: 0 });
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAllListings, setShowAllListings] = useState(false);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/overview');
      setOverview(data.overview);
      setReports(data.reports);
      setLogs(data.logs);
    } catch (error) {
      console.error('Failed to fetch admin overview', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleReportAction = async (id, action) => {
    setLoading(true);
    try {
      await api.post(`/admin/reports/${id}/${action}`);
      fetchOverview();
    } catch (error) {
      console.error(`Failed to ${action} report`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <h2 className="text-2xl font-semibold text-slate-900">Admin Overview</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            ['Total Users', overview.users],
            ['Active Listings', overview.listings],
            ['Pending Reports', overview.reports],
          ].map(([label, value]) => (
            <button
              key={label}
              onClick={() => label === 'Active Listings' && setShowAllListings(true)}
              className="rounded-3xl border border-slate-200 bg-slate-50 p-5 transition hover:shadow-md text-left"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900">{value}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <h3 className="text-xl font-semibold text-slate-900">Pending Reports</h3>
        <div className="mt-5 space-y-4">
          {reports.length === 0 ? (
            <p className="text-sm text-slate-500">No pending reports</p>
          ) : (
            reports.map((report) => (
              <article key={report._id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <h4 className="text-lg font-semibold text-slate-900">{report.title}</h4>
                <p className="mt-2 text-slate-700">{report.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => handleReportAction(report._id, 'accept')}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReportAction(report._id, 'reject')}
                    className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
                  >
                    Reject
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm shadow-slate-200">
        <h3 className="text-xl font-semibold text-slate-900">Audit Trail</h3>
        <div className="mt-5 space-y-3 max-h-[320px] overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 p-4">
          {loading ? (
            <p className="text-sm text-slate-500">Refreshing logs…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-slate-500">No logs available</p>
          ) : (
            logs.map((log, index) => (
              <p key={index} className="text-sm text-slate-700">
                {log.message}
              </p>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
