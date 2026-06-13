import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { odooSearchRead, odooCall } from '../utils/api';
import { RoleGuard } from '../components/RoleGuard';

interface MOData {
  id: number;
  name: string;
  product_id: [number, string];
  qty_to_produce: number;
  qty_produced: number;
  state: string;
  work_center_id: [number, string] | false;
  scheduled_date: string;
  is_auto_generated: boolean;
  trigger_source: string;
}

interface MOComponentData {
  id: number;
  product_id: [number, string];
  qty_required: number;
  qty_consumed: number;
  uom_id: [number, string];
}

export const ManufacturingOrder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<MOData | null>(null);
  const [components, setComponents] = useState<MOComponentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const moId = parseInt(id || '0', 10);

  useEffect(() => {
    if (!moId) {
      setError('Invalid MO ID');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        // Fetch MO
        const orders = await odooSearchRead(
          'shiv.manufacturing.order',
          [['id', '=', moId]],
          ['name', 'product_id', 'qty_to_produce', 'qty_produced', 'state', 'work_center_id', 'scheduled_date', 'is_auto_generated', 'trigger_source']
        );

        if (orders.length === 0) {
          setError('Manufacturing Order not found');
          return;
        }
        setOrder(orders[0] as MOData);

        // Fetch Components
        const compsData = await odooSearchRead(
          'shiv.mo.component.line',
          [['mo_id', '=', moId]],
          ['product_id', 'qty_required', 'qty_consumed', 'uom_id']
        );
        setComponents(compsData as MOComponentData[]);
      } catch (err: any) {
        setError(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [moId]);

  const handleAction = async (actionMethod: string) => {
    try {
      setActionError(null);
      setLoading(true);
      await odooCall('shiv.manufacturing.order', actionMethod, [moId]);
      window.location.reload();
    } catch (err: any) {
      setActionError(`Action failed: ${err.message}`);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-on-surface-variant animate-pulse font-bold">Loading MO Details...</div>;
  if (error) return <div className="p-8 text-center text-error font-bold">{error}</div>;
  if (!order) return null;

  return (
    <div className="p-container-padding w-full flex-1 relative">
      {actionError && (
        <div className="bg-error-container text-error px-4 py-3 rounded-lg text-sm font-bold mb-4 flex items-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {actionError}
        </div>
      )}
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <nav className="flex items-center gap-2 text-on-surface-variant font-label-md mb-2">
            <button onClick={() => navigate('/dashboard')} className="hover:text-primary cursor-pointer">Dashboard</button>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary font-bold">{order.name}</span>
          </nav>
          <h1 className="font-headline-md text-headline-md text-primary">Manufacturing Order {order.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <RoleGuard allowedRoles={['admin', 'production_manager', 'production_user']}>
            {order.state === 'confirmed' && (
              <button onClick={() => handleAction('action_start')} className="bg-success-forest text-white px-6 py-2.5 rounded-lg font-label-md flex items-center gap-2 hover:brightness-110 transition-all shadow-sm active:scale-95">
                <span className="material-symbols-outlined">play_arrow</span> START
              </button>
            )}
            {order.state === 'in_progress' && (
              <button onClick={() => handleAction('action_mark_done')} className="bg-primary text-white px-6 py-2.5 rounded-lg font-label-md flex items-center gap-2 hover:brightness-110 transition-all shadow-sm active:scale-95">
                <span className="material-symbols-outlined">check_circle</span> MARK AS DONE
              </button>
            )}
            {order.state === 'on_hold' && (
              <button onClick={() => handleAction('action_resume_from_hold')} className="bg-warning-amber text-white px-6 py-2.5 rounded-lg font-label-md flex items-center gap-2 hover:brightness-110 transition-all shadow-sm active:scale-95">
                <span className="material-symbols-outlined">play_circle</span> RESUME
              </button>
            )}
          </RoleGuard>
        </div>
      </div>

      {/* Status Tracker (Stepper) */}
      <div className="flex w-full mb-8 rounded-lg overflow-hidden border border-outline-variant h-10 bg-surface-container-lowest">
        <div className={`flex-1 flex items-center justify-center font-label-md step-chevron-first ${order.state === 'draft' ? 'bg-primary text-white font-bold' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>
          Draft
        </div>
        <div className={`flex-1 flex items-center justify-center font-label-md step-chevron ${order.state === 'confirmed' ? 'bg-primary text-white font-bold' : 'bg-tertiary-fixed text-on-tertiary-fixed'}`}>
          Confirmed
        </div>
        <div className={`flex-1 flex items-center justify-center font-label-md step-chevron ${order.state === 'in_progress' ? 'bg-primary text-white font-bold z-10 shadow-lg' : 'bg-surface-container text-on-surface-variant'}`}>
          In Progress
        </div>
        <div className={`flex-1 flex items-center justify-center font-label-md step-chevron-last ${order.state === 'done' ? 'bg-success-forest text-white font-bold' : 'bg-surface-container text-on-surface-variant'}`}>
          Completed
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Main Details Column */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Overview Card */}
          <div className="bg-surface-canvas border border-outline-variant p-6 rounded-xl shadow-sm bg-white">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-1">{order.product_id[1]}</h3>
                  <div className="flex gap-4">
                    <div className="bg-surface-container-high px-3 py-1 rounded text-body-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">factory</span>
                      Work Center: {order.work_center_id ? order.work_center_id[1] : 'Unassigned'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-on-surface-variant font-label-md uppercase mb-1">Target Quantity</p>
                <p className="font-headline-md text-headline-md text-primary">{order.qty_to_produce} Units</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-outline-variant">
              <div>
                <p className="text-on-surface-variant font-label-md mb-1">Scheduled Date</p>
                <p className="font-body-md font-semibold">{order.scheduled_date}</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-label-md mb-1">Source Doc</p>
                <p className="font-body-md font-semibold text-info text-blue-600">{order.trigger_source || 'Manual'}</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-label-md mb-1">Auto-Generated</p>
                <p className="font-body-md">{order.is_auto_generated ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-label-md mb-1">Qty Produced</p>
                <span className="font-bold">{order.qty_produced}</span>
              </div>
            </div>
          </div>

          {/* Component Reservation Panel */}
          <div className="bg-surface-canvas border border-outline-variant rounded-xl shadow-sm overflow-hidden bg-white">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">category</span> Components to Consume
              </h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant text-[12px] uppercase font-bold sticky top-0">
                  <th className="px-6 py-3">Component</th>
                  <th className="px-6 py-3">To Consume</th>
                  <th className="px-6 py-3">Consumed</th>
                  <th className="px-6 py-3">UoM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {components.map((comp) => (
                  <tr key={comp.id} className="hover:bg-surface-container-lowest transition-colors group cursor-pointer hover:bg-black/5">
                    <td className="px-6 py-4">
                      <div className="font-body-md font-semibold">{comp.product_id[1]}</div>
                    </td>
                    <td className="px-6 py-4 font-mono-md">{comp.qty_required.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono-md">{comp.qty_consumed.toFixed(2)}</td>
                    <td className="px-6 py-4 font-mono-md">{comp.uom_id[1]}</td>
                  </tr>
                ))}
                {components.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-on-surface-variant font-bold">No components found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Status Alert */}
          {order.state === 'on_hold' && (
            <div className="bg-warning-amber/10 border-2 border-warning-amber/30 p-4 rounded-xl flex gap-4 items-center">
              <div className="bg-warning-amber text-white p-2 rounded-lg">
                <span className="material-symbols-outlined">warning</span>
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm">Order On Hold</h4>
                <p className="text-xs text-on-surface-variant">A work center anomaly caused this order to pause.</p>
              </div>
            </div>
          )}
          {order.state === 'done' && (
            <div className="bg-success-forest/10 border-2 border-success-forest/30 p-4 rounded-xl flex gap-4 items-center">
              <div className="bg-success-forest text-white p-2 rounded-lg">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <div>
                <h4 className="font-bold text-on-surface text-sm">Completed</h4>
                <p className="text-xs text-on-surface-variant">Inventory has been updated.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};;
