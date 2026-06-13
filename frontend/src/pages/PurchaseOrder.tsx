import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  const { user } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [po, setPo] = useState<PurchaseOrderData | null>(null);
  const [lines, setLines] = useState<PurchaseOrderLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);

  const role = user?.shiv_role || '';
  // Only purchase_manager (and admin) can confirm
  const canConfirm = ['admin', 'purchase_manager'].includes(role);
  // warehouse staff + admin can receive
  const canReceive = ['admin', 'purchase_manager', 'warehouse_manager', 'warehouse_user'].includes(role);

  const fetchPO = async () => {
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

  useEffect(() => { fetchPO(); }, [id]);

  const handleAction = async (actionName: string) => {
    if (!po) return;
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

  if (loading) return <div className="p-8 text-center text-on-surface-variant animate-pulse font-bold">Loading Purchase Order...</div>;
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
          <button className="border border-outline text-primary px-md py-xs rounded-lg font-label-md hover:bg-surface-container transition-colors">
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
