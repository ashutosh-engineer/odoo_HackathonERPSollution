import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { odooSearchRead, odooCall } from '../utils/api';
import { RoleGuard } from '../components/RoleGuard';

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
  const [showToast, setShowToast] = useState(false);
  const [po, setPo] = useState<PurchaseOrderData | null>(null);
  const [lines, setLines] = useState<PurchaseOrderLine[]>([]);
  const [loading, setLoading] = useState(true);

  const [actionError, setActionError] = useState<string | null>(null);

  const fetchPO = async () => {
    try {
      setLoading(true);
      const orders = await odooSearchRead('shiv.purchase.order', [['id', '=', parseInt(id || '1')]], [
        'name', 'vendor_id', 'state', 'date_order', 'date_expected', 'total_amount', 'line_ids'
      ]);
      
      if (orders.length > 0) {
        const order = orders[0] as PurchaseOrderData;
        setPo(order);
        
        if (order.line_ids && order.line_ids.length > 0) {
          const lineData = await odooSearchRead('shiv.purchase.order.line', [['id', 'in', order.line_ids]], [
            'product_id', 'qty_ordered', 'qty_received', 'unit_price', 'subtotal'
          ]);
          setLines(lineData as PurchaseOrderLine[]);
        } else {
          setLines([]);
        }
      }
    } catch (err) {
      console.error("Failed to load PO", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPO();
  }, [id]);

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
      console.error(`Failed to execute ${actionName}`, err);
      setActionError(`Action failed: ${err.message || err}`);
    }
  };

  if (loading) return <div className="p-8 text-center text-on-surface-variant animate-pulse font-bold">Loading Purchase Order...</div>;
  if (!po) return <div className="p-8 text-center text-error font-bold">Purchase Order not found.</div>;

  const totalOrdered = lines.reduce((acc, l) => acc + l.qty_ordered, 0);
  const totalReceived = lines.reduce((acc, l) => acc + l.qty_received, 0);
  const totalRemaining = totalOrdered - totalReceived;

  return (
    <div className="w-full relative overflow-hidden bg-surface-base text-on-surface flex flex-col items-center">
      {actionError && (
        <div className="w-full max-w-[1200px] mt-4 px-lg">
          <div className="bg-error-container text-error px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {actionError}
          </div>
        </div>
      )}
      {/* TOP BAR */}
      <header className="flex justify-between items-center px-lg py-sm sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant w-full max-w-[1200px]">
        <div className="flex items-center gap-md">
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary">Purchase Order {po.name}</h1>
        </div>
        <div className="flex items-center gap-md">
          <RoleGuard allowedRoles={['admin', 'purchase_manager', 'purchase_user']}>
            {po.state === 'draft' && (
              <button 
                onClick={() => handleAction('action_confirm')}
                className="bg-primary text-on-primary px-md py-xs rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm"
              >
                Confirm
              </button>
            )}
            {(po.state === 'confirmed' || po.state === 'received') && (
              <button 
                onClick={() => handleAction('action_receive')}
                className="border border-outline text-primary px-md py-xs rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors"
              >
                Receive Products
              </button>
            )}
          </RoleGuard>
          <button className="border border-outline text-primary px-md py-xs rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors">Print PO</button>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="p-lg flex flex-col md:flex-row gap-lg">
        {/* LEFT COLUMN: Order Details */}
        <div className="flex-1 flex flex-col gap-lg max-w-[1000px]">
          {/* Status Tracker Header */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex items-stretch h-12 shadow-sm">
            <div className={`flex-1 flex items-center justify-center font-label-md text-label-md relative px-md ${po.state === 'draft' ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
              Draft
              {po.state === 'draft' && <div className="absolute right-0 top-0 bottom-0 border-l-[12px] border-l-primary border-y-[24px] border-y-transparent translate-x-full z-10"></div>}
            </div>
            <div className={`flex-1 flex items-center justify-center font-label-md text-label-md relative px-md ${po.state === 'confirmed' ? 'bg-primary text-on-primary pl-xl' : 'text-on-surface-variant'}`}>
              Confirmed
              {po.state === 'confirmed' && <div className="absolute right-0 top-0 bottom-0 border-l-[12px] border-l-primary border-y-[24px] border-y-transparent translate-x-full z-10"></div>}
            </div>
            <div className={`flex-1 flex items-center justify-center font-label-md text-label-md relative px-md ${po.state === 'received' ? 'bg-primary text-on-primary pl-xl' : 'text-on-surface-variant'}`}>
              Partially Received
              {po.state === 'received' && <div className="absolute right-0 top-0 bottom-0 border-l-[12px] border-l-primary border-y-[24px] border-y-transparent translate-x-full z-10"></div>}
            </div>
            <div className={`flex-1 flex items-center justify-center font-label-md text-label-md px-md ${po.state === 'done' ? 'bg-primary text-on-primary pl-xl' : 'text-on-surface-variant'}`}>
              Fully Received
            </div>
          </div>

          {/* Vendor Information Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
            <div className="flex items-center gap-sm mb-md border-b border-outline-variant pb-sm">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface">Vendor Details</h2>
            </div>
            <div className="grid grid-cols-2 gap-xl">
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs uppercase tracking-wider text-[10px]">Vendor Name</label>
                <p className="font-body-lg text-body-lg font-bold text-primary">{po.vendor_id[1]}</p>
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs uppercase tracking-wider text-[10px]">Order Date</label>
                <p className="font-body-md text-body-md">{po.date_order}</p>
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs uppercase tracking-wider text-[10px]">Expected Date</label>
                <p className="font-body-md text-body-md">{po.date_expected}</p>
              </div>
            </div>
          </div>

          {/* Order Lines Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="p-md bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase">Order Lines</h3>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant">Product</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant text-right">Qty Ordered</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant text-right">Qty Received</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant text-right">Unit Price</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {lines.map(line => (
                  <tr key={line.id} className="hover:bg-primary-container/10 transition-colors group">
                    <td className="px-md py-md">
                      <div className="flex items-center gap-sm">
                        <div className="w-10 h-10 rounded-lg bg-surface-container overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-outline">inventory_2</span>
                        </div>
                        <div>
                          <p className="font-body-md text-body-md font-bold text-on-surface">{line.product_id[1]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-md py-md text-right font-body-md text-body-md">{line.qty_ordered.toFixed(2)}</td>
                    <td className="px-md py-md text-right font-body-md text-body-md font-bold text-primary">{line.qty_received.toFixed(2)}</td>
                    <td className="px-md py-md text-right font-body-md text-body-md">₹{line.unit_price.toFixed(2)}</td>
                    <td className="px-md py-md text-right font-body-md text-body-md font-bold">₹{line.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
                {lines.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-on-surface-variant font-medium">No order lines found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Receiving Summary */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase mb-md">Receiving Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              <div className="p-md rounded-lg bg-surface-container-low border border-outline-variant">
                <span className="font-label-sm text-label-sm text-on-surface-variant block mb-xs">EXPECTED TOTAL</span>
                <div className="flex items-end gap-sm">
                  <span className="font-headline-md text-headline-md text-on-surface">{totalOrdered.toFixed(0)}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mb-1">Units</span>
                </div>
              </div>
              <div className="p-md rounded-lg bg-surface-container-low border border-outline-variant">
                <span className="font-label-sm text-label-sm text-on-surface-variant block mb-xs">RECEIVED TO DATE</span>
                <div className="flex items-end gap-sm">
                  <span className="font-headline-md text-headline-md text-primary">{totalReceived.toFixed(0)}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mb-1">Units</span>
                </div>
              </div>
              <div className="p-md rounded-lg bg-surface-container-low border border-outline-variant">
                <span className="font-label-sm text-label-sm text-on-surface-variant block mb-xs">REMAINING</span>
                <div className="flex items-end gap-sm">
                  <span className="font-headline-md text-headline-md text-error">{totalRemaining.toFixed(0)}</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mb-1">Units</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR: Summary */}
        <aside className="w-full md:w-[320px] flex flex-col gap-lg flex-shrink-0">
          {/* Total Summary Card */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm sticky top-[80px]">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase mb-md">Order Summary</h3>
            <div className="flex justify-between items-center py-md">
              <span className="font-headline-sm text-headline-sm text-on-surface">Total</span>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">₹{po.total_amount.toLocaleString()}</span>
            </div>
            {po.state === 'draft' && (
              <button 
                onClick={() => handleAction('action_confirm')}
                className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md text-label-md hover:bg-primary-container transition-all flex items-center justify-center gap-sm mt-sm"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span> Confirm Order
              </button>
            )}
          </div>
        </aside>
      </div>

      {/* Floating Micro-interaction for Receipt Status */}
      <div 
        className={`fixed bottom-lg right-lg bg-inverse-surface text-inverse-on-surface px-lg py-md rounded-xl shadow-2xl flex items-center gap-md transition-transform duration-500 ease-out z-[100] ${showToast ? 'translate-y-0' : 'translate-y-[200%]'}`} 
        id="receipt-toast"
      >
        <span className="material-symbols-outlined text-secondary-fixed">info</span>
        <div>
          <p className="font-label-md text-label-md">Inventory Updated</p>
          <p className="font-body-sm text-body-sm opacity-90">Products have been successfully received and added to inventory.</p>
        </div>
        <button onClick={() => setShowToast(false)}>
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
};
