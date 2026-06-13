export const OperationalDashboard = () => {
  return (
    <div className="p-xl">
      {/* Header */}
      <div className="flex justify-between items-end mb-xl">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">Operational Dashboard</h1>
          <p className="text-on-surface-variant font-body-md">Real-time workshop performance and exception monitoring.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-outline-variant text-on-surface font-semibold rounded-xl flex items-center gap-2 hover:border-primary/30 hover:bg-surface-variant transition-all shadow-soft">
            <span className="material-symbols-outlined text-primary">calendar_today</span>
            Today
          </button>
          <button className="px-5 py-2.5 bg-white border border-outline-variant text-on-surface font-semibold rounded-xl flex items-center gap-2 hover:border-primary/30 hover:bg-surface-variant transition-all shadow-soft">
            <span className="material-symbols-outlined text-primary">filter_list</span>
            Filters
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-xl">
        <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 p-8 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
            <span className="material-symbols-outlined !text-[80px] text-primary">payments</span>
          </div>
          <p className="font-label-md text-on-surface-variant uppercase tracking-wider mb-2">Total Sales Orders</p>
          <div className="flex items-baseline gap-2">
            <h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">₹14.2M</h2>
            <span className="text-success-forest font-bold text-body-sm flex items-center gap-0.5 bg-success-forest/10 px-2 py-0.5 rounded-full">
              <span className="material-symbols-outlined !text-[16px]">trending_up</span> 12%
            </span>
          </div>
          <p className="text-label-sm text-on-surface-variant mt-3 font-medium opacity-70">Vs. previous month</p>
        </div>

        <div className="bg-white border-l-4 border-l-warning-amber border border-outline-variant p-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all relative">
          <p className="font-label-md text-on-surface-variant uppercase tracking-wider mb-2">Pending Deliveries</p>
          <div className="flex items-baseline gap-3">
            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">24</h2>
            <span className="bg-error-container text-error px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider animate-pulse">Urgent</span>
          </div>
          <p className="text-label-sm text-on-surface-variant mt-3 font-medium opacity-70"><span className="text-error font-bold">8</span> past due date</p>
        </div>

        <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all relative group">
          <p className="font-label-md text-on-surface-variant uppercase tracking-wider mb-2">Manufacturing Orders</p>
          <div className="flex items-baseline gap-3">
            <h2 className="font-headline-lg text-headline-lg text-odoo-teal tracking-tight">156</h2>
            <span className="text-on-surface-variant text-body-sm font-semibold px-2 py-1 bg-surface-variant rounded-lg">In Progress</span>
          </div>
          <p className="text-label-sm text-on-surface-variant mt-3 font-medium opacity-70">Capacity at <span className="text-odoo-teal font-bold">84%</span></p>
        </div>

        <div className="bg-white border-l-4 border-l-error border border-outline-variant p-6 rounded-xl shadow-soft hover:shadow-soft-lg transition-all relative">
          <p className="font-label-md text-on-surface-variant uppercase tracking-wider mb-2">Material Shortages</p>
          <div className="flex items-baseline gap-3">
            <h2 className="font-headline-lg text-headline-lg text-error tracking-tight">12</h2>
            <span className="material-symbols-outlined text-error !text-[24px]">report_problem</span>
          </div>
          <p className="text-label-sm text-on-surface-variant mt-3 font-medium opacity-70">Blocking <span className="text-error font-bold">4</span> work orders</p>
        </div>
      </div>

      {/* Main Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
        {/* Tables Column */}
        <div className="lg:col-span-8 space-y-xl">
          {/* Pending Deliveries Table */}
          <div className="bg-white border border-outline-variant rounded-xl shadow-soft overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant flex justify-between items-center bg-white/50">
              <h3 className="font-headline-sm text-[18px] font-bold text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-warning-amber !text-[24px]">local_shipping</span>
                Pending Deliveries
              </h3>
              <a className="text-primary font-bold text-label-md hover:text-primary/80 flex items-center gap-1 group" href="#">
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
                  <tr className="group hover:bg-surface-variant/50 transition-colors cursor-pointer">
                    <td className="px-6 py-5 font-mono-md text-primary font-bold">SO-2023-441</td>
                    <td className="px-6 py-5 font-bold text-on-surface">Grand Regal Hotels</td>
                    <td className="px-6 py-5 text-on-surface-variant">12x Teak Dining Chairs</td>
                    <td className="px-6 py-5 text-error font-black">Oct 12, 2023</td>
                    <td className="px-6 py-5 text-right">
                      <span className="bg-error text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight shadow-sm">Late</span>
                    </td>
                  </tr>
                  <tr className="group hover:bg-surface-variant/50 transition-colors cursor-pointer">
                    <td className="px-6 py-5 font-mono-md text-primary font-bold">SO-2023-456</td>
                    <td className="px-6 py-5 font-bold text-on-surface">Urban Co-working</td>
                    <td className="px-6 py-5 text-on-surface-variant">5x Oak Work Desks</td>
                    <td className="px-6 py-5 font-medium">Oct 24, 2023</td>
                    <td className="px-6 py-5 text-right">
                      <span className="bg-success-forest text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight shadow-sm">Ready</span>
                    </td>
                  </tr>
                  <tr className="group hover:bg-surface-variant/50 transition-colors cursor-pointer">
                    <td className="px-6 py-5 font-mono-md text-primary font-bold">SO-2023-459</td>
                    <td className="px-6 py-5 font-bold text-on-surface">Private Residence</td>
                    <td className="px-6 py-5 text-on-surface-variant">1x King Size Bed Frame</td>
                    <td className="px-6 py-5 font-medium">Oct 28, 2023</td>
                    <td className="px-6 py-5 text-right">
                      <span className="bg-outline text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tight shadow-sm">Waiting</span>
                    </td>
                  </tr>
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
              {/* WC 1 */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-on-surface text-body-md">Cutting &amp; Sizing</span>
                  <span className="font-black text-error text-headline-sm tracking-tight">92%</span>
                </div>
                <div className="w-full bg-surface-variant h-3 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-error h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.3)]" style={{ width: '92%' }}></div>
                </div>
                <p className="text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined !text-[14px]">schedule</span> 48 hours queued | <span className="text-error font-bold">2 Maintenance alerts</span>
                </p>
              </div>
              {/* WC 2 */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-on-surface text-body-md">Joinery &amp; Assembly</span>
                  <span className="font-black text-odoo-teal text-headline-sm tracking-tight">65%</span>
                </div>
                <div className="w-full bg-surface-variant h-3 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-odoo-teal h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(13,148,136,0.3)]" style={{ width: '65%' }}></div>
                </div>
                <p className="text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined !text-[14px]">verified</span> 32 hours queued | Efficiency optimal
                </p>
              </div>
              {/* WC 3 */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-on-surface text-body-md">Polishing &amp; Finishing</span>
                  <span className="font-black text-success-forest text-headline-sm tracking-tight">40%</span>
                </div>
                <div className="w-full bg-surface-variant h-3 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-success-forest h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: '40%' }}></div>
                </div>
                <p className="text-label-sm text-on-surface-variant">Ready for new batches</p>
              </div>
              {/* WC 4 */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="font-bold text-on-surface text-body-md">Upholstery</span>
                  <span className="font-black text-warning-amber text-headline-sm tracking-tight">78%</span>
                </div>
                <div className="w-full bg-surface-variant h-3 rounded-full overflow-hidden shadow-inner">
                  <div className="bg-warning-amber h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.3)]" style={{ width: '78%' }}></div>
                </div>
                <p className="text-label-sm text-on-surface-variant flex items-center gap-1">
                  <span className="material-symbols-outlined !text-[14px]">pending</span> Waiting for fabric shipment
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Side Feed Column */}
        <div className="lg:col-span-4">
          <div className="bg-white border border-outline-variant rounded-xl shadow-soft flex flex-col h-full overflow-hidden">
            <div className="px-6 py-5 border-b border-outline-variant bg-white/50">
              <h3 className="font-headline-sm text-[18px] font-bold text-on-surface flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant !text-[24px]">history</span>
                Recent Audit Events
              </h3>
            </div>
            <div className="flex-1 p-6 overflow-y-auto space-y-8 custom-scrollbar">
              <div className="flex gap-4 relative pb-2">
                <div className="absolute left-[17px] top-10 bottom-[-32px] w-[2px] bg-outline-variant/40"></div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex-shrink-0 flex items-center justify-center border border-primary/20 shadow-sm z-10 bg-white">
                  <span className="material-symbols-outlined text-[18px] text-primary">inventory_2</span>
                </div>
                <div className="flex-1">
                  <p className="text-body-sm leading-snug"><span className="font-black text-on-surface">Rahul S.</span> adjusted stock for <span className="font-bold text-primary">Rosewood Timber</span></p>
                  <p className="text-[11px] font-bold text-on-surface-variant/60 mt-1 uppercase tracking-wider">2 mins ago • Inventory</p>
                  <div className="mt-3 text-body-sm bg-surface-variant p-3 rounded-xl border border-outline-variant/30 italic text-on-surface-variant leading-relaxed">
                    "Correction for wastage in Cutting WC"
                  </div>
                </div>
              </div>
              <div className="flex gap-4 relative pb-2">
                <div className="absolute left-[17px] top-10 bottom-[-32px] w-[2px] bg-outline-variant/40"></div>
                <div className="w-9 h-9 rounded-xl bg-tertiary-fixed flex-shrink-0 flex items-center justify-center border border-outline-variant/20 shadow-sm z-10 bg-white">
                  <span className="material-symbols-outlined text-[18px] text-tertiary">edit_note</span>
                </div>
                <div className="flex-1">
                  <p className="text-body-sm leading-snug"><span className="font-black text-on-surface">Amit V.</span> modified Sales Order <span className="font-mono-md text-primary font-black">#SO-2023-459</span></p>
                  <p className="text-[11px] font-bold text-on-surface-variant/60 mt-1 uppercase tracking-wider">45 mins ago • Sales</p>
                </div>
              </div>
              <div className="flex gap-4 relative pb-2">
                <div className="absolute left-[17px] top-10 bottom-[-32px] w-[2px] bg-outline-variant/40"></div>
                <div className="w-9 h-9 rounded-xl bg-error-container flex-shrink-0 flex items-center justify-center border border-error/20 shadow-sm z-10 bg-white">
                  <span className="material-symbols-outlined text-[18px] text-error font-black">warning</span>
                </div>
                <div className="flex-1">
                  <p className="text-body-sm leading-snug"><span className="font-black text-error">System Alert:</span> Low stock threshold reached for <span className="font-bold text-on-surface">PU Polish</span></p>
                  <p className="text-[11px] font-bold text-on-surface-variant/60 mt-1 uppercase tracking-wider">2 hours ago • Warehouse</p>
                </div>
              </div>
              <div className="flex gap-4 relative pb-2">
                <div className="absolute left-[17px] top-10 bottom-[-32px] w-[2px] bg-outline-variant/40"></div>
                <div className="w-9 h-9 rounded-xl bg-secondary-container flex-shrink-0 flex items-center justify-center border border-secondary/20 shadow-sm z-10 bg-white">
                  <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                </div>
                <div className="flex-1">
                  <p className="text-body-sm leading-snug"><span className="font-black text-on-surface">Quality Team</span> approved batch <span className="font-bold text-success-forest">#MF-992</span></p>
                  <p className="text-[11px] font-bold text-on-surface-variant/60 mt-1 uppercase tracking-wider">5 hours ago • Production</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-surface-variant flex-shrink-0 flex items-center justify-center border border-outline-variant/20 shadow-sm z-10 bg-white">
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant">person_add</span>
                </div>
                <div className="flex-1">
                  <p className="text-body-sm leading-snug"><span className="font-black text-on-surface">Admin</span> created profile for <span className="font-bold text-on-surface">Suresh K.</span></p>
                  <p className="text-[11px] font-bold text-on-surface-variant/60 mt-1 uppercase tracking-wider">Yesterday • System</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-outline-variant bg-surface-variant/50 text-center">
              <button className="text-label-md font-black text-primary hover:underline uppercase tracking-widest">Full Audit History</button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4 z-50">
        <button className="w-16 h-16 bg-primary text-white rounded-2xl shadow-soft-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center group relative border-2 border-white/20">
          <span className="material-symbols-outlined !text-[36px]">add</span>
          <span className="absolute right-20 bg-inverse-surface text-white px-4 py-2 rounded-xl text-label-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-xl translate-x-4 group-hover:translate-x-0 font-bold">Create New Order</span>
        </button>
        <button className="w-16 h-16 bg-white border border-outline-variant text-primary rounded-2xl shadow-soft-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center group relative">
          <span className="material-symbols-outlined !text-[28px]">print</span>
          <span className="absolute right-20 bg-inverse-surface text-white px-4 py-2 rounded-xl text-label-md opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none shadow-xl translate-x-4 group-hover:translate-x-0 font-bold">Export Report</span>
        </button>
      </div>
    </div>
  );
};
