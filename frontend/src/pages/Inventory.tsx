import { useState } from 'react';

export const Inventory = () => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-surface-base text-on-surface font-body-md">
      {/* Main Workspace */}
      <div className="p-lg space-y-lg max-w-[1440px] flex-1">
        {/* Header Actions */}
        <div className="flex justify-between items-end">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Inventory Stock Ledger</h2>
            <p className="font-body-md text-on-surface-variant">Real-time tracking of stock movements across all warehouses.</p>
          </div>
          <div className="flex gap-sm">
            <button className="px-md py-sm bg-surface-container-lowest border border-outline text-on-surface font-label-md rounded-lg hover:bg-surface-container-high transition-all flex items-center gap-sm shadow-sm">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Export Ledger
            </button>
            <button className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:bg-primary-container transition-all flex items-center gap-sm shadow-sm">
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
              New Movement
            </button>
          </div>
        </div>

        {/* Global Filters Bar */}
        <div className="bg-surface-container-lowest p-md border border-outline-variant rounded-xl flex flex-wrap gap-md items-center shadow-sm">
          <div className="flex flex-col gap-xs min-w-[200px]">
            <label className="font-label-sm text-on-surface-variant">Warehouse</label>
            <select className="border border-outline-variant rounded-lg px-sm py-xs font-body-sm focus:ring-primary focus:border-primary">
              <option>All Warehouses</option>
              <option>Main Warehouse (Mumbai)</option>
              <option>Regional Hub (Pune)</option>
              <option>Direct Showroom Floor</option>
            </select>
          </div>
          <div className="flex flex-col gap-xs min-w-[200px]">
            <label className="font-label-sm text-on-surface-variant">Product Category</label>
            <select className="border border-outline-variant rounded-lg px-sm py-xs font-body-sm focus:ring-primary focus:border-primary">
              <option>All Products</option>
              <option>Office Chairs</option>
              <option>Executive Desks</option>
              <option>Storage Solutions</option>
            </select>
          </div>
          <div className="flex flex-col gap-xs min-w-[240px]">
            <label className="font-label-sm text-on-surface-variant">Date Range</label>
            <div className="flex items-center gap-xs">
              <input className="border border-outline-variant rounded-lg px-sm py-xs font-body-sm w-full" type="date"/>
              <span className="text-outline">to</span>
              <input className="border border-outline-variant rounded-lg px-sm py-xs font-body-sm w-full" type="date"/>
            </div>
          </div>
          <button className="mt-auto px-md py-xs bg-surface-container-high text-on-surface font-label-md rounded-lg hover:bg-outline-variant transition-colors border border-outline-variant shadow-sm">
            Apply Filters
          </button>
        </div>

        {/* Dashboard Row 1: KPI & Top Products */}
        <div className="grid grid-cols-12 gap-lg">
          {/* KPI Cards */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-3 gap-md">
            <div className="bg-surface-container-lowest p-lg border border-outline-variant rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-sm">
                <span className="material-symbols-outlined text-primary p-xs bg-primary/10 rounded-lg">inventory</span>
                <span className="text-success-forest font-label-sm bg-success-forest/10 px-xs rounded font-bold">+2.4%</span>
              </div>
              <p className="font-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Total On-Hand</p>
              <h3 className="font-headline-md text-headline-md mt-xs text-on-surface">12,482 <span className="text-body-sm font-normal text-outline">units</span></h3>
            </div>
            <div className="bg-surface-container-lowest p-lg border border-outline-variant rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-sm">
                <span className="material-symbols-outlined text-secondary p-xs bg-secondary/10 rounded-lg">local_shipping</span>
                <span className="text-on-surface-variant font-label-sm bg-surface-container-high px-xs rounded font-bold">Stable</span>
              </div>
              <p className="font-label-sm text-on-surface-variant uppercase tracking-wider font-bold">In-Transit</p>
              <h3 className="font-headline-md text-headline-md mt-xs text-on-surface">840 <span className="text-body-sm font-normal text-outline">units</span></h3>
            </div>
            <div className="bg-surface-container-lowest p-lg border border-outline-variant rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-sm">
                <span className="material-symbols-outlined text-error p-xs bg-error/10 rounded-lg">warning</span>
                <span className="text-error font-label-sm bg-error-container px-xs rounded font-bold">Critical</span>
              </div>
              <p className="font-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Stock Shortages</p>
              <h3 className="font-headline-md text-headline-md mt-xs text-on-surface">12 <span className="text-body-sm font-normal text-outline">SKUs</span></h3>
            </div>
          </div>

          {/* Top 5 Products Chart (Bento Style) */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-lg border border-outline-variant rounded-xl shadow-sm">
            <h4 className="font-label-md text-on-surface mb-md font-bold uppercase tracking-widest text-primary">Top 5 Products by Volume</h4>
            <div className="space-y-md">
              {[
                { name: 'ErgoPro Chair Z1', value: '2,140', pct: 85 },
                { name: 'Nordic Oak Desk', value: '1,890', pct: 72 },
                { name: 'Executive Leather L3', value: '1,420', pct: 55 },
                { name: 'Minimalist Bookshelf', value: '980', pct: 38 },
                { name: 'Studio Stool X', value: '450', pct: 20 },
              ].map((item, index) => (
                <div key={index} className="space-y-xs cursor-pointer" onMouseEnter={() => setHoveredBar(index)} onMouseLeave={() => setHoveredBar(null)}>
                  <div className="flex justify-between font-label-sm">
                    <span className="text-on-surface font-medium">{item.name}</span>
                    <span className="font-bold text-primary">{item.value}</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-primary transition-all duration-300 ${hoveredBar === index ? 'brightness-125' : ''}`} 
                      style={{ width: `${item.pct}%`, opacity: 1 - (index * 0.15) }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stock Movements Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
            <h3 className="font-headline-sm text-headline-sm text-primary">Recent Stock Movements</h3>
            <div className="flex items-center gap-sm">
              <button className="p-xs hover:bg-surface-container rounded transition-colors text-outline">
                <span className="material-symbols-outlined">filter_list</span>
              </button>
              <button className="p-xs hover:bg-surface-container rounded transition-colors text-outline">
                <span className="material-symbols-outlined">refresh</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto data-table-container custom-scrollbar">
            <table className="w-full text-left border-collapse zebra-table">
              <thead className="bg-surface-container-low sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-lg py-sm font-label-md text-on-surface-variant border-b border-outline-variant uppercase tracking-widest">Date</th>
                  <th className="px-lg py-sm font-label-md text-on-surface-variant border-b border-outline-variant uppercase tracking-widest">Reference</th>
                  <th className="px-lg py-sm font-label-md text-on-surface-variant border-b border-outline-variant uppercase tracking-widest">Product</th>
                  <th className="px-lg py-sm font-label-md text-on-surface-variant border-b border-outline-variant uppercase tracking-widest">From</th>
                  <th className="px-lg py-sm font-label-md text-on-surface-variant border-b border-outline-variant uppercase tracking-widest">To</th>
                  <th className="px-lg py-sm font-label-md text-on-surface-variant border-b border-outline-variant uppercase tracking-widest">Quantity</th>
                  <th className="px-lg py-sm font-label-md text-on-surface-variant border-b border-outline-variant uppercase tracking-widest">Status</th>
                  <th className="px-lg py-sm font-label-md text-on-surface-variant border-b border-outline-variant text-center uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {[
                  { date: 'Oct 24, 2023 14:32', ref: 'WH/IN/001', product: 'ErgoPro Chair', sku: 'CHR-ERG-001', from: 'Global Logistics Inc.', to: 'Main Warehouse', qty: '+50', qtyColor: 'text-success-forest', status: 'Completed', statusBg: 'bg-success-forest/10', statusText: 'text-success-forest' },
                  { date: 'Oct 24, 2023 11:15', ref: 'WH/OUT/242', product: 'Nordic Oak Desk', sku: 'DSK-OAK-212', from: 'Main Warehouse', to: 'Mumbai Showroom', qty: '-12', qtyColor: 'text-error', status: 'In Transit', statusBg: 'bg-secondary-container', statusText: 'text-on-secondary-container' },
                  { date: 'Oct 23, 2023 16:45', ref: 'ADJ/STOCK/05', product: 'Studio Stool X', sku: 'STL-X-99', from: 'System Audit', to: 'Main Warehouse', qty: '-2', qtyColor: 'text-error', status: 'Completed', statusBg: 'bg-success-forest/10', statusText: 'text-success-forest' },
                  { date: 'Oct 23, 2023 10:20', ref: 'WH/IN/002', product: 'Minimalist Bookshelf', sku: 'BKS-MIN-44', from: 'WoodWork Partners', to: 'Regional Hub', qty: '+120', qtyColor: 'text-success-forest', status: 'Pending Approval', statusBg: 'bg-warning-amber/20', statusText: 'text-on-surface' },
                  { date: 'Oct 22, 2023 15:55', ref: 'WH/IN/003', product: 'Executive Leather L3', sku: 'CHR-EXE-L3', from: 'Elite Suppliers Ltd', to: 'Main Warehouse', qty: '+25', qtyColor: 'text-success-forest', status: 'Completed', statusBg: 'bg-success-forest/10', statusText: 'text-success-forest' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-primary/5 transition-colors group cursor-pointer" onClick={() => console.log('Row clicked - opening details view...')}>
                    <td className="px-lg py-sm font-body-sm text-on-surface">{row.date}</td>
                    <td className="px-lg py-sm font-label-md text-primary font-bold">{row.ref}</td>
                    <td className="px-lg py-sm">
                      <div className="flex flex-col">
                        <span className="font-label-md text-on-surface font-bold">{row.product}</span>
                        <span className="text-[10px] text-outline uppercase tracking-tighter">{row.sku}</span>
                      </div>
                    </td>
                    <td className="px-lg py-sm font-body-sm text-on-surface-variant font-medium">{row.from}</td>
                    <td className="px-lg py-sm font-body-sm text-on-surface-variant font-medium">{row.to}</td>
                    <td className={`px-lg py-sm font-label-md font-mono-md font-bold ${row.qtyColor}`}>{row.qty}</td>
                    <td className="px-lg py-sm">
                      <span className={`px-xs py-0.5 ${row.statusBg} ${row.statusText} text-[11px] font-bold rounded uppercase whitespace-nowrap`}>{row.status}</span>
                    </td>
                    <td className="px-lg py-sm text-center">
                      <button className="opacity-0 group-hover:opacity-100 p-xs hover:bg-surface-container rounded transition-all">
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-lg py-sm bg-surface-container-lowest border-t border-outline-variant flex justify-between items-center font-label-sm text-on-surface-variant">
            <span>Showing 1-10 of 1,245 movements</span>
            <div className="flex gap-xs">
              <button className="px-sm py-xs border border-outline-variant rounded hover:bg-surface-container-high disabled:opacity-50 transition-colors" disabled>Previous</button>
              <button className="px-sm py-xs border border-outline-variant rounded bg-primary text-on-primary font-bold">1</button>
              <button className="px-sm py-xs border border-outline-variant rounded hover:bg-surface-container-high transition-colors text-on-surface">2</button>
              <button className="px-sm py-xs border border-outline-variant rounded hover:bg-surface-container-high transition-colors text-on-surface">3</button>
              <button className="px-sm py-xs border border-outline-variant rounded hover:bg-surface-container-high transition-colors text-on-surface">Next</button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer Summary for ERP Density */}
      <footer className="mt-auto bg-surface-container-lowest border-t border-outline-variant px-lg py-sm flex justify-between items-center text-on-surface-variant font-label-sm z-10 w-full relative">
        <div className="flex gap-lg">
          <div className="flex items-center gap-xs">
            <span className="w-2 h-2 rounded-full bg-success-forest animate-pulse"></span>
            <span className="font-bold">System Sync: Active</span>
          </div>
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[14px]">update</span>
            <span>Last Refreshed: 2 mins ago</span>
          </div>
        </div>
        <div className="flex gap-md font-medium">
          <a className="hover:text-primary transition-colors" href="#">Privacy Policy</a>
          <a className="hover:text-primary transition-colors" href="#">User Manual</a>
          <span className="text-outline">v4.2.1-stable</span>
        </div>
      </footer>
    </div>
  );
};
