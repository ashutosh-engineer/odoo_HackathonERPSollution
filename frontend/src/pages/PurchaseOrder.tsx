import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { odooSearchRead, odooCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface PurchaseOrderLine {
  id: number;
  product_id: [number, string];
  qty_ordered: number;
  qty_received: number;
  unit_price: number;
  subtotal: number;
}

interface PurchaseOrderData {
  id: number;
  name: string;
  vendor_id: [number, string];
  state: string;
  date_order: string;
  date_expected: string;
  total_amount: number;
  line_ids: number[];
}

export const PurchaseOrder = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [po, setPo] = useState<PurchaseOrderData | null>(null);
  const [lines, setLines] = useState<PurchaseOrderLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const isNew = id === 'new';
  const role = user?.shiv_role || '';
  // Only purchase_manager (and admin) can confirm
  const canConfirm = ['admin', 'purchase_manager'].includes(role);
  // warehouse staff + admin can receive
  const canReceive = ['admin', 'purchase_manager', 'warehouse_manager', 'warehouse_user'].includes(role);

  // New PO creation states
  const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);
  const [productList, setProductList] = useState<{ id: number; name: string; cost_price: number }[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<number | ''>('');
  const [expectedDate, setExpectedDate] = useState('');
  const [newLines, setNewLines] = useState<{ product_id: number; qty_ordered: number; unit_price: number }[]>([]);

  // Fetch for new PO creation
  useEffect(() => {
    if (isNew) {
      const fetchNewFormData = async () => {
        try {
          setLoading(true);
          const [vendorsData, productsData] = await Promise.all([
            odooSearchRead('shiv.vendor', [['is_active', '=', true]], ['name']),
            odooSearchRead('shiv.product', [['state', '=', 'active']], ['name', 'cost_price'])
          ]);
          setVendors(vendorsData as any);
          setProductList(productsData as any);
        } catch (err: any) {
          setActionError(err.message || 'Failed to load form data');
        } finally {
          setLoading(false);
        }
      };
      fetchNewFormData();
    }
  }, [isNew]);

  const fetchPO = async () => {
    if (isNew) return;
    try {
      setLoading(true);
      const orders = await odooSearchRead(
        'shiv.purchase.order',
        [['id', '=', parseInt(id || '0')]],
        ['name', 'vendor_id', 'state', 'date_order', 'date_expected', 'total_amount', 'line_ids']
      );
      if (orders.length > 0) {
        const order = orders[0] as PurchaseOrderData;
        setPo(order);
        if (order.line_ids?.length > 0) {
          const lineData = await odooSearchRead(
            'shiv.purchase.order.line',
            [['id', 'in', order.line_ids]],
            ['product_id', 'qty_ordered', 'qty_received', 'unit_price', 'subtotal']
          );
          setLines(lineData as PurchaseOrderLine[]);
        } else {
          setLines([]);
        }
      }
    } catch (err) {
      console.error('Failed to load PO', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPO(); }, [id, isNew]);

  const handleAction = async (actionName: string) => {
    if (isNew || !po) return;
    try {
      setActionError(null);
      await odooCall('shiv.purchase.order', actionName, [[po.id]]);
      await fetchPO();
      if (actionName === 'action_receive') {
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (err: any) {
      setActionError(`Action failed: ${err.message || err}`);
    }
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) {
      setActionError('Please select a vendor');
      return;
    }
    if (!expectedDate) {
      setActionError('Please select an expected date');
      return;
    }
    if (newLines.length === 0) {
      setActionError('Add at least one product line');
      return;
    }
    try {
      setActionError(null);
      setLoading(true);

      const lineIds = newLines.map(line => [0, 0, {
        product_id: line.product_id,
        qty_ordered: line.qty_ordered,
        unit_price: line.unit_price,
      }]);

      const newPoId = await odooCall('shiv.purchase.order', 'create', [{
        vendor_id: selectedVendorId,
        date_expected: expectedDate,
        line_ids: lineIds,
      }]);

      navigate(`/purchase/${newPoId}`);
    } catch (err: any) {
      setActionError(`Failed to create PO: ${err.message || err}`);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-on-surface-variant animate-pulse font-bold">Loading Purchase Order...</div>;

  const calculatedTotal = newLines.reduce((sum, line) => sum + (line.qty_ordered * line.unit_price), 0);

  if (isNew) {
    return (
      <div className="w-full relative bg-surface-base text-on-surface flex flex-col items-center">
        {actionError && (
          <div className="w-full max-w-[1200px] mt-4 px-lg">
            <div className="bg-error-container text-error px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {actionError}
              <button onClick={() => setActionError(null)} className="ml-auto">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        )}

        {/* TOP BAR */}
        <header className="flex justify-between items-center px-lg py-sm sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant w-full max-w-[1200px]">
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary">Create New Purchase Order</h1>
          <div className="flex items-center gap-md">
            <button
              onClick={() => navigate('/purchase')}
              className="border border-outline text-on-surface px-md py-xs rounded-lg font-label-md hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
          </div>
        </header>

        <form onSubmit={handleCreatePO} className="p-lg flex flex-col md:flex-row gap-lg w-full max-w-[1200px]">
          <div className="flex-1 flex flex-col gap-lg">
            {/* Vendor Details */}
            <div className="bg-white border border-outline-variant rounded-xl p-md shadow-sm">
              <div className="flex items-center gap-sm mb-md border-b border-outline-variant pb-sm">
                <span className="material-symbols-outlined text-primary">local_shipping</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">Vendor Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                  <label className="font-label-md text-[10px] text-on-surface-variant block mb-xs uppercase tracking-wider">Vendor *</label>
                  <select
                    required
                    value={selectedVendorId}
                    onChange={e => setSelectedVendorId(Number(e.target.value))}
                    className="w-full border border-outline-variant rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-label-md text-[10px] text-on-surface-variant block mb-xs uppercase tracking-wider">Expected Delivery Date *</label>
                  <input
                    required
                    type="date"
                    value={expectedDate}
                    onChange={e => setExpectedDate(e.target.value)}
                    className="w-full border border-outline-variant rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-primary outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Order Lines */}
            <div className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden">
              <div className="p-md bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
                <h3 className="font-label-md text-on-surface-variant uppercase font-bold">Order Lines</h3>
                <button
                  type="button"
                  onClick={() => {
                    if (productList.length > 0) {
                      setNewLines([
                        ...newLines,
                        {
                          product_id: productList[0].id,
                          qty_ordered: 1,
                          unit_price: productList[0].cost_price,
                        }
                      ]);
                    }
                  }}
                  className="bg-primary text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-all flex items-center gap-1 font-label-md shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span> Add Product
                </button>
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container text-on-surface-variant text-[11px] uppercase tracking-wider font-bold">
                    <th className="px-md py-sm font-label-md">Product</th>
                    <th className="px-md py-sm font-label-md text-center w-24">Qty Ordered</th>
                    <th className="px-md py-sm font-label-md text-right w-36">Unit Price (₹)</th>
                    <th className="px-md py-sm font-label-md text-right w-36">Subtotal</th>
                    <th className="px-md py-sm font-label-md text-center w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {newLines.map((line, idx) => (
                    <tr key={idx} className="hover:bg-primary-container/10 transition-colors">
                      <td className="px-md py-md">
                        <select
                          value={line.product_id}
                          onChange={e => {
                            const pid = Number(e.target.value);
                            const prod = productList.find(p => p.id === pid);
                            const updated = [...newLines];
                            updated[idx] = {
                              ...line,
                              product_id: pid,
                              unit_price: prod?.cost_price || 0,
                            };
                            setNewLines(updated);
                          }}
                          className="w-full border border-outline-variant rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-primary outline-none text-body-sm font-bold"
                        >
                          {productList.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-md py-md text-center">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={line.qty_ordered}
                          onChange={e => {
                            const updated = [...newLines];
                            updated[idx] = {
                              ...line,
                              qty_ordered: Math.max(1, Number(e.target.value)),
                            };
                            setNewLines(updated);
                          }}
                          className="w-20 border border-outline-variant rounded-lg px-2 py-1 bg-white text-center focus:ring-1 focus:ring-primary outline-none font-mono"
                        />
                      </td>
                      <td className="px-md py-md text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.unit_price}
                          onChange={e => {
                            const updated = [...newLines];
                            updated[idx] = {
                              ...line,
                              unit_price: Math.max(0, parseFloat(e.target.value) || 0),
                            };
                            setNewLines(updated);
                          }}
                          className="w-28 border border-outline-variant rounded-lg px-2 py-1 bg-white text-right focus:ring-1 focus:ring-primary outline-none font-mono"
                        />
                      </td>
                      <td className="px-md py-md text-right font-mono font-bold">
                        ₹{(line.qty_ordered * line.unit_price).toFixed(2)}
                      </td>
                      <td className="px-md py-md text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setNewLines(newLines.filter((_, i) => i !== idx));
                          }}
                          className="text-error hover:bg-error-container/20 p-1.5 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {newLines.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-on-surface-variant font-bold">
                        No product lines added yet. Click "Add Product" to start.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="w-full md:w-[320px] flex flex-col gap-lg flex-shrink-0">
            <div className="bg-white border border-outline-variant rounded-xl p-md shadow-sm sticky top-[80px]">
              <h3 className="font-label-md text-on-surface-variant uppercase mb-md font-bold">Order Summary</h3>
              <div className="flex justify-between items-center py-md border-b border-outline-variant mb-4">
                <span className="font-headline-sm text-on-surface">Total</span>
                <span className="font-headline-sm text-primary font-bold">₹{calculatedTotal.toFixed(2)}</span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-white py-2.5 rounded-lg font-label-md hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">save</span> Save Purchase Order
              </button>
            </div>
          </aside>
        </form>
      </div>
    );
  }

  if (!po) return <div className="p-8 text-center text-error font-bold">Purchase Order not found.</div>;

  const totalOrdered = lines.reduce((acc, l) => acc + l.qty_ordered, 0);
  const totalReceived = lines.reduce((acc, l) => acc + l.qty_received, 0);
  const totalRemaining = totalOrdered - totalReceived;

  return (
    <div className="w-full relative bg-surface-base text-on-surface flex flex-col items-center">
      {actionError && (
        <div className="w-full max-w-[1200px] mt-4 px-lg">
          <div className="bg-error-container text-error px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {actionError}
            <button onClick={() => setActionError(null)} className="ml-auto">
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <header className="flex justify-between items-center px-lg py-sm sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant w-full max-w-[1200px]">
        <h1 className="font-headline-sm text-headline-sm font-bold text-primary">Purchase Order {po.name}</h1>
        <div className="flex items-center gap-md">
          {/* Confirm: purchase_manager and admin only */}
          {po.state === 'draft' && canConfirm && (
            <button
              onClick={() => handleAction('action_confirm')}
              className="bg-primary text-on-primary px-md py-xs rounded-lg font-label-md hover:opacity-90 transition-colors shadow-sm"
            >
              Confirm
            </button>
          )}
          {/* Receive: warehouse staff + admin */}
          {(po.state === 'confirmed' || po.state === 'received') && canReceive && (
            <button
              onClick={() => handleAction('action_receive')}
              className="border border-outline text-primary px-md py-xs rounded-lg font-label-md hover:bg-surface-container transition-colors"
            >
              Receive Products
            </button>
          )}
          <button onClick={() => window.print()} className="border border-outline text-primary px-md py-xs rounded-lg font-label-md hover:bg-surface-container transition-colors">
            Print PO
          </button>
        </div>
      </header>

      <div className="p-lg flex flex-col md:flex-row gap-lg w-full max-w-[1200px]">
        <div className="flex-1 flex flex-col gap-lg">
          {/* Status Tracker */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex items-stretch h-12 shadow-sm">
            {['draft', 'confirmed', 'received', 'done'].map((s, i) => (
              <div
                key={s}
                className={`flex-1 flex items-center justify-center font-label-md text-label-md px-md capitalize ${po.state === s ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}
              >
                {s === 'received' ? 'Partially Received' : s === 'done' ? 'Fully Received' : s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
            ))}
          </div>

          {/* Vendor Info */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
            <div className="flex items-center gap-sm mb-md border-b border-outline-variant pb-sm">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Vendor Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-xl">
              <div>
                <label className="font-label-md text-[10px] text-on-surface-variant block mb-xs uppercase tracking-wider">Vendor Name</label>
                <p className="font-body-lg font-bold text-primary">{po.vendor_id[1]}</p>
              </div>
              <div>
                <label className="font-label-md text-[10px] text-on-surface-variant block mb-xs uppercase tracking-wider">Order Date</label>
                <p className="font-body-md">{po.date_order}</p>
              </div>
              <div>
                <label className="font-label-md text-[10px] text-on-surface-variant block mb-xs uppercase tracking-wider">Expected Date</label>
                <p className="font-body-md">{po.date_expected}</p>
              </div>
            </div>
          </div>

          {/* Order Lines */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="p-md bg-surface-container-low border-b border-outline-variant">
              <h3 className="font-label-md text-on-surface-variant uppercase">Order Lines</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-md py-sm font-label-md text-on-surface-variant">Product</th>
                  <th className="px-md py-sm font-label-md text-on-surface-variant text-right">Qty Ordered</th>
                  <th className="px-md py-sm font-label-md text-on-surface-variant text-right">Qty Received</th>
                  <th className="px-md py-sm font-label-md text-on-surface-variant text-right">Unit Price</th>
                  <th className="px-md py-sm font-label-md text-on-surface-variant text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {lines.map(line => (
                  <tr key={line.id} className="hover:bg-primary-container/10 transition-colors">
                    <td className="px-md py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-outline">inventory_2</span>
                        </div>
                        <p className="font-body-md font-bold text-on-surface">{line.product_id[1]}</p>
                      </div>
                    </td>
                    <td className="px-md py-md text-right">{line.qty_ordered.toFixed(2)}</td>
                    <td className="px-md py-md text-right font-bold text-primary">{line.qty_received.toFixed(2)}</td>
                    <td className="px-md py-md text-right">₹{line.unit_price.toFixed(2)}</td>
                    <td className="px-md py-md text-right font-bold">₹{line.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
                {lines.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-4 text-on-surface-variant">No order lines found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Receiving Summary */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
            <h3 className="font-label-md text-on-surface-variant uppercase mb-md">Receiving Summary</h3>
            <div className="grid grid-cols-3 gap-md">
              {[
                { label: 'Expected Total', value: totalOrdered, color: 'text-on-surface' },
                { label: 'Received to Date', value: totalReceived, color: 'text-primary' },
                { label: 'Remaining', value: totalRemaining, color: 'text-error' },
              ].map(({ label, value, color }) => (
                <div key={label} className="p-md rounded-lg bg-surface-container-low border border-outline-variant">
                  <span className="font-label-sm text-on-surface-variant block mb-xs uppercase text-[10px]">{label}</span>
                  <span className={`font-headline-md text-headline-md ${color}`}>{value.toFixed(0)}</span>
                  <span className="font-body-sm text-on-surface-variant ml-1">Units</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full md:w-[320px] flex flex-col gap-lg flex-shrink-0">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm sticky top-[80px]">
            <h3 className="font-label-md text-on-surface-variant uppercase mb-md">Order Summary</h3>
            <div className="flex justify-between items-center py-md">
              <span className="font-headline-sm text-on-surface">Total</span>
              <span className="font-headline-sm text-primary font-bold">₹{po.total_amount.toLocaleString()}</span>
            </div>
            {po.state === 'draft' && canConfirm && (
              <button
                onClick={() => handleAction('action_confirm')}
                className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md hover:opacity-90 transition-all flex items-center justify-center gap-sm mt-sm"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span> Confirm Order
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Toast */}
      <div className={`fixed bottom-lg right-lg bg-inverse-surface text-inverse-on-surface px-lg py-md rounded-xl shadow-2xl flex items-center gap-md transition-transform duration-500 z-[100] ${showToast ? 'translate-y-0' : 'translate-y-[200%]'}`}>
        <span className="material-symbols-outlined text-secondary-fixed">info</span>
        <div>
          <p className="font-label-md">Inventory Updated</p>
          <p className="font-body-sm opacity-90">Products received and added to inventory.</p>
        </div>
        <button onClick={() => setShowToast(false)}>
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
};
