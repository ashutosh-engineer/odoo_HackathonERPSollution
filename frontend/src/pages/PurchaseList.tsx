import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { odooSearchRead } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface PurchaseOrderData {
  id: number;
  name: string;
  vendor_id: [number, string] | false;
  state: string;
  total_amount: number;
  date_order: string;
  date_expected: string;
  is_auto_generated: boolean;
  create_uid: [number, string] | false;
}

const STATE_BADGE: Record<string, string> = {
  draft: 'bg-surface-variant text-on-surface-variant',
  confirmed: 'bg-info-container text-info',
  received: 'bg-primary-container text-on-primary-container',
  done: 'bg-success-forest text-white',
  cancelled: 'bg-error-container text-error',
};

export const PurchaseList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = user?.shiv_role || '';
  const isPurchaseUser = role === 'purchase_user';
  const canCreate = ['admin', 'purchase_manager', 'purchase_user'].includes(role);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // purchase_user only sees their own POs
        const domain: any[] = isPurchaseUser && user?.uid
          ? [['create_uid', '=', user.uid]]
          : [];

        const data = await odooSearchRead(
          'shiv.purchase.order',
          domain,
          ['name', 'vendor_id', 'state', 'total_amount', 'date_order', 'date_expected', 'is_auto_generated', 'create_uid'],
          { limit: 50, order: 'id desc' }
        );
        setOrders(data as PurchaseOrderData[]);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch purchase orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user?.uid, isPurchaseUser]);

  return (
    <div className="p-container-padding w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Purchase Orders</h1>
          {isPurchaseUser && <p className="text-body-sm text-on-surface-variant mt-1">Showing your orders only</p>}
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/purchase/new')}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 font-label-md shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New PO
          </button>
        )}
      </div>

      {error && <div className="text-error bg-error-container p-4 rounded-lg mb-4 font-bold">{error}</div>}

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left zebra-table">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-md uppercase tracking-wider text-[11px]">
                <th className="px-6 py-4">PO #</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Order Date</th>
                <th className="px-6 py-4">Expected Delivery</th>
                <th className="px-6 py-4 text-right">Total Amount</th>
                <th className="px-6 py-4 text-center">Auto-Gen?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-on-surface-variant font-bold animate-pulse">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-on-surface-variant font-bold">No purchase orders found.</td></tr>
              ) : (
                orders.map(order => (
                  <tr
                    key={order.id}
                    className="hover:bg-black/5 cursor-pointer transition-colors"
                    onClick={() => navigate(`/purchase/${order.id}`)}
                  >
                    <td className="px-6 py-4 font-bold text-primary">{order.name}</td>
                    <td className="px-6 py-4">{order.vendor_id ? order.vendor_id[1] : 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${STATE_BADGE[order.state] ?? 'bg-surface-variant text-on-surface-variant'}`}>
                        {order.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm">{order.date_order}</td>
                    <td className="px-6 py-4 text-body-sm">{order.date_expected || '—'}</td>
                    <td className="px-6 py-4 text-right font-bold">₹{(order.total_amount ?? 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      {order.is_auto_generated ? (
                        <span className="inline-flex items-center gap-1 text-primary text-[11px] font-bold bg-primary/10 px-2 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-[14px]">smart_toy</span> AUTO
                        </span>
                      ) : (
                        <span className="text-on-surface-variant text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
