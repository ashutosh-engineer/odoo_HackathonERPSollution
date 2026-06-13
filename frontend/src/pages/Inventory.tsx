import { useState, useEffect } from 'react';
import { odooSearchRead } from '../utils/api';
import { RoleGuard } from '../components/RoleGuard';

interface StockSummary {
  id: number;
  product_id: [number, string];
  qty_on_hand: number;
  qty_available: number;
  qty_incoming: number;
}

interface StockLedger {
  id: number;
  timestamp: string;
  source_ref: string;
  product_id: [number, string];
  location_from: string;
  location_to: string;
  qty_change: number;
  movement_type: string;
}

export const Inventory = () => {
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  
  const [summaries, setSummaries] = useState<StockSummary[]>([]);
  const [ledger, setLedger] = useState<StockLedger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [summaryData, ledgerData] = await Promise.all([
          odooSearchRead('shiv.stock.summary', [], ['product_id', 'qty_on_hand', 'qty_available', 'qty_incoming']),
          odooSearchRead('shiv.stock.ledger', [], ['timestamp', 'source_ref', 'product_id', 'location_from', 'location_to', 'qty_change', 'movement_type'])
        ]);
        
        setSummaries(summaryData as StockSummary[]);
        setLedger(ledgerData as StockLedger[]);
      } catch (err) {
        console.error("Failed to load inventory data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalOnHand = summaries.reduce((acc, s) => acc + s.qty_on_hand, 0);
  const totalIncoming = summaries.reduce((acc, s) => acc + s.qty_incoming, 0);
  const shortagesCount = summaries.filter(s => s.qty_available === 0).length;

  const topProducts = [...summaries].sort((a, b) => b.qty_on_hand - a.qty_on_hand).slice(0, 5);
  const maxQty = topProducts.length > 0 ? topProducts[0].qty_on_hand : 1;

  const getStatusColor = (type: string, qty: number) => {
    if (qty > 0) return { bg: 'bg-success-forest/10', text: 'text-success-forest' };
    if (qty < 0) return { bg: 'bg-error/10', text: 'text-error' };
    return { bg: 'bg-surface-variant', text: 'text-on-surface' };
  };

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
            <RoleGuard allowedRoles={['admin', 'warehouse_manager', 'warehouse_user']}>
              <button className="px-md py-sm bg-surface-container-lowest border border-outline text-on-surface font-label-md rounded-lg hover:bg-surface-container-high transition-all flex items-center gap-sm shadow-sm">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export Ledger
              </button>
              <button className="px-md py-sm bg-primary text-on-primary font-label-md rounded-lg hover:bg-primary-container transition-all flex items-center gap-sm shadow-sm">
                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                New Movement
              </button>
            </RoleGuard>
          </div>
        </div>

        {/* Dashboard Row 1: KPI & Top Products */}
        <div className="grid grid-cols-12 gap-lg">
          {/* KPI Cards */}
          <div className="col-span-12 lg:col-span-8 grid grid-cols-3 gap-md">
            <div className="bg-surface-container-lowest p-lg border border-outline-variant rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-sm">
                <span className="material-symbols-outlined text-primary p-xs bg-primary/10 rounded-lg">inventory</span>
              </div>
              <p className="font-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Total On-Hand</p>
              <h3 className="font-headline-md text-headline-md mt-xs text-on-surface">
                {loading ? '...' : totalOnHand.toFixed(0)} <span className="text-body-sm font-normal text-outline">units</span>
              </h3>
            </div>
            <div className="bg-surface-container-lowest p-lg border border-outline-variant rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-sm">
                <span className="material-symbols-outlined text-secondary p-xs bg-secondary/10 rounded-lg">local_shipping</span>
              </div>
              <p className="font-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Incoming / In-Transit</p>
              <h3 className="font-headline-md text-headline-md mt-xs text-on-surface">
                {loading ? '...' : totalIncoming.toFixed(0)} <span className="text-body-sm font-normal text-outline">units</span>
              </h3>
            </div>
            <div className="bg-surface-container-lowest p-lg border border-outline-variant rounded-xl shadow-sm">
              <div className="flex justify-between items-start mb-sm">
                <span className="material-symbols-outlined text-error p-xs bg-error/10 rounded-lg">warning</span>
              </div>
              <p className="font-label-sm text-on-surface-variant uppercase tracking-wider font-bold">Stock Shortages</p>
              <h3 className="font-headline-md text-headline-md mt-xs text-on-surface">
                {loading ? '...' : shortagesCount} <span className="text-body-sm font-normal text-outline">SKUs</span>
              </h3>
            </div>
          </div>

          {/* Top Products Chart */}
          <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest p-lg border border-outline-variant rounded-xl shadow-sm">
            <h4 className="font-label-md text-on-surface mb-md font-bold uppercase tracking-widest text-primary">Top 5 Products by Volume</h4>
            <div className="space-y-md">
              {loading ? (
                <div className="animate-pulse text-on-surface-variant">Loading...</div>
              ) : topProducts.length === 0 ? (
                <div className="text-on-surface-variant text-sm">No products found</div>
              ) : topProducts.map((item, index) => {
                const pct = (item.qty_on_hand / maxQty) * 100;
                return (
                  <div key={item.id} className="space-y-xs cursor-pointer" onMouseEnter={() => setHoveredBar(index)} onMouseLeave={() => setHoveredBar(null)}>
                    <div className="flex justify-between font-label-sm">
                      <span className="text-on-surface font-medium truncate max-w-[200px]">{item.product_id[1]}</span>
                      <span className="font-bold text-primary">{item.qty_on_hand.toFixed(0)}</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-primary transition-all duration-300 ${hoveredBar === index ? 'brightness-125' : ''}`} 
                        style={{ width: `${Math.max(pct, 2)}%`, opacity: 1 - (index * 0.15) }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stock Movements Table */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low/50">
            <h3 className="font-headline-sm text-headline-sm text-primary">Recent Stock Movements</h3>
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
                  <th className="px-lg py-sm font-label-md text-on-surface-variant border-b border-outline-variant uppercase tracking-widest">Qty Change</th>
                  <th className="px-lg py-sm font-label-md text-on-surface-variant border-b border-outline-variant uppercase tracking-widest">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? (
                  <tr><td colSpan={7} className="px-lg py-md text-center text-on-surface-variant">Loading movements...</td></tr>
                ) : ledger.length === 0 ? (
                  <tr><td colSpan={7} className="px-lg py-md text-center text-on-surface-variant">No movements found.</td></tr>
                ) : ledger.slice(0, 15).map((row) => {
                  const colors = getStatusColor(row.movement_type, row.qty_change);
                  return (
                    <tr key={row.id} className="hover:bg-primary/5 transition-colors group cursor-pointer">
                      <td className="px-lg py-sm font-body-sm text-on-surface">{row.timestamp}</td>
                      <td className="px-lg py-sm font-label-md text-primary font-bold">{row.source_ref || 'Manual'}</td>
                      <td className="px-lg py-sm">
                        <div className="flex flex-col">
                          <span className="font-label-md text-on-surface font-bold">{row.product_id[1]}</span>
                        </div>
                      </td>
                      <td className="px-lg py-sm font-body-sm text-on-surface-variant font-medium">{row.location_from}</td>
                      <td className="px-lg py-sm font-body-sm text-on-surface-variant font-medium">{row.location_to}</td>
                      <td className={`px-lg py-sm font-label-md font-mono-md font-bold ${colors.text}`}>
                        {row.qty_change > 0 ? '+' : ''}{row.qty_change.toFixed(2)}
                      </td>
                      <td className="px-lg py-sm">
                        <span className={`px-xs py-0.5 ${colors.bg} ${colors.text} text-[11px] font-bold rounded uppercase whitespace-nowrap`}>
                          {row.movement_type}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
