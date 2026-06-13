import { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface WorkCenter {
  id: number;
  name: string;
  type: string;
  status: string;
  active_mos_count: number;
  utilization_pct: number;
  duration_in_status: string;
  active_mos: Array<{ id: number; name: string; product: string; progress_pct: number }>;
  anomaly_details?: { type: string; description: string; reported_by: string; timestamp: string };
}

export const FloorConsole = () => {
  const { user } = useAuth();
  const role = user?.shiv_role || '';
  
  const [data, setData] = useState<{ work_centers: WorkCenter[], summary: any, alerts: string[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);

  // Modals state
  const [reportModalOpen, setReportModalOpen] = useState<number | null>(null); // holds WC ID
  const [resolveModalOpen, setResolveModalOpen] = useState<number | null>(null); // holds WC ID
  const [anomalyType, setAnomalyType] = useState('machine_breakdown');
  const [anomalyDesc, setAnomalyDesc] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const canReport = ['admin', 'production_manager', 'production_user'].includes(role);
  const canResolve = ['admin', 'production_manager'].includes(role);

  const fetchConsole = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const res = await apiFetch('/shiv/floor/console');
      const payload = res.data || res;
      setData({
        work_centers: payload.work_centers || [],
        summary: payload.summary || { total: 0, running: 0, breakdown: 0, total_active_mos: 0 },
        alerts: payload.alerts || []
      });
      setLastUpdated(Date.now());
      setTimeSinceUpdate(0);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to fetch floor console data.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsole(true);
    const interval = setInterval(() => {
      fetchConsole(false);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSinceUpdate(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const handleReport = async (wcId: number) => {
    try {
      setActionLoading(true);
      await apiFetch(`/shiv/floor/work-centers/${wcId}/report-anomaly`, {
        method: 'POST',
        body: JSON.stringify({ type: anomalyType, description: anomalyDesc })
      });
      setReportModalOpen(null);
      setAnomalyDesc('');
      fetchConsole(false);
    } catch (err: any) {
      alert(err.message || 'Failed to report anomaly');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async (wcId: number) => {
    try {
      setActionLoading(true);
      await apiFetch(`/shiv/floor/work-centers/${wcId}/resolve-anomaly`, {
        method: 'POST',
        body: JSON.stringify({ resolution_notes: resolveNotes })
      });
      setResolveModalOpen(null);
      setResolveNotes('');
      fetchConsole(false);
    } catch (err: any) {
      alert(err.message || 'Failed to resolve anomaly');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'idle': return 'bg-surface-variant text-on-surface-variant';
      case 'running': return 'bg-success-forest/10 text-success-forest border border-success-forest/20';
      case 'paused': return 'bg-warning-amber/10 text-warning-amber border border-warning-amber/20';
      case 'breakdown': return 'bg-error text-white font-black animate-pulse shadow-md border-error';
      case 'maintenance': return 'bg-info/10 text-info border border-info/20';
      default: return 'bg-surface-variant text-on-surface-variant';
    }
  };

  return (
    <div className="p-container-padding w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface flex items-center gap-3">
            <span className="material-symbols-outlined text-primary !text-[32px]">dashboard_customize</span>
            Floor Console
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1 flex items-center gap-2">
            Real-time workshop monitoring. 
            <span className="text-[11px] font-mono px-2 py-0.5 bg-surface-variant rounded-md">
              Updated {timeSinceUpdate}s ago
            </span>
          </p>
        </div>
      </div>

      {error && <div className="text-error bg-error-container p-4 rounded-lg mb-6 font-bold">{error}</div>}

      {/* Summary Bar */}
      <div className="bg-surface-container-low rounded-xl p-4 flex gap-8 mb-6 border border-outline-variant shadow-sm">
        <div className="flex flex-col">
          <span className="text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Total WCs</span>
          <span className="text-headline-md font-black">{data?.summary?.total || 0}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-label-sm text-success-forest uppercase tracking-wider font-bold">Running</span>
          <span className="text-headline-md font-black text-success-forest">{data?.summary?.running || 0}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-label-sm text-error uppercase tracking-wider font-bold">Breakdown</span>
          <span className="text-headline-md font-black text-error">{data?.summary?.breakdown || 0}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-label-sm text-primary uppercase tracking-wider font-bold">Active MOs</span>
          <span className="text-headline-md font-black text-primary">{data?.summary?.total_active_mos || 0}</span>
        </div>
      </div>

      {/* Alerts */}
      {data?.alerts && data.alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {data.alerts.map((alt, idx) => (
            <div key={idx} className="bg-error-container text-error px-4 py-3 rounded-lg flex items-center gap-3 font-bold border border-error/20">
              <span className="material-symbols-outlined">warning</span>
              {alt}
            </div>
          ))}
        </div>
      )}

      {/* Grid */}
      {loading && !data ? (
        <div className="text-center py-12 text-on-surface-variant font-bold animate-pulse">Loading Live Console...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.work_centers.map(wc => (
            <div key={wc.id} className={`bg-white rounded-xl p-5 border shadow-soft flex flex-col transition-all relative overflow-hidden ${wc.status === 'breakdown' ? 'border-error shadow-[0_0_15px_rgba(220,38,38,0.2)]' : 'border-outline-variant hover:shadow-soft-lg'}`}>
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${wc.status === 'breakdown' ? 'bg-error text-white' : 'bg-surface-variant text-primary'}`}>
                    <span className="material-symbols-outlined">{wc.type === 'assembly' ? 'precision_manufacturing' : 'construction'}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface text-[16px]">{wc.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(wc.status)}`}>
                        {wc.status}
                      </span>
                      <span className="text-label-sm text-on-surface-variant">{wc.duration_in_status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Breakdown Details */}
              {wc.status === 'breakdown' && wc.anomaly_details && (
                <div className="bg-error/5 border border-error/20 p-3 rounded-lg mb-4 mt-2">
                  <p className="text-error font-black uppercase text-[11px] mb-1">{wc.anomaly_details.type}</p>
                  <p className="text-body-sm text-on-surface font-medium">{wc.anomaly_details.description}</p>
                  <p className="text-[10px] text-on-surface-variant mt-2">Reported by {wc.anomaly_details.reported_by}</p>
                </div>
              )}

              {/* Utilization Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-label-sm font-bold text-on-surface-variant">Utilization</span>
                  <span className="text-label-sm font-black text-on-surface">{wc.utilization_pct}%</span>
                </div>
                <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${wc.status === 'breakdown' ? 'bg-error' : wc.utilization_pct > 80 ? 'bg-error' : wc.utilization_pct > 60 ? 'bg-warning-amber' : 'bg-success-forest'} transition-all duration-500`} 
                    style={{ width: `${wc.utilization_pct}%` }} 
                  />
                </div>
              </div>

              {/* Active MOs */}
              <div className="flex-1 mb-4">
                <p className="text-label-sm font-bold text-on-surface-variant mb-2">{wc.active_mos_count} Active MOs</p>
                <div className="space-y-2">
                  {wc.active_mos.map(mo => (
                    <div key={mo.id} className="bg-surface-container-lowest p-2 rounded border border-outline-variant text-[12px] flex justify-between items-center">
                      <div className="truncate flex-1 pr-2">
                        <span className="font-bold text-primary mr-2">{mo.name}</span>
                        <span className="text-on-surface-variant">{mo.product}</span>
                      </div>
                      <span className="font-mono font-bold text-success-forest">{mo.progress_pct}%</span>
                    </div>
                  ))}
                  {wc.active_mos.length === 0 && <p className="text-[12px] text-on-surface-variant italic">No active orders</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto flex gap-2 pt-4 border-t border-outline-variant">
                {canReport && wc.status !== 'breakdown' && (
                  <button onClick={() => setReportModalOpen(wc.id)} className="flex-1 bg-surface-variant hover:bg-outline-variant text-on-surface-variant font-bold text-label-md py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined !text-[16px]">report</span> Report
                  </button>
                )}
                {canResolve && wc.status === 'breakdown' && (
                  <button onClick={() => setResolveModalOpen(wc.id)} className="flex-1 bg-error hover:bg-error/90 text-white font-bold text-label-md py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined !text-[16px]">build</span> Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="font-headline-md mb-4 text-error flex items-center gap-2">
              <span className="material-symbols-outlined">report</span> Report Anomaly
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Anomaly Type</label>
                <select value={anomalyType} onChange={e => setAnomalyType(e.target.value)} className="w-full border border-outline-variant rounded-lg p-2.5 outline-none focus:border-error text-body-md">
                  <option value="machine_breakdown">Machine Breakdown</option>
                  <option value="power_failure">Power Failure</option>
                  <option value="material_shortage">Material Shortage</option>
                  <option value="operator_absent">Operator Absent</option>
                  <option value="quality_issue">Quality Issue</option>
                  <option value="safety_hazard">Safety Hazard</option>
                  <option value="tool_failure">Tool Failure</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Description</label>
                <textarea rows={3} value={anomalyDesc} onChange={e => setAnomalyDesc(e.target.value)} className="w-full border border-outline-variant rounded-lg p-2.5 outline-none focus:border-error text-body-md" placeholder="Provide details..."></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setReportModalOpen(null)} className="flex-1 px-4 py-2 border border-outline-variant text-on-surface font-bold rounded-lg hover:bg-surface-variant">Cancel</button>
              <button onClick={() => handleReport(reportModalOpen)} disabled={actionLoading} className="flex-1 px-4 py-2 bg-error text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="font-headline-md mb-4 text-success-forest flex items-center gap-2">
              <span className="material-symbols-outlined">build</span> Resolve Anomaly
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-label-sm font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Resolution Notes</label>
                <textarea rows={3} value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} className="w-full border border-outline-variant rounded-lg p-2.5 outline-none focus:border-success-forest text-body-md" placeholder="How was this fixed?"></textarea>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setResolveModalOpen(null)} className="flex-1 px-4 py-2 border border-outline-variant text-on-surface font-bold rounded-lg hover:bg-surface-variant">Cancel</button>
              <button onClick={() => handleResolve(resolveModalOpen)} disabled={actionLoading} className="flex-1 px-4 py-2 bg-success-forest text-white font-bold rounded-lg hover:opacity-90 disabled:opacity-50">Mark Resolved</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
