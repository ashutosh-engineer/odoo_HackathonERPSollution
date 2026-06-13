import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { odooSearchRead } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

interface ManufacturingOrderData {
  id: number;
  name: string;
  product_id: [number, string] | false;
  state: string;
  qty_to_produce: number;
  qty_produced: number;
  scheduled_date: string;
  work_center_id: [number, string] | false;
}

const STATE_BADGE: Record<string, string> = {
  draft: 'bg-surface-variant text-on-surface-variant',
  confirmed: 'bg-info-container text-info',
  in_progress: 'bg-success-forest/10 text-success-forest',
  on_hold: 'bg-error text-white',
  done: 'bg-surface-variant text-on-surface-variant',
  cancelled: 'bg-error-container text-error',
};

export const ManufacturingList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<ManufacturingOrderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const role = user?.shiv_role || '';
  // Only production_manager (and admin) can create MOs
  const canCreate = ['admin', 'production_manager'].includes(role);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await odooSearchRead(
          'shiv.manufacturing.order',
          [],
          ['name', 'product_id', 'state', 'qty_to_produce', 'qty_produced', 'scheduled_date', 'work_center_id'],
          { limit: 50, order: 'id desc' }
        );
        setOrders(data as ManufacturingOrderData[]);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch manufacturing orders');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  return (
    <div className="p-container-padding w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Manufacturing Orders</h1>
        {canCreate && (
          <button
            onClick={() => navigate('/manufacturing/new')}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition-all flex items-center gap-2 font-label-md shadow-sm active:scale-95"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New MO
          </button>
        )}
      </div>

      {error && <div className="text-error bg-error-container p-4 rounded-lg mb-4 font-bold">{error}</div>}

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left zebra-table">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-md uppercase tracking-wider text-[11px]">
                <th className="px-6 py-4">MO #</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Work Center</th>
                <th className="px-6 py-4">Scheduled Date</th>
                <th className="px-6 py-4 text-right">Qty to Produce</th>
                <th className="px-6 py-4 text-right">Qty Produced</th>
                <th className="px-6 py-4 text-right">Progress %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-on-surface-variant font-bold animate-pulse">Loading orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-on-surface-variant font-bold">No manufacturing orders found.</td></tr>
              ) : (
                orders.map(order => {
                  const progress = order.qty_to_produce > 0
                    ? Math.round((order.qty_produced / order.qty_to_produce) * 100)
                    : 0;
                  const isOnHold = order.state === 'on_hold';
                  return (
                    <tr
                      key={order.id}
                      className={`cursor-pointer transition-colors ${isOnHold ? 'bg-error/5 hover:bg-error/10' : 'hover:bg-black/5'}`}
                      onClick={() => navigate(`/manufacturing/${order.id}`)}
                    >
                      <td className="px-6 py-4 font-bold text-primary">{order.name}</td>
                      <td className="px-6 py-4">{order.product_id ? order.product_id[1] : 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${STATE_BADGE[order.state] ?? 'bg-surface-variant text-on-surface-variant'} ${order.state === 'in_progress' ? 'animate-pulse' : ''}`}>
                          {order.state.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-body-sm">{order.work_center_id ? order.work_center_id[1] : '—'}</td>
                      <td className="px-6 py-4 text-body-sm">{order.scheduled_date || '—'}</td>
                      <td className="px-6 py-4 text-right font-mono">{order.qty_to_produce}</td>
                      <td className="px-6 py-4 text-right font-mono">{order.qty_produced}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="font-bold text-[12px] text-on-surface w-8 text-right">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
