import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { odooSearchRead, odooCall, apiFetch } from '../utils/api';
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
  const [actionError, setActionError] = useState<string | null>(null);

  const [isAnomalyModalOpen, setIsAnomalyModalOpen] = useState(false);
  const [anomalyType, setAnomalyType] = useState('machine_breakdown');
  const [anomalyDesc, setAnomalyDesc] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  const isNew = id === 'new';
  const moId = parseInt(id || '0', 10);

  // New MO creation states
  const [productList, setProductList] = useState<{ id: number; name: string }[]>([]);
  const [bomList, setBomList] = useState<{ id: number; product_id: [number, string]; display_name_computed: string }[]>([]);
  const [wcList, setWcList] = useState<{ id: number; name: string }[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [selectedBomId, setSelectedBomId] = useState<number | ''>('');
  const [selectedWcId, setSelectedWcId] = useState<number | ''>('');
  const [qtyToProduce, setQtyToProduce] = useState(1);
  const [scheduledDate, setScheduledDate] = useState('');

  // Fetch data for new MO creation
  useEffect(() => {
    if (isNew) {
      const fetchNewFormData = async () => {
        try {
          setLoading(true);
          const [productsData, bomsData, wcsData] = await Promise.all([
            odooSearchRead('shiv.product', [['state', '=', 'active']], ['name']),
            odooSearchRead('shiv.bom', [['is_active', '=', true]], ['product_id', 'display_name_computed']),
            odooSearchRead('shiv.work.center', [['is_active', '=', true]], ['name'])
          ]);
          setProductList(productsData as any);
          setBomList(bomsData as any);
          setWcList(wcsData as any);
        } catch (err: any) {
          setError(err.message || 'Failed to load form data');
        } finally {
          setLoading(false);
        }
      };
      fetchNewFormData();
    }
  }, [isNew]);

  // Fetch existing MO details
  useEffect(() => {
    if (isNew) return;
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
  }, [moId, isNew]);

  const handleAction = async (actionMethod: string) => {
    if (isNew) return;
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

  const handleProductChange = (productId: number) => {
    setSelectedProductId(productId);
    // Find matching BoM
    const matchingBom = bomList.find(b => b.product_id && b.product_id[0] === productId);
    if (matchingBom) {
      setSelectedBomId(matchingBom.id);
    } else {
      setSelectedBomId('');
    }
  };

  const handleCreateMO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setActionError('Please select a product');
      return;
    }
    if (!selectedBomId) {
      setActionError('Please select a Bill of Materials');
      return;
    }
    if (!scheduledDate) {
      setActionError('Please select a scheduled date');
      return;
    }
    try {
      setActionError(null);
      setLoading(true);

      const formattedDate = scheduledDate.replace('T', ' ') + ':00';

      const createParams: any = {
        product_id: selectedProductId,
        bom_id: selectedBomId,
        qty_to_produce: qtyToProduce,
        scheduled_date: formattedDate,
      };

      if (selectedWcId) {
        createParams.work_center_id = selectedWcId;
      }

      const newMoId = await odooCall('shiv.manufacturing.order', 'create', [createParams]);
      navigate(`/manufacturing/${newMoId}`);
    } catch (err: any) {
      setActionError(`Failed to create Manufacturing Order: ${err.message || err}`);
      setLoading(false);
    }
  };

  const handleReportAnomaly = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNew || !order?.work_center_id) return;
    try {
      setIsReporting(true);
      setActionError(null);
      await apiFetch(`/shiv/floor/work-centers/${order.work_center_id[0]}/report-anomaly`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anomaly_type: anomalyType,
          description: anomalyDesc
        })
      });
      setIsAnomalyModalOpen(false);
      window.location.reload();
    } catch (err: any) {
      setActionError(`Failed to report anomaly: ${err.message || err}`);
    } finally {
      setIsReporting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-on-surface-variant animate-pulse font-bold">Loading MO Details...</div>;
  if (error) return <div className="p-8 text-center text-error font-bold">{error}</div>;

  if (isNew) {
    return (
      <div className="p-container-padding w-full max-w-[800px] mx-auto">
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
              <button onClick={() => navigate('/manufacturing')} className="hover:text-primary cursor-pointer">Manufacturing</button>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              <span className="text-primary font-bold">New MO</span>
            </nav>
            <h1 className="font-headline-md text-headline-md text-primary">Create New Manufacturing Order</h1>
          </div>
        </div>

        <form onSubmit={handleCreateMO} className="bg-white border border-outline-variant rounded-xl p-lg shadow-sm space-y-md">
          <h3 className="font-headline-sm text-headline-sm text-primary mb-md flex items-center gap-2">
            <span className="material-symbols-outlined">precision_manufacturing</span>
            Manufacturing Order Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider">Product to Manufacture *</label>
              <select
                required
                value={selectedProductId}
                onChange={e => handleProductChange(Number(e.target.value))}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">-- Select Product --</option>
                {productList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider">Bill of Materials *</label>
              <select
                required
                value={selectedBomId}
                onChange={e => setSelectedBomId(Number(e.target.value))}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">-- Select BoM --</option>
                {bomList.filter(b => !selectedProductId || (b.product_id && b.product_id[0] === selectedProductId)).map(b => (
                  <option key={b.id} value={b.id}>{b.display_name_computed}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider">Target Quantity *</label>
              <input
                required
                type="number"
                min="0.001"
                step="0.001"
                value={qtyToProduce}
                onChange={e => setQtyToProduce(Math.max(0.001, parseFloat(e.target.value) || 1))}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-primary outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider">Scheduled Date *</label>
              <input
                required
                type="datetime-local"
                value={scheduledDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-label-md text-label-md text-on-surface-variant mb-2 uppercase tracking-wider">Work Center (Optional)</label>
              <select
                value={selectedWcId}
                onChange={e => setSelectedWcId(e.target.value ? Number(e.target.value) : '')}
                className="w-full border border-outline-variant rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">-- Select Work Center --</option>
                {wcList.map(wc => (
                  <option key={wc.id} value={wc.id}>{wc.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-outline-variant">
            <button
              type="button"
              onClick={() => navigate('/manufacturing')}
              className="px-6 py-2.5 border border-outline rounded-lg text-on-surface font-semibold hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">save</span>
              Save Manufacturing Order
            </button>
          </div>
        </form>
      </div>
    );
  }

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
              <>
                <button onClick={() => setIsAnomalyModalOpen(true)} className="bg-error text-white px-6 py-2.5 rounded-lg font-label-md flex items-center gap-2 hover:brightness-110 transition-all shadow-sm active:scale-95">
                  <span className="material-symbols-outlined">report_problem</span> REPORT ANOMALY
                </button>
                <button onClick={() => handleAction('action_mark_done')} className="bg-primary text-white px-6 py-2.5 rounded-lg font-label-md flex items-center gap-2 hover:brightness-110 transition-all shadow-sm active:scale-95">
                  <span className="material-symbols-outlined">check_circle</span> MARK AS DONE
                </button>
              </>
            )}
            {order.state === 'on_hold' && (
              <RoleGuard allowedRoles={['admin', 'production_manager']}>
                <button onClick={() => handleAction('action_resume_from_hold')} className="bg-warning-amber text-white px-6 py-2.5 rounded-lg font-label-md flex items-center gap-2 hover:brightness-110 transition-all shadow-sm active:scale-95">
                  <span className="material-symbols-outlined">play_circle</span> RESUME
                </button>
              </RoleGuard>
            )}
          </RoleGuard>
        </div>
      </div>

      {isAnomalyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.5)]">
          <div className="bg-white p-6 rounded-lg w-full max-w-[450px] shadow-soft border border-outline-variant">
            <h3 className="text-lg font-bold mb-4 text-error flex items-center gap-2 border-b border-outline-variant pb-2">
              <span className="material-symbols-outlined">report_problem</span> Report Anomaly
            </h3>
            <form onSubmit={handleReportAnomaly} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Anomaly Type</label>
                <select value={anomalyType} onChange={e => setAnomalyType(e.target.value)} className="w-full border border-outline-variant rounded p-2 outline-none focus:border-error text-body-md">
                  <option value="machine_breakdown">Machine Breakdown</option>
                  <option value="power_failure">Power Failure</option>
                  <option value="material_shortage">Material Shortage</option>
                  <option value="operator_absent">Operator Absent</option>
                  <option value="quality_issue">Quality Issue</option>
                  <option value="safety_hazard">Safety Hazard</option>
                  <option value="tool_failure">Tool Failure</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Description (Optional)</label>
                <textarea value={anomalyDesc} onChange={e => setAnomalyDesc(e.target.value)} className="w-full border border-outline-variant rounded p-2 outline-none focus:border-error text-body-md h-24" placeholder="Describe the issue..."></textarea>
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-outline-variant">
                <button type="button" onClick={() => setIsAnomalyModalOpen(false)} className="px-4 py-2 border border-outline-variant rounded text-on-surface font-bold hover:bg-surface-variant transition-colors">Cancel</button>
                <button type="submit" disabled={isReporting} className="px-4 py-2 bg-error text-white rounded font-bold hover:opacity-90 disabled:opacity-50 transition-colors">
                  {isReporting ? 'Reporting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
