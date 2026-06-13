import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { odooSearchRead, odooCall } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface SalesOrderData {
  id: number;
  name: string;
  customer_id: [number, string];
  state: string;
  date_order: string;
  delivery_date: string;
  total_amount: number;
  is_fully_reserved: boolean;
  create_uid: [number, string] | false;
}

interface SalesOrderLineData {
  id: number;
  product_id: [number, string];
  qty_ordered: number;
  unit_price: number;
  discount_pct: number;
  subtotal: number;
  is_reserved: boolean;
}

export const SalesOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<SalesOrderData | null>(null);
  const [lines, setLines] = useState<SalesOrderLineData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const orderId = parseInt(id || '0', 10);
  const role = user?.shiv_role || '';

  // Role capabilities
  const isSalesUser = role === 'sales_user';
  const isSalesManager = role === 'sales_manager';
  const isAdmin = role === 'admin';
  const canDiscount = isSalesManager || isAdmin;
  const canConfirm = ['admin', 'sales_manager', 'sales_user'].includes(role);
  const canCancel = ['admin', 'sales_manager', 'sales_user'].includes(role);
  const canDeliver = ['admin', 'sales_manager', 'warehouse_manager', 'warehouse_user'].includes(role);

  // sales_user can only act on their own orders
  const isOwner = !order?.create_uid || order.create_uid[0] === user?.uid;
  const effectiveCanCancel = canCancel && (isSalesManager || isAdmin || isOwner);

  useEffect(() => {
    if (!orderId) {
      setError('Invalid Order ID');
      setLoading(false);
      return;
    }
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orders = await odooSearchRead(
          'shiv.sale.order',
          [['id', '=', orderId]],
          ['name', 'customer_id', 'state', 'date_order', 'delivery_date', 'total_amount', 'is_fully_reserved', 'create_uid']
        );
        if (orders.length === 0) { setError('Order not found'); return; }
        setOrder(orders[0] as SalesOrderData);

        const linesData = await odooSearchRead(
          'shiv.sale.order.line',
          [['order_id', '=', orderId]],
          ['product_id', 'qty_ordered', 'unit_price', 'discount_pct', 'subtotal', 'is_reserved']
        );
        setLines(linesData as SalesOrderLineData[]);
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const handleAction = async (actionMethod: string) => {
    try {
      setActionError(null);
      setLoading(true);
      await odooCall('shiv.sale.order', actionMethod, [orderId]);
      window.location.reload();
    } catch (err: any) {
      setActionError(`Action failed: ${err.message}`);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-on-surface-variant animate-pulse font-bold">Loading Order Details...</div>;
  if (error) return <div className="p-8 text-center text-error font-bold">{error}</div>;
  if (!order) return null;

  return (
    <div className="p-container-padding w-full">
      {actionError && (
        <div className="bg-error-container text-error px-4 py-3 rounded-lg text-sm font-bold mb-4 flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {actionError}
        </div>
      )}

      {/* Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg gap-4">
        <div>
          <nav className="flex gap-2 text-on-surface-variant font-label-md mb-1">
            <button onClick={() => navigate('/sales')} className="hover:text-primary">Sales</button>
            <span>/</span>
            <span className="text-on-surface">{order.name}</span>
          </nav>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Sales Order {order.name}</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Confirm button — sales_user and sales_manager */}
          {order.state === 'draft' && canConfirm && (
            <button
              onClick={() => handleAction('action_confirm')}
              className="px-6 py-2 bg-primary text-on-primary font-label-md rounded-lg hover:opacity-90 transition-all shadow-sm active:scale-95"
            >
              Confirm
            </button>
          )}
          {/* Cancel button — own orders for sales_user, all for manager/admin */}
          {order.state === 'draft' && effectiveCanCancel && (
            <button
              onClick={() => handleAction('action_cancel')}
              className="px-4 py-2 border border-outline text-on-surface-variant font-label-md rounded-lg hover:bg-surface-container-high transition-colors"
            >
              Cancel
            </button>
          )}
          {/* Deliver button */}
          {(order.state === 'confirmed' || order.state === 'picking') && canDeliver && (
            <button
              onClick={() => handleAction('action_deliver')}
              className="px-4 py-2 border border-secondary text-secondary font-label-md rounded-lg hover:bg-secondary-container transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">local_shipping</span>
              Deliver
            </button>
          )}
        </div>
      </div>

      {/* Status Progress Bar */}
      <div className="flex h-10 w-full mb-xl overflow-hidden rounded-lg">
        {['draft', 'confirmed', 'picking', 'delivered'].map((s) => (
          <div
            key={s}
            className={`flex-1 flex items-center justify-center font-bold text-label-md px-4 capitalize ${order.state === s ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface-variant'}`}
          >
            {s}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-lg">
          {/* Customer Information */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span>
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">Customer Name</label>
                <p className="font-body-lg text-body-lg font-bold text-on-surface">{order.customer_id[1]}</p>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">Delivery Date</label>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-warning-amber">schedule</span>
                  <span className="font-body-md font-medium">{order.delivery_date || '—'}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Order Lines Table */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
            <div className="px-lg py-md border-b border-outline-variant">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Order Lines</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left zebra-table">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Product</th>
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-center">Qty</th>
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-center">Reserved</th>
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right">Unit Price</th>
                    {/* Discount only visible to sales_manager and admin */}
                    {canDiscount && (
                      <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right">Discount %</th>
                    )}
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {lines.map((line) => (
                    <tr key={line.id} className="hover:bg-black/5 transition-colors">
                      <td className="px-lg py-md">
                        <p className="font-body-md font-bold text-on-surface">{line.product_id[1]}</p>
                      </td>
                      <td className="px-lg py-md text-center font-mono">{line.qty_ordered}</td>
                      <td className="px-lg py-md text-center">
                        {line.is_reserved ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-success-forest bg-success-forest/10 font-bold text-[11px]">
                            <span className="material-symbols-outlined text-[13px] mr-1">check_circle</span>YES
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-error bg-error-container font-bold text-[11px]">
                            <span className="material-symbols-outlined text-[13px] mr-1">warning</span>NO
                          </span>
                        )}
                      </td>
                      <td className="px-lg py-md text-right font-mono">₹{line.unit_price.toFixed(2)}</td>
                      {canDiscount && (
                        <td className="px-lg py-md text-right font-mono text-on-surface-variant">
                          {line.discount_pct > 0 ? `${line.discount_pct}%` : '—'}
                        </td>
                      )}
                      <td className="px-lg py-md text-right font-mono font-bold">₹{line.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                  {lines.length === 0 && (
                    <tr><td colSpan={canDiscount ? 6 : 5} className="text-center py-8 text-on-surface-variant font-bold">No order lines found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-lg">
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Order Summary</h3>
            <div className="pt-lg border-t border-outline-variant flex justify-between items-center">
              <span className="font-headline-sm text-on-surface">Total Amount</span>
              <span className="font-headline-sm text-primary">₹{order.total_amount.toFixed(2)}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-body-sm">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">inventory</span>
              <span className="text-on-surface-variant">Stock: </span>
              <span className={`font-bold ${order.is_fully_reserved ? 'text-success-forest' : 'text-warning-amber'}`}>
                {order.is_fully_reserved ? 'Fully Reserved' : 'Not Fully Reserved'}
              </span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
