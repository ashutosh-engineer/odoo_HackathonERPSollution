import { useState, useEffect } from 'react';
import { odooSearchRead } from '../utils/api';
import { RoleGuard } from '../components/RoleGuard';

interface ProductData {
  id: number;
  name: string;
  internal_ref: string;
  barcode: string;
  sale_price: number;
  cost_price: number;
  state: string;
  qty_on_hand: number;
  qty_reserved: number;
  qty_available: number;
}

interface StockLedger {
  id: number;
  timestamp: string;
  source_ref: string;
  location_from: string;
  location_to: string;
  qty_change: number;
  movement_type: string;
}

export const ProductMaster = () => {
  const [activeTab, setActiveTab] = useState('inventory');
  
  const [product, setProduct] = useState<ProductData | null>(null);
  const [ledger, setLedger] = useState<StockLedger[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch first product
        const products = await odooSearchRead('shiv.product', [], [
          'name', 'internal_ref', 'barcode', 'sale_price', 'cost_price',
          'state', 'qty_on_hand', 'qty_reserved', 'qty_available'
        ]);
        
        if (products.length > 0) {
          const prod = products[0] as ProductData;
          setProduct(prod);
          
          // Fetch its stock movements
          const movements = await odooSearchRead('shiv.stock.ledger', [['product_id', '=', prod.id]], [
            'timestamp', 'source_ref', 'location_from', 'location_to', 'qty_change', 'movement_type'
          ]);
          setLedger(movements as StockLedger[]);
        }
      } catch (err) {
        console.error("Failed to load product", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-on-surface-variant animate-pulse font-bold">Loading Product...</div>;
  if (!product) return <div className="p-8 text-center text-error font-bold">No product found</div>;

  return (
    <div className="w-full">
      {/* Header & Action Bar */}
      <div className="bg-white border-b border-outline-variant p-4 md:px-lg sticky top-16 z-30">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <nav className="flex text-label-md text-outline mb-1 gap-2 items-center">
              <span className="hover:text-primary transition-colors cursor-pointer font-bold">Products</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-primary font-bold">{product.name}</span>
            </nav>
            <h1 className="font-headline-md text-headline-md text-on-surface">{product.name} <span className="text-outline font-normal text-body-lg ml-2">[{product.internal_ref}]</span></h1>
          </div>
          <div className="flex gap-3">
            <RoleGuard allowedRoles={['admin', 'warehouse_manager', 'warehouse_user']}>
              <button className="px-md py-sm bg-primary text-on-primary rounded-lg font-bold text-label-md flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95">
                <span className="material-symbols-outlined text-[20px]">edit_square</span> Edit Product
              </button>
              <button className="px-md py-sm border-2 border-outline-variant text-on-surface-variant bg-white rounded-lg font-bold text-label-md hover:bg-surface transition-colors">
                Duplicate
              </button>
            </RoleGuard>
            <button className="p-2 border-2 border-outline-variant text-on-surface-variant bg-white rounded-lg hover:bg-surface transition-colors flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Tracker (Steppers) */}
      <div className="flex border-b border-outline-variant overflow-x-auto bg-white">
        <div className={`status-stepper-item relative px-10 py-4 font-bold text-label-md flex items-center gap-2 ${product.state === 'active' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          Active
        </div>
        <div className={`status-stepper-item relative px-10 py-4 font-bold text-label-md ${product.state === 'archived' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
          Archived
        </div>
        <div className={`status-stepper-item relative px-10 py-4 font-bold text-label-md ${product.state === 'discontinued' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
          Discontinued
        </div>
      </div>

      {/* Main Form Canvas */}
      <div className="p-lg space-y-lg max-w-[1440px] mx-auto">
        {/* Summary Header Card */}
        <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-md flex flex-col md:flex-row">
          <div className="w-full md:w-[400px] aspect-square bg-surface-container flex items-center justify-center p-6">
            <div className="product-image-container w-full h-full rounded-xl overflow-hidden bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] flex items-center justify-center">
              <span className="material-symbols-outlined text-[80px] text-outline">inventory_2</span>
            </div>
          </div>
          <div className="flex-grow p-xl grid grid-cols-1 md:grid-cols-2 gap-xl">
            <div className="space-y-xl">
              <div>
                <label className="block text-label-sm uppercase text-outline mb-2 font-black tracking-widest">Product Information</label>
                <div className="text-headline-md font-bold text-on-surface leading-tight">{product.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-md">
                <div className="bg-surface p-3 rounded-lg border border-outline-variant/30">
                  <label className="block text-label-sm uppercase text-outline mb-1">Internal SKU</label>
                  <div className="font-mono font-bold text-on-surface">{product.internal_ref}</div>
                </div>
                <div className="bg-surface p-3 rounded-lg border border-outline-variant/30">
                  <label className="block text-label-sm uppercase text-outline mb-1">Barcode</label>
                  <div className="text-body-md font-bold">{product.barcode || 'N/A'}</div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-md">
              <div className="flex justify-between items-center p-md bg-primary-container/10 border-2 border-primary-container/20 rounded-xl">
                <div>
                  <label className="block text-label-sm uppercase text-primary font-black">Sales Price</label>
                  <div className="text-headline-lg font-black text-primary">₹{product.sale_price.toLocaleString()}</div>
                </div>
                <span className="material-symbols-outlined text-primary/30 text-[48px]">loyalty</span>
              </div>
              <div className="flex justify-between items-center p-md bg-secondary/10 border-2 border-secondary/20 rounded-xl">
                <div>
                  <label className="block text-label-sm uppercase text-secondary font-black">Cost Price</label>
                  <div className="text-headline-lg font-black text-secondary">₹{product.cost_price.toLocaleString()}</div>
                </div>
                <span className="material-symbols-outlined text-secondary/30 text-[48px]">account_balance_wallet</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Content Section */}
        <div className="bg-white border border-outline-variant rounded-xl shadow-md overflow-hidden">
          {/* Tabs Header */}
          <div className="flex border-b border-outline-variant bg-surface-container">
            <button 
              onClick={() => setActiveTab('inventory')}
              className={`py-4 px-xl font-bold flex items-center gap-2 transition-colors ${activeTab === 'inventory' ? 'border-b-4 border-primary text-primary bg-white' : 'text-on-surface-variant hover:text-primary hover:bg-white/50'}`}
            >
              <span className="material-symbols-outlined text-[20px]">warehouse</span> Inventory
            </button>
            <button 
              onClick={() => setActiveTab('procurement')}
              className={`py-4 px-xl font-bold flex items-center gap-2 transition-colors ${activeTab === 'procurement' ? 'border-b-4 border-primary text-primary bg-white' : 'text-on-surface-variant hover:text-primary hover:bg-white/50'}`}
            >
              <span className="material-symbols-outlined text-[20px]">local_shipping</span> Procurement
            </button>
            <button 
              onClick={() => setActiveTab('bom')}
              className={`py-4 px-xl font-bold flex items-center gap-2 transition-colors ${activeTab === 'bom' ? 'border-b-4 border-primary text-primary bg-white' : 'text-on-surface-variant hover:text-primary hover:bg-white/50'}`}
            >
              <span className="material-symbols-outlined text-[20px]">account_tree</span> Bill of Materials
            </button>
          </div>

          {/* Tabs Content: Inventory */}
          {activeTab === 'inventory' && (
            <div className="p-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-lg mb-xl">
                {/* KPI Card 1: On Hand (Vibrant) */}
                <div className="p-lg bg-primary-container text-on-primary-container rounded-xl relative overflow-hidden group shadow-lg border-2 border-primary-container">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <span className="font-label-md uppercase font-black tracking-widest text-on-primary-container/80">Current On Hand</span>
                    <span className="material-symbols-outlined bg-white/20 p-2 rounded-lg backdrop-blur-sm">inventory_2</span>
                  </div>
                  <div className="font-headline-lg text-[42px] font-black leading-none mb-2 relative z-10">{product.qty_on_hand.toFixed(0)}</div>
                  <span className="absolute -right-4 -bottom-4 opacity-10 text-[140px] material-symbols-outlined group-hover:rotate-12 transition-transform duration-700">warehouse</span>
                </div>

                {/* KPI Card 2: Reserved (Vibrant Warning) */}
                <div className="p-lg bg-warning-amber text-white rounded-xl relative overflow-hidden group shadow-lg border-2 border-warning-amber">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <span className="font-label-md uppercase font-black tracking-widest text-white/80">Reserved Stock</span>
                    <span className="material-symbols-outlined bg-white/20 p-2 rounded-lg backdrop-blur-sm">lock_clock</span>
                  </div>
                  <div className="font-headline-lg text-[42px] font-black leading-none mb-2 relative z-10">{product.qty_reserved.toFixed(0)}</div>
                  <span className="absolute -right-4 -bottom-4 opacity-10 text-[140px] material-symbols-outlined group-hover:rotate-12 transition-transform duration-700">lock</span>
                </div>

                {/* KPI Card 3: Free-to-use (Vibrant Success) */}
                <div className="p-lg bg-success-forest text-white rounded-xl relative overflow-hidden group shadow-lg border-2 border-success-forest">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <span className="font-label-md uppercase font-black tracking-widest text-white/80">Free to Use</span>
                    <span className="material-symbols-outlined bg-white/20 p-2 rounded-lg backdrop-blur-sm">task_alt</span>
                  </div>
                  <div className="font-headline-lg text-[42px] font-black leading-none mb-2 relative z-10">{product.qty_available.toFixed(0)}</div>
                  <span className="absolute -right-4 -bottom-4 opacity-10 text-[140px] material-symbols-outlined group-hover:rotate-12 transition-transform duration-700">check_circle</span>
                </div>
              </div>

              {/* Stock Movements */}
              <div className="border-2 border-outline-variant rounded-xl overflow-hidden shadow-sm">
                <div className="bg-surface p-md border-b-2 border-outline-variant flex justify-between items-center">
                  <h3 className="text-label-md font-black uppercase tracking-wider text-on-surface">Recent Stock Movements</h3>
                </div>
                <table className="w-full text-left border-collapse table-dense">
                  <thead className="bg-surface-container text-label-md uppercase font-black text-on-surface-variant">
                    <tr>
                      <th className="border-b border-outline-variant p-3.5 px-5">Date</th>
                      <th className="border-b border-outline-variant p-3.5 px-5">Reference</th>
                      <th className="border-b border-outline-variant p-3.5 px-5">Origin</th>
                      <th className="border-b border-outline-variant p-3.5 px-5">Destination</th>
                      <th className="border-b border-outline-variant text-right p-3.5 px-5">Quantity</th>
                      <th className="border-b border-outline-variant text-center p-3.5 px-5">Type</th>
                    </tr>
                  </thead>
                  <tbody className="text-body-md bg-white">
                    {ledger.length === 0 ? (
                      <tr><td colSpan={6} className="text-center p-4">No recent movements.</td></tr>
                    ) : ledger.slice(0, 10).map(row => (
                      <tr key={row.id} className="hover:bg-primary/5 transition-colors border-b border-outline-variant/30">
                        <td className="font-mono text-body-sm text-outline font-bold p-3.5 px-5">{row.timestamp.split(' ')[0]}</td>
                        <td className="text-primary font-black p-3.5 px-5">{row.source_ref || 'Manual'}</td>
                        <td className="text-on-surface-variant font-bold p-3.5 px-5">{row.location_from}</td>
                        <td className="text-on-surface-variant font-bold p-3.5 px-5">{row.location_to}</td>
                        <td className={`text-right font-black p-3.5 px-5 ${row.qty_change > 0 ? 'text-success-forest' : 'text-danger-brick'}`}>
                          {row.qty_change > 0 ? '+' : ''}{row.qty_change.toFixed(2)}
                        </td>
                        <td className="text-center p-3.5 px-5">
                          <span className="px-4 py-1 bg-surface-variant text-on-surface rounded-full text-[11px] font-black uppercase tracking-tight shadow-sm">
                            {row.movement_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
