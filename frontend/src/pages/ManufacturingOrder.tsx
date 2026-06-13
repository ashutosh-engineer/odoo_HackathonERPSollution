import { useState, useEffect } from 'react';

export const ManufacturingOrder = () => {
  const [progress, setProgress] = useState(65);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) {
          return prev + 0.1;
        }
        return prev;
      });
    }, 1000); // slightly faster update for demo purposes

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-container-padding w-full flex-1 relative">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <nav className="flex items-center gap-2 text-on-surface-variant font-label-md mb-2">
            <span className="hover:text-primary cursor-pointer">Manufacturing</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-primary font-bold">MO-1045</span>
          </nav>
          <h1 className="font-headline-md text-headline-md text-primary">Manufacturing Order MO-1045</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-success-forest text-white px-6 py-2.5 rounded-lg font-label-md flex items-center gap-2 hover:brightness-110 transition-all shadow-sm active:scale-95">
            <span className="material-symbols-outlined">play_arrow</span> START
          </button>
          <button className="bg-primary text-white px-6 py-2.5 rounded-lg font-label-md flex items-center gap-2 hover:brightness-110 transition-all shadow-sm active:scale-95">
            <span className="material-symbols-outlined">check_circle</span> MARK AS DONE
          </button>
          <button className="border border-outline text-on-surface-variant px-4 py-2.5 rounded-lg font-label-md hover:bg-surface-container transition-all">
            Discard
          </button>
        </div>
      </div>

      {/* Status Tracker (Stepper) */}
      <div className="flex w-full mb-8 rounded-lg overflow-hidden border border-outline-variant h-10 bg-surface-container-lowest">
        <div className="flex-1 flex items-center justify-center bg-tertiary-fixed text-on-tertiary-fixed font-label-md step-chevron-first">
          Draft
        </div>
        <div className="flex-1 flex items-center justify-center bg-tertiary-fixed text-on-tertiary-fixed font-label-md step-chevron">
          Confirmed
        </div>
        <div className="flex-1 flex items-center justify-center bg-primary-container text-white font-bold font-label-md step-chevron relative z-10 shadow-lg">
          In Progress
        </div>
        <div className="flex-1 flex items-center justify-center bg-surface-container text-on-surface-variant font-label-md step-chevron-last">
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
                <div className="w-20 h-20 bg-surface-container rounded-lg flex items-center justify-center overflow-hidden border border-outline-variant">
                  <img alt="Dining Table" className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlSXisz3LH65NuxyeI92123nxfXWdH1xCWQ0rsyCea98MtCc6hZwpajLwSo-IjTWarEaM9WiNdzerNZEUYosEWpDrwl5LBkM546OGM7LOhQocNDkFCvSB4DFnH-i3GQiTUmhlckuORnuY_e8DzijXW2ztv6sjZPRRZ3MTKBursLYwx9oN6hHQGu0cfy59Y2IdASxi3T28vzfgJk95FfVqHt-ulbVs6td8_RIYbl26_J8rqN_2r6hXjwgx28C4TonQMRebN-bd_VbZm"/>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary mb-1">Dining Table (Model DT-24)</h3>
                  <div className="flex gap-4">
                    <div className="bg-surface-container-high px-3 py-1 rounded text-body-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">inventory</span>
                      SKU: FUR-DT-24-W
                    </div>
                    <div className="bg-surface-container-high px-3 py-1 rounded text-body-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] text-on-surface-variant">factory</span>
                      Line: Main Assembly A
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-on-surface-variant font-label-md uppercase mb-1">Target Quantity</p>
                <p className="font-headline-md text-headline-md text-primary">10 Units</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-outline-variant">
              <div>
                <p className="text-on-surface-variant font-label-md mb-1">Deadline</p>
                <p className="font-body-md font-semibold">Oct 24, 2023 - 17:00</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-label-md mb-1">Source Doc</p>
                <p className="font-body-md font-semibold text-info text-blue-600">SO-8921</p>
              </div>
              <div>
                <p className="text-on-surface-variant font-label-md mb-1">Responsible</p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-secondary-container text-[10px] flex items-center justify-center bg-orange-200">AK</div>
                  <p className="font-body-md">Arjun K.</p>
                </div>
              </div>
              <div>
                <p className="text-on-surface-variant font-label-md mb-1">Priority</p>
                <span className="bg-error-container text-error px-2 py-0.5 rounded text-xs font-bold uppercase">High</span>
              </div>
            </div>
          </div>

          {/* Component Reservation Panel */}
          <div className="bg-surface-canvas border border-outline-variant rounded-xl shadow-sm overflow-hidden bg-white">
            <div className="p-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">category</span> Bill of Materials
              </h3>
              <button className="text-primary font-label-md flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-[18px]">add</span> Add Line
              </button>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant text-[12px] uppercase font-bold sticky top-0">
                  <th className="px-6 py-3">Component</th>
                  <th className="px-6 py-3">To Consume</th>
                  <th className="px-6 py-3">Reserved</th>
                  <th className="px-6 py-3">On Hand</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                <tr className="hover:bg-surface-container-lowest transition-colors group cursor-pointer hover:bg-black/5">
                  <td className="px-6 py-4">
                    <div className="font-body-md font-semibold">Oak Wood Planks (2.5m)</div>
                    <div className="text-[11px] text-on-surface-variant">MAT-WOD-01</div>
                  </td>
                  <td className="px-6 py-4 font-mono-md">40.00 m</td>
                  <td className="px-6 py-4 font-mono-md">40.00 m</td>
                  <td className="px-6 py-4 font-mono-md">120.50 m</td>
                  <td className="px-6 py-4 text-right">
                    <span className="material-symbols-outlined text-success-forest" title="Available">check_circle</span>
                  </td>
                </tr>
                <tr className="transition-colors group bg-error/5 hover:bg-error/10 cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="font-body-md font-semibold">Industrial Wood Varnish</div>
                    <div className="text-[11px] text-on-surface-variant">MAT-CHM-09</div>
                  </td>
                  <td className="px-6 py-4 font-mono-md">15.00 L</td>
                  <td className="px-6 py-4 font-mono-md text-error font-bold">5.00 L</td>
                  <td className="px-6 py-4 font-mono-md">5.20 L</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-error">
                      <span className="material-symbols-outlined text-[18px]">warning</span>
                      <span className="text-xs font-bold">SHORTAGE</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-lowest transition-colors group cursor-pointer hover:bg-black/5">
                  <td className="px-6 py-4">
                    <div className="font-body-md font-semibold">M8 Steel Screws (50mm)</div>
                    <div className="text-[11px] text-on-surface-variant">MAT-HRD-22</div>
                  </td>
                  <td className="px-6 py-4 font-mono-md">320.00 Units</td>
                  <td className="px-6 py-4 font-mono-md">320.00 Units</td>
                  <td className="px-6 py-4 font-mono-md">1,400.00 Units</td>
                  <td className="px-6 py-4 text-right">
                    <span className="material-symbols-outlined text-success-forest" title="Available">check_circle</span>
                  </td>
                </tr>
                <tr className="hover:bg-surface-container-lowest transition-colors group cursor-pointer hover:bg-black/5">
                  <td className="px-6 py-4">
                    <div className="font-body-md font-semibold">Leveling Feet - Brushed Nickel</div>
                    <div className="text-[11px] text-on-surface-variant">MAT-HRD-88</div>
                  </td>
                  <td className="px-6 py-4 font-mono-md">40.00 Units</td>
                  <td className="px-6 py-4 font-mono-md">40.00 Units</td>
                  <td className="px-6 py-4 font-mono-md">42.00 Units</td>
                  <td className="px-6 py-4 text-right">
                    <span className="material-symbols-outlined text-warning-amber" title="Low Stock">report</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Operations & Work Centers */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {/* Work Center Status Card */}
          <div className="bg-primary text-white p-6 rounded-xl shadow-lg border border-primary-container relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-primary-fixed opacity-80 font-label-md uppercase tracking-wider">Active Work Center</p>
                  <h3 className="text-headline-sm font-bold">Main Assembly Line A</h3>
                </div>
                <span className="material-symbols-outlined text-4xl opacity-50">precision_manufacturing</span>
              </div>
              <div className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-primary-fixed uppercase font-bold">Current Efficiency</p>
                  <p className="font-headline-sm font-mono-md">94.2%</p>
                </div>
                <div className="h-12 w-[1px] bg-white/20"></div>
                <div>
                  <p className="text-[10px] text-primary-fixed uppercase font-bold">Avg. Temp</p>
                  <p className="font-headline-sm font-mono-md">22°C</p>
                </div>
              </div>
            </div>
            {/* Subtle pattern background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
          </div>

          {/* Work Order Steps */}
          <div className="bg-surface-canvas border border-outline-variant rounded-xl shadow-sm flex flex-col overflow-hidden bg-white">
            <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface">
              <h3 className="font-headline-sm text-headline-sm text-primary">Operations</h3>
              <span className="text-on-surface-variant font-label-md">3 Steps</span>
            </div>
            <div className="flex flex-col">
              {/* Step 1: Done */}
              <div className="p-4 border-b border-outline-variant flex items-start gap-4 bg-surface-container-low/30">
                <div className="w-8 h-8 rounded-full bg-success-forest text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">check</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-bold text-on-surface">Assembly</h4>
                    <span className="text-[11px] font-bold text-success-forest uppercase">Done</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">Completed by R. Sharma at 10:45 AM</p>
                  <div className="mt-2 flex gap-4 text-[11px] font-mono-md text-on-surface-variant">
                    <span>Plan: 120m</span>
                    <span>Actual: 112m</span>
                  </div>
                </div>
              </div>

              {/* Step 2: In Progress */}
              <div className="p-4 border-b border-outline-variant flex items-start gap-4 bg-primary/5 border-l-4 border-l-primary">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 animate-pulse">
                  <span className="material-symbols-outlined text-[20px]">padding</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-bold text-primary">Sanding &amp; Pre-finishing</h4>
                    <span className="text-[11px] font-bold text-primary uppercase">In Progress</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">Operator: M. Khan</p>
                  <div className="mt-3">
                    <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${progress.toFixed(2)}%` }}></div>
                    </div>
                    <p className="text-[10px] text-right mt-1 text-primary font-bold">{progress.toFixed(2)}% - 45m remaining</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="bg-primary text-white text-xs px-3 py-1.5 rounded font-bold uppercase flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">pause</span> Pause
                    </button>
                    <button className="border border-primary text-primary text-xs px-3 py-1.5 rounded font-bold uppercase">Record Qty</button>
                  </div>
                </div>
              </div>

              {/* Step 3: Pending */}
              <div className="p-4 flex items-start gap-4 opacity-60 grayscale-[0.5]">
                <div className="w-8 h-8 rounded-full bg-surface-container-highest text-on-surface-variant flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">format_paint</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h4 className="font-bold text-on-surface">Painting &amp; Varnish</h4>
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase">Waiting</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant">Estimated: 3.5 Hours</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Control Alert */}
          <div className="bg-warning-amber/10 border-2 border-warning-amber/30 p-4 rounded-xl flex gap-4 items-center">
            <div className="bg-warning-amber text-white p-2 rounded-lg">
              <span className="material-symbols-outlined">gavel</span>
            </div>
            <div>
              <h4 className="font-bold text-on-surface text-sm">QC Inspection Required</h4>
              <p className="text-xs text-on-surface-variant">Mandatory check after painting stage.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer Actions (Odoo-style) */}
      <div className="mt-8 pt-6 border-t border-outline-variant flex items-center justify-between sticky bottom-0 bg-surface/90 backdrop-blur-md pb-4 z-10 -mx-container-padding px-container-padding">
        <div className="flex gap-4">
          <button className="flex items-center gap-2 text-primary font-label-md hover:bg-primary/5 px-3 py-2 rounded transition-colors">
            <span className="material-symbols-outlined text-[20px]">print</span> Print MO
          </button>
          <button className="flex items-center gap-2 text-primary font-label-md hover:bg-primary/5 px-3 py-2 rounded transition-colors">
            <span className="material-symbols-outlined text-[20px]">barcode_scanner</span> Print Labels
          </button>
          <button className="flex items-center gap-2 text-primary font-label-md hover:bg-primary/5 px-3 py-2 rounded transition-colors">
            <span className="material-symbols-outlined text-[20px]">history</span> History
          </button>
        </div>
        <div className="text-on-surface-variant text-body-sm italic">
          Last updated 4 minutes ago by System
        </div>
      </div>
      
      {/* FAB for Shop Floor quick actions */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[60] md:hidden">
        <span className="material-symbols-outlined text-3xl">add</span>
      </button>
    </div>
  );
};
