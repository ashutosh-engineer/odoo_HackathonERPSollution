import { useState, useEffect } from 'react';
import { apiFetch, odooSearchRead } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { exportToCSV } from '../utils/export';

interface DashboardKPIs {
  sales: { orders_today: number; orders_this_month: number; pipeline_value: number; on_time_delivery_pct: number };
  inventory: { total_products: number; low_stock_count: number; total_stock_value: number };
  procurement: { open_purchase_orders: number; pending_approval: number; avg_lead_days: number };
  manufacturing: { active_orders: number; avg_utilization_pct: number };
  alerts: { low_stock: any[]; low_stock_count: number };
}

interface AuditLog {
  id: number;
  user_id: [number, string] | false;
  action: string;
  resource_model: string;
  resource_id: number;
  timestamp: string;
  ip_address: string;
}

export const OperationalDashboard = () => {
  const { user } = useAuth();
  const role = user?.shiv_role || '';
  
  const showSales = ['admin', 'auditor', 'accountant', 'sales_manager', 'sales_user', 'viewer'].includes(role);
  const showPurchase = ['admin', 'auditor', 'accountant', 'purchase_manager', 'purchase_user', 'viewer'].includes(role);
  const showMfg = ['admin', 'auditor', 'production_manager', 'production_user', 'viewer'].includes(role);
  const showInv = ['admin', 'auditor', 'accountant', 'warehouse_manager', 'warehouse_user', 'viewer'].includes(role);
  const showAudit = ['admin', 'auditor'].includes(role);
  const canCreateSales = ['admin', 'sales_manager', 'sales_user'].includes(role);
  const canCreateAny = ['admin', 'sales_manager', 'sales_user', 'purchase_manager', 'purchase_user', 'production_manager', 'production_user', 'warehouse_manager', 'warehouse_user'].includes(role);

  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [pendingDeliveries, setPendingDeliveries] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('today');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleExport = () => {
    if (!kpis) return;
    const headers = ['Category', 'Metric', 'Value'];
    const data = [
      ['Sales', 'Pipeline Value', kpis.sales.pipeline_value],
      ['Sales', 'Orders Today', kpis.sales.orders_today],
      ['Sales', 'Orders This Month', kpis.sales.orders_this_month],
      ['Sales', 'On Time Delivery %', kpis.sales.on_time_delivery_pct],
      ['Inventory', 'Low Stock Count', kpis.inventory.low_stock_count],
      ['Procurement', 'Open POs', kpis.procurement.open_purchase_orders],
      ['Procurement', 'Pending Approval', kpis.procurement.pending_approval],
      ['Manufacturing', 'Active Orders', kpis.manufacturing.active_orders],
      ['Manufacturing', 'Avg Utilization %', kpis.manufacturing.avg_utilization_pct]
    ];
    exportToCSV(`dashboard_report_${new Date().toISOString().split('T')[0]}.csv`, headers, data);
    setToastMessage('Report exported successfully');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleActionClick = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await apiFetch('/shiv/dashboard/kpis');
        setKpis(response.data);
      } catch (err) {
        console.error("Failed to load KPIs", err);
      }
      
      try {
        const deliveries = await odooSearchRead('shiv.sale.order', [['state','in',['confirmed','picking']]], ['name','customer_id','delivery_date','state'], {limit: 5});
        setPendingDeliveries(deliveries as any[]);
      } catch (err) {
        console.error("Failed to load pending deliveries", err);
      }
      
      try {
        const wcs = await odooSearchRead('shiv.work.center', [['is_active','=',true]], ['name','utilization_pct','status'], {limit: 6});
        setWorkCenters(wcs as any[]);
      } catch (err) {
        console.error("Failed to load work centers", err);
      }
      
      try {
        const logsRes = await apiFetch('/shiv/audit-logs?limit=5');
        const logsData = logsRes.data || logsRes;
        setAuditLogs(Array.isArray(logsData) ? logsData : logsData?.logs || logsData?.events || []);
      } catch (err) {
        console.error("Failed to load audit logs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="p-xl">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 mb-xl w-full">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Operational Dashboard</h1>
          <p className="text-on-surface-variant font-body-md">Real-time workshop performance and exception monitoring.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {/* Search Bar */}
          <div className="flex items-center bg-white rounded-xl px-4 py-2.5 gap-3 border border-outline-variant transition-all focus-within:border-primary/50 focus-within:shadow-soft w-full sm:w-auto">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 text-body-sm w-full sm:w-64 p-0 placeholder-on-surface-variant/60 outline-none" 
              placeholder="Search orders, products or customers..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-3 relative w-full sm:w-auto">
            <button 
              onClick={() => { setActiveFilter('today'); handleActionClick('Dashboard filtered to Today'); }} 
              className={`flex-1 sm:flex-none px-5 py-2.5 border border-outline-variant font-semibold rounded-xl flex items-center justify-center gap-2 hover:border-primary/30 transition-all shadow-soft ${activeFilter === 'today' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white text-on-surface hover:bg-surface-variant'}`}
            >
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
              Today
            </button>
            <div className="relative flex-1 sm:flex-none">
              <button 
                onClick={() => setShowFilterDropdown(!showFilterDropdown)} 
                className={`w-full px-5 py-2.5 border border-outline-variant font-semibold rounded-xl flex items-center justify-center gap-2 hover:border-primary/30 transition-all shadow-soft ${activeFilter !== 'today' ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white text-on-surface hover:bg-surface-variant'}`}
              >
                <span className="material-symbols-outlined text-[20px]">filter_list</span>
                {activeFilter === 'today' ? 'Filters' : activeFilter === 'this_week' ? 'This Week' : 'This Month'}
              </button>
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-outline-variant rounded-xl shadow-lg z-20 py-2">
                  <button onClick={() => { setActiveFilter('today'); setShowFilterDropdown(false); handleActionClick('Dashboard filtered to Today'); }} className="w-full text-left px-4 py-2 hover:bg-surface-container-low font-medium">Today</button>
                  <button onClick={() => { setActiveFilter('this_week'); setShowFilterDropdown(false); handleActionClick('Dashboard filtered to This Week'); }} className="w-full text-left px-4 py-2 hover:bg-surface-container-low font-medium">This Week</button>
                  <button onClick={() => { setActiveFilter('this_month'); setShowFilterDropdown(false); handleActionClick('Dashboard filtered to This Month'); }} className="w-full text-left px-4 py-2 hover:bg-surface-container-low font-medium">This Month</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-xl">
        {showSales && (
          <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
              <span className="material-symbols-outlined !text-[80px] text-primary">payments</span>
            </div>
            <p className="font-label-md text-on-surface-variant uppercase tracking-wider mb-2">Total Sales</p>
            <div className="flex items-baseline gap-2">
              <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
                {loading ? '...' : `₹${(kpis?.sales?.pipeline_value || 0).toLocaleString()}`}
              </h2>
              <span className="text-success-forest font-bold text-body-sm flex items-center gap-0.5 bg-success-forest/10 px-2 py-0.5 rounded-full">
                <span className="material-symbols-outlined !text-[16px]">trending_up</span> {kpis?.sales?.orders_this_month || 0} orders
              </span>
            </div>
            <p className="text-label-sm text-on-surface-variant mt-3 font-medium opacity-70">
              {kpis?.sales?.on_time_delivery_pct || 0}% On-Time Delivery
            </p>
          </div>
        )}

        {showPurchase && (
          <div className="bg-white border-l-4 border-l-warning-amber border border-outline-variant p-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all relative">
            <p className="font-label-md text-on-surface-variant uppercase tracking-wider mb-2">Open Purchase Orders</p>
            <div className="flex items-baseline gap-3">
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                {loading ? '...' : kpis?.procurement?.open_purchase_orders || 0}
              </h2>
              {(kpis?.procurement?.pending_approval || 0) > 0 && (
                <span className="bg-warning-amber/10 text-warning-amber px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider animate-pulse">Needs Approval</span>
              )}
            </div>
            <p className="text-label-sm text-on-surface-variant mt-3 font-medium opacity-70">
              <span className="text-warning-amber font-bold">{kpis?.procurement?.pending_approval || 0}</span> orders pending approval
            </p>
          </div>
        )}

        {showMfg && (
          <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all relative group">
            <p className="font-label-md text-on-surface-variant uppercase tracking-wider mb-2">Manufacturing Orders</p>
            <div className="flex items-baseline gap-3">
              <h2 className="font-headline-lg text-headline-lg text-odoo-teal tracking-tight">
                {loading ? '...' : kpis?.manufacturing?.active_orders || 0}
              </h2>
              <span className="text-on-surface-variant text-body-sm font-semibold px-2 py-1 bg-surface-variant rounded-lg">In Progress</span>
            </div>
            <p className="text-label-sm text-on-surface-variant mt-3 font-medium opacity-70">
              Avg Utilization: <span className="font-bold text-on-surface">{kpis?.manufacturing?.avg_utilization_pct || 0}%</span>
            </p>
          </div>
        )}

        {showInv && (
          <div className="bg-white border-l-4 border-l-error border border-outline-variant p-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all relative">
            <p className="font-label-md text-on-surface-variant uppercase tracking-wider mb-2">Low Stock Items</p>
            <div className="flex items-baseline gap-3">
              <h2 className="font-headline-lg text-headline-lg text-error tracking-tight">
                {loading ? '...' : kpis?.inventory?.low_stock_count || 0}
              </h2>
              <span className="material-symbols-outlined text-error !text-[24px]">report_problem</span>
            </div>
            <p className="text-label-sm text-on-surface-variant mt-3 font-medium opacity-70">Items below minimum quantity</p>
          </div>
        )}
      </div>

      {/* Main Layout Split */}
      <div className={`grid grid-cols-1 ${showAudit ? 'lg:grid-cols-12' : ''} gap-xl`}>
        {/* Tables Column */}
        <div className={`${showAudit ? 'lg:col-span-8' : ''} space-y-xl`}>
          {/* Pending Deliveries Table */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-soft overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center bg-white/50">
              <h3 className="font-headline-sm text-[18px] font-bold text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-warning-amber !text-[24px]">local_shipping</span>
                Pending Deliveries
              </h3>
              <a className="text-primary font-bold text-label-md hover:text-primary/80 flex items-center gap-1 group" href="/sales">
                View All
                <span className="material-symbols-outlined !text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left zebra-stripes border-collapse">
                <thead>
                  <tr className="bg-surface-variant text-[11px] uppercase tracking-widest text-on-surface-variant font-black">
                    <th className="px-6 py-4">Order #</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Products</th>
                    <th className="px-6 py-4">Due Date</th>
                    <th className="px-6 py-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="text-body-sm divide-y divide-outline-variant/30">
                  {pendingDeliveries.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-on-surface-variant font-bold">No pending deliveries</td></tr>
                  ) : (
                    pendingDeliveries.map((delivery) => (
                      <tr key={delivery.id} className="group hover:bg-surface-variant/50 transition-colors cursor-pointer">
                        <td className="px-6 py-5 font-mono-md text-primary font-bold">{delivery.name}</td>
                        <td className="px-6 py-5 font-bold text-on-surface">{delivery.customer_id ? delivery.customer_id[1] : 'Unknown'}</td>
                        <td className="px-6 py-5 text-on-surface-variant">Products</td>
                        <td className="px-6 py-5 font-medium">{delivery.delivery_date || 'N/A'}</td>
                        <td className="px-6 py-5 text-right">
                          <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight shadow-sm ${
                            delivery.state === 'picking' ? 'bg-warning-amber text-white' : 'bg-success-forest text-white'
                          }`}>
                            {delivery.state}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Manufacturing Load */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-soft overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant bg-white/50">
              <h3 className="font-headline-sm text-[18px] font-bold text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-odoo-teal !text-[24px]">analytics</span>
                Manufacturing Work Center Load
              </h3>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              {workCenters.length === 0 ? (
                <div className="col-span-1 md:col-span-2 text-center text-on-surface-variant font-bold py-4">No work centers active</div>
              ) : (
                workCenters.map((wc, idx) => {
                  const util = wc.utilization_pct || 0;
                  const colorClass = util > 85 ? 'bg-error shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 
                                     util > 70 ? 'bg-warning-amber shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 
                                     util > 50 ? 'bg-odoo-teal shadow-[0_0_10px_rgba(13,148,136,0.3)]' : 
                                     'bg-success-forest shadow-[0_0_10px_rgba(16,185,129,0.3)]';
                  const textColor = util > 85 ? 'text-error' : util > 70 ? 'text-warning-amber' : util > 50 ? 'text-odoo-teal' : 'text-success-forest';
                  
                  return (
                    <div key={wc.id} className="space-y-3">
                      <div className="flex justify-between items-end">
                        <span className="font-bold text-on-surface text-body-md">{wc.name}</span>
                        <span className={`font-black ${textColor} text-headline-sm tracking-tight`}>{util}%</span>
                      </div>
                      <div className="w-full bg-surface-variant h-3 rounded-full overflow-hidden shadow-inner">
                        <div className={`h-full rounded-full transition-all duration-1000 ${colorClass}`} style={{ width: `${util}%` }}></div>
                      </div>
                      <p className="text-label-sm text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined !text-[14px]">info</span> {wc.status || 'Active'}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Side Feed Column — Audit Events (admin/auditor only) */}
        {showAudit && (
        <div className="lg:col-span-4">
          <div className="bg-white border border-outline-variant rounded-xl shadow-soft flex flex-col h-full overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant bg-white/50">
              <h3 className="font-headline-sm text-[18px] font-bold text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant !text-[24px]">history</span>
                Recent Audit Events
              </h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-8 custom-scrollbar">
              {!auditLogs || auditLogs.length === 0 ? (
                <div className="text-center text-on-surface-variant font-bold p-4">No audit events yet</div>
              ) : (
                (auditLogs || []).map((log, idx) => (
                  <div key={log.id} className={`flex gap-4 ${idx !== auditLogs.length - 1 ? 'relative pb-2' : ''}`}>
                    {idx !== auditLogs.length - 1 && (
                      <div className="absolute left-[17px] top-10 bottom-[-32px] w-[2px] bg-outline-variant/40"></div>
                    )}
                    <div className="w-9 h-9 rounded-xl bg-surface-variant flex-shrink-0 flex items-center justify-center border border-outline-variant/20 shadow-sm z-10 bg-white">
                      <span className="material-symbols-outlined text-[18px] text-primary">history</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-body-sm leading-snug">
                        <span className="font-black text-on-surface">{log.actor_name || 'System'}</span> {log.action} <span className="font-bold text-primary">{log.model}</span> {log.record_name ? `(${log.record_name})` : log.record_id ? `(ID: ${log.record_id})` : ''}
                      </p>
                      <p className="text-[11px] font-bold text-on-surface-variant/60 mt-1 uppercase tracking-wider">{log.timestamp} • IP: {log.ip_address || 'Unknown'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-outline-variant bg-surface-variant/50 text-center">
              <button className="text-label-md font-black text-primary hover:underline uppercase tracking-widest">Full Audit History</button>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Floating Action Buttons — role-gated */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
        {canCreateSales && (
        <button onClick={() => window.location.href='/sales/new'} className="w-16 h-16 bg-primary text-white rounded-2xl shadow-soft-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center group relative border-2 border-white/20">
          <span className="material-symbols-outlined !text-[36px]">add</span>
          <span className="absolute right-20 bg-inverse-surface text-white px-4 py-2 rounded-xl text-label-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-xl translate-x-4 group-hover:translate-x-0 font-bold">Create New Order</span>
        </button>
        )}
        <button onClick={handleExport} className="w-16 h-16 bg-white border border-outline-variant text-primary rounded-2xl shadow-soft-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center group relative">
          <span className="material-symbols-outlined !text-[28px]">print</span>
          <span className="absolute right-20 bg-inverse-surface text-white px-4 py-2 rounded-xl text-label-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-xl translate-x-4 group-hover:translate-x-0 font-bold">Export Report</span>
        </button>
      </div>

      {/* Toast Notification */}
      <div className={`fixed bottom-8 left-8 bg-inverse-surface text-inverse-on-surface px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-transform duration-300 z-50 ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <span className="material-symbols-outlined text-primary-container">info</span>
        <p className="font-label-md">{toastMessage}</p>
      </div>
    </div>
  );
};
