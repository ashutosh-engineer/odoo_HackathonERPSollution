import { useState, useEffect } from 'react';
import { odooSearchRead, odooCall } from '../utils/api';
import { RoleGuard } from '../components/RoleGuard';
import { useAuth } from '../contexts/AuthContext';

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
  image_1920?: string | null;
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

interface VendorRule {
  id: number;
  vendor_id: [number, string];
  product_id: [number, string];
  min_qty: number;
  price: number;
  lead_time: number;
}

interface BomData {
  id: number;
  display_name_computed: string;
  product_qty: number;
  is_active: boolean;
}

interface BomLineData {
  id: number;
  bom_id: [number, string];
  product_id: [number, string];
  qty_required: number;
  uom_id: [number, string];
}

export const ProductMaster = () => {
  const { user } = useAuth();
  const role = user?.shiv_role || '';
  const canSeeCost = ['admin', 'purchase_manager', 'purchase_user', 'auditor', 'accountant'].includes(role);

  const [activeTab, setActiveTab] = useState('inventory');

  const [allProducts, setAllProducts] = useState<ProductData[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  const [product, setProduct] = useState<ProductData | null>(null);
  const [ledger, setLedger] = useState<StockLedger[]>([]);

  // Procurement
  const [vendorRules, setVendorRules] = useState<VendorRule[]>([]);

  // BoM
  const [boms, setBoms] = useState<BomData[]>([]);
  const [bomLines, setBomLines] = useState<BomLineData[]>([]);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', sale_price: 0, cost_price: 0, barcode: '', image_1920: null as string | null });
  const [isSaving, setIsSaving] = useState(false);

  const fetchAllProducts = async () => {
    try {
      setLoadingList(true);
      // Step 1: Fetch stored fields via search_read (computed unstored fields may not be returned)
      let products: any[] = [];
      try {
        products = await odooSearchRead('shiv.product', [], [
          'name', 'internal_ref', 'barcode', 'sale_price', 'cost_price',
          'state', 'qty_on_hand', 'qty_reserved', 'qty_available', 'image_1920'
        ]);
      } catch (searchErr) {
        console.warn("search_read with all fields failed, retrying without restricted fields...", searchErr);
        // cost_price is group-restricted in backend — retry without it
        products = await odooSearchRead('shiv.product', [], [
          'name', 'internal_ref', 'barcode', 'sale_price',
          'state', 'qty_on_hand', 'qty_reserved', 'qty_available', 'image_1920'
        ]);
      }

      // Step 2: If computed stock fields are missing (unstored), fetch via read
      const normalizedProducts = (products as any[]).map((p: any) => ({
        id: p.id,
        name: p.name || '',
        internal_ref: p.internal_ref || '',
        barcode: p.barcode || '',
        sale_price: p.sale_price ?? 0,
        cost_price: p.cost_price ?? 0,
        state: p.state || 'draft',
        qty_on_hand: p.qty_on_hand ?? 0,
        qty_reserved: p.qty_reserved ?? 0,
        qty_available: p.qty_available ?? 0,
        image_1920: p.image_1920 || null,
      }));

      // If stock quantities are all zero (possibly not returned by search_read for unstored computed fields),
      // try fetching them separately via the 'read' method which triggers compute
      const allZeroStock = normalizedProducts.length > 0 && normalizedProducts.every(
        (p: ProductData) => p.qty_on_hand === 0 && p.qty_reserved === 0 && p.qty_available === 0
      );
      if (allZeroStock && normalizedProducts.length > 0) {
        try {
          const ids = normalizedProducts.map((p: ProductData) => p.id);
          const stockData = await odooCall('shiv.product', 'read', [ids, ['qty_on_hand', 'qty_reserved', 'qty_available']]);
          if (Array.isArray(stockData)) {
            const stockMap = new Map(stockData.map((s: any) => [s.id, s]));
            normalizedProducts.forEach((p: ProductData) => {
              const sd = stockMap.get(p.id);
              if (sd) {
                p.qty_on_hand = sd.qty_on_hand ?? 0;
                p.qty_reserved = sd.qty_reserved ?? 0;
                p.qty_available = sd.qty_available ?? 0;
              }
            });
          }
        } catch (stockErr) {
          console.warn("Could not fetch computed stock quantities", stockErr);
        }
      }

      setAllProducts(normalizedProducts as ProductData[]);
      if (normalizedProducts.length > 0 && !selectedProductId) {
        setSelectedProductId((normalizedProducts[0] as ProductData).id);
      }
    } catch (err) {
      console.error("Failed to load products list", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, []);

  const handleEditClick = () => {
    if (product) {
      setEditFormData({ name: product.name, sale_price: product.sale_price, cost_price: product.cost_price, barcode: product.barcode || '', image_1920: product.image_1920 || null });
      setIsEditModalOpen(true);
    }
  };

  const handleDuplicateClick = async () => {
    if (!product) return;
    try {
      setToastMessage('Duplicating product...');
      const newId = await odooCall('shiv.product', 'copy', [[product.id], { name: `${product.name} (Copy)`, barcode: null }]);
      await fetchAllProducts();
      setSelectedProductId(newId);
      setToastMessage('Product duplicated successfully.');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setToastMessage('Failed to duplicate product.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setIsSaving(true);
    try {
      await odooCall('shiv.product', 'write', [[product.id], editFormData]);
      setIsEditModalOpen(false);
      setToastMessage('Product updated successfully.');
      setTimeout(() => setToastMessage(null), 3000);
      await fetchAllProducts();
      // Update local product state slightly to reflect immediately without full reload if preferred, but fetchAllProducts updates list.
      setProduct(prev => prev ? { ...prev, ...editFormData } : null);
    } catch (err) {
      console.error(err);
      setToastMessage('Failed to save changes.');
      setTimeout(() => setToastMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (!selectedProductId) return;

    const fetchProductDetails = async () => {
      try {
        setLoadingDetails(true);
        const selectedProd = allProducts.find(p => p.id === selectedProductId);
        if (selectedProd) {
          setProduct(selectedProd);
        }

        // Fetch stock movements
        try {
          const movements = await odooSearchRead('shiv.stock.ledger', [['product_id', '=', selectedProductId]], [
            'timestamp', 'source_ref', 'location_from', 'location_to', 'qty_change', 'movement_type'
          ]);
          setLedger(movements as StockLedger[]);
        } catch (e) {
          console.warn('Failed to load stock movements', e);
          setLedger([]);
        }

        // Fetch vendor rules
        try {
          const rules = await odooSearchRead('shiv.vendor.product', [['product_id', '=', selectedProductId]], [
            'vendor_id', 'min_qty', 'price', 'lead_time'
          ]);
          setVendorRules(rules as VendorRule[]);
        } catch (e) {
          console.warn('Failed to load vendor rules', e);
          setVendorRules([]);
        }

        // Fetch BoMs
        try {
          const bomsData = await odooSearchRead('shiv.bom', [['product_id', '=', selectedProductId]], [
            'display_name_computed', 'product_qty', 'is_active'
          ]);
          setBoms(bomsData as BomData[]);

          if (bomsData.length > 0) {
            const bomIds = (bomsData as BomData[]).map(b => b.id);
            const linesData = await odooSearchRead('shiv.bom.line', [['bom_id', 'in', bomIds]], [
              'bom_id', 'product_id', 'qty_required', 'uom_id'
            ]);
            setBomLines(linesData as BomLineData[]);
          } else {
            setBomLines([]);
          }
        } catch (e) {
          console.warn('Failed to load BoMs', e);
          setBoms([]);
          setBomLines([]);
        }

      } catch (err) {
        console.error("Failed to load product details", err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchProductDetails();
  }, [selectedProductId, allProducts]);

  if (loadingList) return <div className="p-8 text-center text-on-surface-variant animate-pulse font-bold">Loading Products...</div>;
  if (allProducts.length === 0) return <div className="p-8 text-center text-error font-bold">No product found</div>;

  return (
    <div className="flex h-full w-full bg-surface">
      {/* Sidebar Overlay (Mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar for Product Selection */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-[280px] bg-white border-r border-outline-variant flex flex-col z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-4 border-b border-outline-variant bg-surface-container-lowest">
          <h2 className="font-headline-sm text-primary font-bold flex items-center gap-2">
            <span className="material-symbols-outlined">inventory</span>
            Products
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {allProducts.map(p => (
            <button
              key={p.id}
              onClick={() => {
                setSelectedProductId(p.id);
                setSidebarOpen(false);
              }}
              className={`w-full text-left p-4 border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors ${selectedProductId === p.id ? 'bg-primary/10 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="font-bold text-on-surface truncate">{p.name}</div>
              <div className="text-body-sm text-on-surface-variant font-mono mt-1">{p.internal_ref}</div>
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 max-w-full">
        {/* Header & Action Bar */}
        <div className="bg-white border-b border-outline-variant p-4 md:px-lg sticky top-0 z-30 flex-shrink-0 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg bg-surface-container hover:bg-surface-variant text-on-surface"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
              <div>
                <nav className="flex text-label-md text-outline mb-1 gap-2 items-center">
                  <span className="hover:text-primary transition-colors cursor-pointer font-bold">Products</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  <span className="text-primary font-bold">{product?.name || 'Loading...'}</span>
                </nav>
                <h1 className="font-headline-md text-headline-md text-on-surface truncate pr-4">{product?.name} <span className="text-outline font-normal text-body-lg ml-2">[{product?.internal_ref}]</span></h1>
              </div>
            </div>
            <div className="flex gap-3">
              <RoleGuard allowedRoles={['admin', 'warehouse_manager', 'warehouse_user']}>
                <button onClick={handleEditClick} className="px-md py-sm bg-primary text-on-primary rounded-lg font-bold text-label-md flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95">
                  <span className="material-symbols-outlined text-[20px]">edit_square</span> Edit
                </button>
                <button onClick={handleDuplicateClick} className="hidden md:flex px-md py-sm border-2 border-outline-variant text-on-surface-variant bg-white rounded-lg font-bold text-label-md hover:bg-surface transition-colors">
                  Duplicate
                </button>
              </RoleGuard>
              <button onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                setToastMessage('Link copied to clipboard!');
                setTimeout(() => setToastMessage(null), 3000);
              }} className="p-2 border-2 border-outline-variant text-on-surface-variant bg-white rounded-lg hover:bg-surface transition-colors flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">share</span>
              </button>
            </div>
          </div>
        </div>

        {loadingDetails ? (
          <div className="flex-1 p-8 text-center text-on-surface-variant animate-pulse font-bold">Loading Details...</div>
        ) : !product ? (
          <div className="flex-1 p-8 text-center text-error font-bold">Product not selected</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Status Tracker (Steppers) */}
            <div className="flex border-b border-outline-variant bg-white">
              <button
                onClick={async () => {
                  if (product.state !== 'active') {
                    setToastMessage('Activating product...');
                    await odooCall('shiv.product', 'action_activate', [[product.id]]);
                    fetchAllProducts();
                  }
                }}
                className={`status-stepper-item relative px-8 py-3 font-bold text-label-md flex items-center gap-2 ${product.state === 'active' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer'}`}>
                {product.state === 'active' && <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>}
                Active
              </button>
              <button
                onClick={async () => {
                  if (product.state !== 'archived') {
                    setToastMessage('Archiving product...');
                    await odooCall('shiv.product', 'action_archive', [[product.id]]);
                    fetchAllProducts();
                  }
                }}
                className={`status-stepper-item relative px-8 py-3 font-bold text-label-md ${product.state === 'archived' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer'}`}>
                Archived
              </button>
              <button
                onClick={async () => {
                  if (product.state !== 'discontinued') {
                    setToastMessage('Discontinuing product...');
                    await odooCall('shiv.product', 'action_discontinue', [[product.id]]);
                    fetchAllProducts();
                  }
                }}
                className={`status-stepper-item relative px-8 py-3 font-bold text-label-md ${product.state === 'discontinued' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer'}`}>
                Discontinued
              </button>
            </div>

            {/* Main Form Canvas */}
            <div className="p-4 md:p-lg space-y-lg max-w-[1440px] mx-auto">
              {/* Summary Header Card */}
              <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm flex flex-col lg:flex-row">
                <div className="w-full lg:w-[250px] aspect-video lg:aspect-square bg-surface-container flex items-center justify-center p-6 flex-shrink-0 relative group">
                  <div className="product-image-container w-full h-full max-h-[200px] max-w-[200px] rounded-xl overflow-hidden bg-white shadow-md flex items-center justify-center relative">
                    {product.image_1920 ? (
                      <img src={`data:image/jpeg;base64,${product.image_1920}`} alt={product.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="material-symbols-outlined text-[64px] text-outline">inventory_2</span>
                    )}
                  </div>
                </div>
                <div className="flex-grow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-label-sm uppercase text-outline mb-1 font-bold tracking-wider">Product Name</label>
                      <div className="text-headline-sm font-bold text-on-surface leading-tight">{product.name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-surface p-3 rounded-lg border border-outline-variant/30">
                        <label className="block text-label-sm uppercase text-outline mb-1">Internal SKU</label>
                        <div className="font-mono font-bold text-on-surface text-sm">{product.internal_ref}</div>
                      </div>
                      <div className="bg-surface p-3 rounded-lg border border-outline-variant/30">
                        <label className="block text-label-sm uppercase text-outline mb-1">Barcode</label>
                        <div className="text-body-sm font-bold">{product.barcode || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center p-4 bg-primary-container/10 border border-primary/20 rounded-xl">
                      <div>
                        <label className="block text-label-sm uppercase text-primary font-bold">Sales Price</label>
                        <div className="text-headline-md font-black text-primary">₹{product.sale_price.toLocaleString()}</div>
                      </div>
                      <span className="material-symbols-outlined text-primary/30 text-[36px]">loyalty</span>
                    </div>
                    {canSeeCost && (
                      <div className="flex justify-between items-center p-4 bg-secondary/10 border border-secondary/20 rounded-xl">
                        <div>
                          <label className="block text-label-sm uppercase text-secondary font-bold">Cost Price</label>
                          <div className="text-headline-md font-black text-secondary">₹{product.cost_price.toLocaleString()}</div>
                        </div>
                        <span className="material-symbols-outlined text-secondary/30 text-[36px]">account_balance_wallet</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabbed Content Section */}
              <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
                {/* Tabs Header */}
                <div className="flex border-b border-outline-variant bg-surface-container overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`py-3 px-6 font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'inventory' ? 'border-b-4 border-primary text-primary bg-white' : 'text-on-surface-variant hover:text-primary hover:bg-white/50'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">warehouse</span> Inventory
                  </button>
                  <button
                    onClick={() => setActiveTab('procurement')}
                    className={`py-3 px-6 font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'procurement' ? 'border-b-4 border-primary text-primary bg-white' : 'text-on-surface-variant hover:text-primary hover:bg-white/50'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">local_shipping</span> Procurement
                  </button>
                  <button
                    onClick={() => setActiveTab('bom')}
                    className={`py-3 px-6 font-bold flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === 'bom' ? 'border-b-4 border-primary text-primary bg-white' : 'text-on-surface-variant hover:text-primary hover:bg-white/50'}`}
                  >
                    <span className="material-symbols-outlined text-[20px]">account_tree</span> Bill of Materials
                  </button>
                </div>

                {/* Tabs Content */}
                <div className="p-4 md:p-6">
                  {/* INVENTORY TAB */}
                  {activeTab === 'inventory' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-primary-container text-on-primary-container rounded-xl shadow-sm border border-primary/20">
                          <div className="font-label-sm uppercase font-bold tracking-wider mb-2 opacity-80">Current On Hand</div>
                          <div className="font-headline-lg font-black">{product.qty_on_hand.toFixed(0)}</div>
                        </div>
                        <div className="p-4 bg-warning-amber text-white rounded-xl shadow-sm border border-warning-amber/20">
                          <div className="font-label-sm uppercase font-bold tracking-wider mb-2 opacity-90">Reserved Stock</div>
                          <div className="font-headline-lg font-black">{product.qty_reserved.toFixed(0)}</div>
                        </div>
                        <div className="p-4 bg-success-forest text-white rounded-xl shadow-sm border border-success-forest/20">
                          <div className="font-label-sm uppercase font-bold tracking-wider mb-2 opacity-90">Free to Use</div>
                          <div className="font-headline-lg font-black">{product.qty_available.toFixed(0)}</div>
                        </div>
                      </div>

                      <div className="border border-outline-variant rounded-xl overflow-hidden">
                        <div className="bg-surface-container-low p-4 border-b border-outline-variant">
                          <h3 className="font-bold text-on-surface">Recent Stock Movements</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left">
                            <thead className="bg-surface text-label-sm uppercase text-on-surface-variant">
                              <tr>
                                <th className="p-3 border-b border-outline-variant">Date</th>
                                <th className="p-3 border-b border-outline-variant">Reference</th>
                                <th className="p-3 border-b border-outline-variant">From</th>
                                <th className="p-3 border-b border-outline-variant">To</th>
                                <th className="p-3 border-b border-outline-variant text-right">Qty</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ledger.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-4 text-on-surface-variant">No recent movements.</td></tr>
                              ) : ledger.slice(0, 10).map(row => (
                                <tr key={row.id} className="hover:bg-surface-container-lowest border-b border-outline-variant/30">
                                  <td className="p-3 font-mono text-sm">{row.timestamp.split(' ')[0]}</td>
                                  <td className="p-3 font-bold text-primary text-sm">{row.source_ref || 'Manual'}</td>
                                  <td className="p-3 text-sm">{row.location_from}</td>
                                  <td className="p-3 text-sm">{row.location_to}</td>
                                  <td className={`p-3 text-right font-bold text-sm ${row.qty_change > 0 ? 'text-success-forest' : 'text-error'}`}>
                                    {row.qty_change > 0 ? '+' : ''}{row.qty_change.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* PROCUREMENT TAB */}
                  {activeTab === 'procurement' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="border border-outline-variant rounded-xl p-4 bg-surface-container-lowest">
                          <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined">route</span>
                            Procurement Settings
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-label-sm text-on-surface-variant mb-1">Procurement Method</label>
                              <div className="font-semibold px-3 py-1 bg-surface-variant rounded inline-block text-sm">Buy / Make to Stock (MTS)</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-label-sm text-on-surface-variant mb-1">Reorder Point (Min)</label>
                                <div className="font-mono font-bold text-lg">10.0</div>
                              </div>
                              <div>
                                <label className="block text-label-sm text-on-surface-variant mb-1">Reorder Quantity</label>
                                <div className="font-mono font-bold text-lg">50.0</div>
                              </div>
                            </div>
                            <div>
                              <label className="block text-label-sm text-on-surface-variant mb-1">Manufacturing Lead Time</label>
                              <div className="font-semibold text-sm">3 Days</div>
                            </div>
                          </div>
                        </div>

                        <div className="border border-outline-variant rounded-xl overflow-hidden">
                          <div className="bg-surface-container-low p-4 border-b border-outline-variant">
                            <h3 className="font-bold text-primary flex items-center gap-2">
                              <span className="material-symbols-outlined">storefront</span> Vendor Supplier Rules
                            </h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left">
                              <thead className="bg-surface text-label-sm uppercase text-on-surface-variant">
                                <tr>
                                  <th className="p-3 border-b border-outline-variant">Vendor</th>
                                  <th className="p-3 border-b border-outline-variant text-right">Min Qty</th>
                                  <th className="p-3 border-b border-outline-variant text-right">Price</th>
                                  <th className="p-3 border-b border-outline-variant text-right">Lead (Days)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {vendorRules.length === 0 ? (
                                  <tr><td colSpan={4} className="text-center p-4 text-on-surface-variant">No vendor rules defined.</td></tr>
                                ) : vendorRules.map(rule => (
                                  <tr key={rule.id} className="hover:bg-surface-container-lowest border-b border-outline-variant/30">
                                    <td className="p-3 font-bold text-sm">{rule.vendor_id[1]}</td>
                                    <td className="p-3 text-right font-mono text-sm">{rule.min_qty}</td>
                                    <td className="p-3 text-right font-mono text-sm">₹{rule.price.toFixed(2)}</td>
                                    <td className="p-3 text-right font-mono text-sm">{rule.lead_time}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BILL OF MATERIALS TAB */}
                  {activeTab === 'bom' && (
                    <div className="space-y-6">
                      {boms.length === 0 ? (
                        <div className="border border-outline-variant rounded-xl p-8 text-center bg-surface-container-lowest">
                          <span className="material-symbols-outlined text-[48px] text-outline mb-2">account_tree</span>
                          <h3 className="font-bold text-lg text-on-surface">No Bill of Materials</h3>
                          <p className="text-on-surface-variant text-sm mt-1">This product is not configured to be manufactured with a BoM.</p>
                        </div>
                      ) : (
                        boms.map(bom => (
                          <div key={bom.id} className="border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                            <div className="bg-surface-container-low p-4 border-b border-outline-variant flex justify-between items-center">
                              <div>
                                <h3 className="font-bold text-primary text-lg">{bom.display_name_computed}</h3>
                                <div className="text-sm text-on-surface-variant">To produce: <span className="font-bold">{bom.product_qty}</span> Units</div>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs font-bold ${bom.is_active ? 'bg-success-forest/20 text-success-forest' : 'bg-surface-variant text-on-surface-variant'}`}>
                                {bom.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                <thead className="bg-surface text-label-sm uppercase text-on-surface-variant">
                                  <tr>
                                    <th className="p-3 border-b border-outline-variant pl-6">Component Product</th>
                                    <th className="p-3 border-b border-outline-variant text-right">Qty Required</th>
                                    <th className="p-3 border-b border-outline-variant pr-6">UoM</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bomLines.filter(line => line.bom_id[0] === bom.id).map(line => (
                                    <tr key={line.id} className="hover:bg-surface-container-lowest border-b border-outline-variant/30">
                                      <td className="p-3 pl-6 font-bold text-sm flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px] text-outline">subdirectory_arrow_right</span>
                                        {line.product_id[1]}
                                      </td>
                                      <td className="p-3 text-right font-mono text-sm">{line.qty_required.toFixed(2)}</td>
                                      <td className="p-3 pr-6 text-sm text-on-surface-variant">{line.uom_id[1]}</td>
                                    </tr>
                                  ))}
                                  {bomLines.filter(line => line.bom_id[0] === bom.id).length === 0 && (
                                    <tr><td colSpan={3} className="text-center p-4 text-on-surface-variant">No components mapped.</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      <div className={`fixed bottom-8 right-8 bg-inverse-surface text-inverse-on-surface px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 transition-transform duration-300 z-50 ${toastMessage ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}>
        <span className="material-symbols-outlined text-primary-container">info</span>
        <p className="font-label-md">{toastMessage}</p>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)]">
          <div className="bg-white p-6 rounded-lg w-full max-w-[450px] shadow-soft border border-outline-variant">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-on-surface border-b border-outline-variant pb-2">
              Edit Product
            </h3>
            <form onSubmit={submitEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Product Name</label>
                <input required type="text" value={editFormData.name} onChange={e => setEditFormData({ ...editFormData, name: e.target.value })} className="w-full border border-outline-variant rounded p-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Product Image</label>
                <input type="file" accept="image/*" onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64String = (reader.result as string).split(',')[1];
                      setEditFormData({ ...editFormData, image_1920: base64String });
                    };
                    reader.readAsDataURL(file);
                  }
                }} className="w-full border border-outline-variant rounded p-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1">Barcode</label>
                <input type="text" value={editFormData.barcode} onChange={e => setEditFormData({ ...editFormData, barcode: e.target.value })} className="w-full border border-outline-variant rounded p-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Sale Price (₹)</label>
                  <input required type="number" step="0.01" value={editFormData.sale_price} onChange={e => setEditFormData({ ...editFormData, sale_price: parseFloat(e.target.value) || 0 })} className="w-full border border-outline-variant rounded p-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-on-surface-variant mb-1">Cost Price (₹)</label>
                  <input required type="number" step="0.01" value={editFormData.cost_price} onChange={e => setEditFormData({ ...editFormData, cost_price: parseFloat(e.target.value) || 0 })} className="w-full border border-outline-variant rounded p-2 focus:border-primary focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-outline-variant">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 border border-outline-variant text-on-surface font-bold rounded hover:bg-surface-variant transition-colors">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-primary text-white font-bold rounded hover:opacity-90 disabled:opacity-50 transition-colors">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
