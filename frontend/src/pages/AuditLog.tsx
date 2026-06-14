import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

export const AuditLog = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterActor, setFilterActor] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const { user } = useAuth();
  const role = user?.shiv_role || '';
  const canExport = ['admin', 'auditor'].includes(role);

  useEffect(() => {
    fetchLogs();
  }, [page, filterAction, fromDate, toDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '20',
      });
      if (filterAction) params.append('action', filterAction);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (filterActor) params.append('actor', filterActor);

      const res = await apiFetch(`/shiv/audit-logs?${params.toString()}`);
      const data = res.data || res;
      setLogs(data.logs || data.events || []);
      setTotalPages(data.total_pages || 1);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = () => {
    // We already trigger fetch on other filters via useEffect, but actor is on button click or enter
    setPage(1);
    fetchLogs();
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams();
      if (filterAction) params.append('action', filterAction);
      if (fromDate) params.append('from_date', fromDate);
      if (toDate) params.append('to_date', toDate);
      if (filterActor) params.append('actor', filterActor);

      const res = await apiFetch(`/shiv/audit-logs?${params.toString()}`);
      const data = res.data || res;
      const exportData = data.logs || data.events || [];
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to export logs');
    } finally {
      setIsExporting(false);
    }
  };

  const getActionColor = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('failed') || act.includes('locked')) return 'bg-error/10 text-error';
    if (act.includes('create') || act.includes('success')) return 'bg-success-forest/10 text-success-forest';
    if (act.includes('write') || act.includes('update')) return 'bg-info/10 text-info';
    return 'bg-surface-variant text-on-surface-variant';
  };

  return (
    <div className="p-container-padding w-full">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Audit Logs</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">System-wide security and operational events.</p>
        </div>
        {canExport && (
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-white border border-outline-variant text-on-surface px-4 py-2 rounded-lg hover:bg-surface-variant transition-all flex items-center gap-2 font-label-md shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <svg className="animate-spin h-5 w-5 text-on-surface" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span className="material-symbols-outlined text-[18px]">download</span>
            )}
            Export JSON
          </button>
        )}
      </div>

      {error && <div className="text-error bg-error-container p-4 rounded-lg mb-4 font-bold">{error}</div>}

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-outline-variant shadow-sm mb-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Action Type</label>
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
            className="border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-surface-container-low focus:ring-1 focus:ring-primary outline-none"
          >
            <option value="">All Actions</option>
            <option value="login_success">Login Success</option>
            <option value="login_failed">Login Failed</option>
            <option value="create">Create</option>
            <option value="write">Update/Write</option>
            <option value="unlink">Delete</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            className="border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-surface-container-low focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            className="border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-surface-container-low focus:ring-1 focus:ring-primary outline-none"
          />
        </div>

        <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
          <label className="text-label-sm font-bold text-on-surface-variant uppercase tracking-wider">Actor</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={filterActor}
              onChange={(e) => setFilterActor(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
              placeholder="Search by actor name..."
              className="flex-1 border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-surface-container-low focus:ring-1 focus:ring-primary outline-none"
            />
            <button
              onClick={handleSearchClick}
              className="bg-surface-variant text-on-surface-variant px-3 py-2 rounded-lg hover:bg-outline-variant transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] leading-none">search</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left zebra-table">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-md uppercase tracking-wider text-[11px]">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Model</th>
                <th className="px-6 py-4">Record</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-on-surface-variant font-bold animate-pulse">Loading logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-on-surface-variant font-bold">No audit events found.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-black/5 transition-colors">
                    <td className="px-6 py-4 text-[13px] font-mono whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-6 py-4 font-bold text-on-surface">{log.actor_name || 'System'}</td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant capitalize">{log.actor_role || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm font-bold text-primary">{log.model || '—'}</td>
                    <td className="px-6 py-4 text-body-sm">{log.record_name ? `${log.record_name} (#${log.record_id})` : (log.record_id || '—')}</td>
                    <td className="px-6 py-4 text-body-sm text-on-surface-variant max-w-[200px] truncate" title={log.notes}>{log.notes || '—'}</td>
                    <td className="px-6 py-4 text-[12px] font-mono text-on-surface-variant">{log.ip_address || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-white border-t border-outline-variant px-6 py-4 flex items-center justify-between">
          <p className="text-body-sm text-on-surface-variant font-medium">
            Showing Page <span className="font-bold text-on-surface">{page}</span> of <span className="font-bold text-on-surface">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button 
              disabled={page <= 1 || loading}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm font-bold disabled:opacity-50 hover:bg-surface-variant transition-colors"
            >
              Previous
            </button>
            <button 
              disabled={page >= totalPages || loading}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-outline-variant rounded-lg text-body-sm font-bold disabled:opacity-50 hover:bg-surface-variant transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
