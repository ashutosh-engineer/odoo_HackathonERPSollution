import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { odooSearchRead } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface SalesOrderData {
  id: number;
  name: string;
  customer_id: [number, string] | false;
  state: string;
  total_amount: number;
  date_order: string;
  delivery_date: string;
  is_fully_reserved: boolean;
  create_uid: [number, string] | false;
}

const STATE_BADGE: Record<string, string> = {
  draft: 'bg-surface-variant text-on-surface-variant',
  confirmed: 'bg-info-container text-info',
  picking: 'bg-warning-amber/10 text-warning-amber',
  delivered: 'bg-success-forest/10 text-success-forest',
  done: 'bg-success-forest text-white',
  cancelled: 'bg-error-container text-error',
};

export const SalesList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<SalesOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('');

  const role = user?.shiv_role || '';
  const isSalesUser = role === 'sales_user';
  const canCreate = ['admin', 'sales_manager', 'sales_user'].includes(role);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // sales_user can only see their own orders
        const domain: any[] = isSalesUser && user?.uid
          ? [['create_uid', '=', user.uid]]
          : [];

        const data = await odooSearchRead(
          'shiv.sale.order',
          domain,
          ['name', 'customer_id', 'state', 'total_amount', 'date_order', 'delivery_date', 'is_fully_reserved', 'create_uid'],
          { limit: 50, order: 'id desc' }
        );
        setOrders(data as SalesOrderData[]);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch sales orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user?.uid, isSalesUser]);

  const filtered = orders.filter(o => {
    const matchStatus = !filterStatus || o.state === filterStatus;
    const matchCustomer = !filterCustomer || (o.customer_id && o.customer_id[1].toLowerCase().includes(filterCustomer.toLowerCase()));
    return matchStatus && matchCustomer;
  });

  return (
    <div className="p-container-padding w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Sales Orders</h1>
          {isSalesUser && <p className="text-body-sm text-on-surface-variant mt-1">Showing your orders only</p>}
        </div>
        {canCreate && (
          <button
            onClick={() => navigate('/sales/new')}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 font-label-md shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Order
          </button>
        )}
      </div>

      {error && <div className="text-error bg-error-container p-4 rounded-lg mb-4 font-bold">{error}</div>}

      {/* Filters */}
      <div className="flex gap-md mb-4 flex-wrap">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-white focus:ring-1 focus:ring-primary outline-none"
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="picking">Picking</option>
          <option value="delivered">Delivered</option>
          <option value="done">Done</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={filterCustomer}
            onChange={e => setFilterCustomer(e.target.value)}
            placeholder="Search customer..."
            className="pl-9 border border-outline-variant rounded-lg px-3 py-2 text-body-md bg-white focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left zebra-table">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-md uppercase tracking-wider text-[11px]">
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Delivery Date</th>
                <th className="px-6 py-4 text-right">Total Amount</th>
                <th className="px-6 py-4 text-center">Reserved?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-on-surface-variant font-bold animate-pulse">Loading orders...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-on-surface-variant font-bold">No sales orders found.</td></tr>
              ) : (
                filtered.map(order => (
                  <tr
                    key={order.id}
                    className="hover:bg-black/5 cursor-pointer transition-colors"
                    onClick={() => navigate(`/sales/${order.id}`)}
                  >
                    <td className="px-6 py-4 font-bold text-primary">{order.name}</td>
                    <td className="px-6 py-4">{order.customer_id ? order.customer_id[1] : 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${STATE_BADGE[order.state] ?? 'bg-surface-variant text-on-surface-variant'}`}>
                        {order.state}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-sm">{order.date_order}</td>
                    <td className="px-6 py-4 text-body-sm">{order.delivery_date || '—'}</td>
                    <td className="px-6 py-4 text-right font-bold">₹{(order.total_amount ?? 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      {order.is_fully_reserved ? (
                        <span className="inline-flex items-center gap-1 text-success-forest text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span> YES
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-on-surface-variant text-[11px] font-bold">
                          <span className="material-symbols-outlined text-[14px]">radio_button_unchecked</span> NO
                        </span>
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
