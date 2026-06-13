export const SalesOrder = () => {
  return (
    <div className="p-container-padding w-full">
      {/* Header & Breadcrumbs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-lg gap-4">
        <div>
          <nav className="flex gap-2 text-on-surface-variant font-label-md mb-1">
            <a className="hover:text-primary" href="#">Sales</a>
            <span>/</span>
            <span className="text-on-surface">SO-2024-001</span>
          </nav>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Sales Order SO-2024-001</h1>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-outline text-on-surface-variant font-label-md rounded-lg hover:bg-surface-container-high transition-colors">Cancel</button>
          <button className="px-4 py-2 border border-secondary text-secondary font-label-md rounded-lg hover:bg-secondary-container transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            Deliver
          </button>
          <button className="px-6 py-2 bg-primary text-on-primary font-label-md rounded-lg hover:opacity-90 transition-all shadow-sm active:scale-95">Confirm</button>
        </div>
      </div>

      {/* Refreshed Status Progress Bar */}
      <div className="flex h-10 w-full mb-xl overflow-hidden rounded-lg">
        <div className="flex-1 flex items-center justify-center bg-primary-fixed text-on-primary-fixed-variant font-bold text-label-md status-progress-clip px-4">
          Draft
        </div>
        <div className="flex-1 flex items-center justify-center bg-primary text-on-primary font-bold text-label-md status-progress-clip px-4">
          Confirmed
        </div>
        <div className="flex-1 flex items-center justify-center bg-surface-container-high text-on-surface-variant font-bold text-label-md status-progress-clip px-4">
          Partially Delivered
        </div>
        <div className="flex-1 flex items-center justify-center bg-surface-container-low text-on-surface-variant font-bold text-label-md status-progress-clip px-4">
          Fully Delivered
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-lg">
          {/* Customer Information Card Updated */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">person</span>
              Customer Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
              <div className="space-y-lg">
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">Customer Name</label>
                  <p className="font-body-lg text-body-lg font-bold text-on-surface">Luxury Interior Solutions</p>
                </div>
                <div>
                  <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">Payment Terms</label>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-warning-amber">schedule</span>
                    <span className="font-body-md text-body-md font-medium">Net 30 Days</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1 uppercase tracking-wider">Shipping Address</label>
                <p className="font-body-md text-body-md leading-relaxed text-on-surface font-medium">
                  742 Woodwork Avenue, Craft District<br/>
                  Suite 101, New Delhi, 110001<br/>
                  India
                </p>
              </div>
            </div>
          </section>

          {/* Order Lines Table Updated */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden shadow-sm">
            <div className="px-lg py-md border-b border-outline-variant flex justify-between items-center bg-surface-container-lowest">
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Order Lines</h3>
              <button className="text-primary font-bold text-label-md flex items-center gap-1 hover:underline">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Add a line
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left zebra-table">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant">
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Product</th>
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Qty</th>
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">Stock Status</th>
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right">Unit Price</th>
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right">Tax</th>
                    <th className="px-lg py-md font-label-md text-label-md text-on-surface-variant uppercase tracking-widest text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  <tr className="transition-colors duration-150 hover:bg-black/5">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-surface-container flex-shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-secondary">chair_alt</span>
                        </div>
                        <div>
                          <p className="font-body-md font-bold text-on-surface">Teak Wood Armchair</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">Model: TK-204-A</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-lg py-md font-mono-md">10</td>
                    <td className="px-lg py-md">
                      {/* Semantic Stock Chip OK */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-success-forest bg-[#e7f6e7] font-bold text-label-sm border border-success-forest/10">
                        <span className="material-symbols-outlined text-[14px] mr-1">check_circle</span>
                        STOCK: OK
                      </span>
                    </td>
                    <td className="px-lg py-md text-right font-mono-md">$85.00</td>
                    <td className="px-lg py-md text-right font-mono-md">15%</td>
                    <td className="px-lg py-md text-right font-mono-md font-bold">$850.00</td>
                  </tr>
                  <tr className="transition-colors duration-150 hover:bg-black/5">
                    <td className="px-lg py-md">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-surface-container flex-shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-secondary">table_restaurant</span>
                        </div>
                        <div>
                          <p className="font-body-md font-bold text-on-surface">Minimalist Office Desk</p>
                          <p className="font-body-sm text-body-sm text-on-surface-variant">Model: OD-MOD-01</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-lg py-md font-mono-md">5</td>
                    <td className="px-lg py-md">
                      <div className="flex flex-col gap-1">
                        {/* Semantic Stock Chip Shortage */}
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-error bg-error-container font-bold text-label-sm border border-error/10">
                          <span className="material-symbols-outlined text-[14px] mr-1">warning</span>
                          SHORTAGE: 5
                        </span>
                        <a className="text-[10px] text-primary flex items-center gap-0.5 hover:underline font-bold" href="#">
                          <span className="material-symbols-outlined text-[12px]">factory</span>
                          MTO Triggered
                        </a>
                      </div>
                    </td>
                    <td className="px-lg py-md text-right font-mono-md">$80.00</td>
                    <td className="px-lg py-md text-right font-mono-md">0%</td>
                    <td className="px-lg py-md text-right font-mono-md font-bold">$400.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-lg">
          {/* Order Summary Updated */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mb-lg">Order Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between font-body-md">
                <span className="text-on-surface-variant">Subtotal</span>
                <span className="font-mono-md text-on-surface">$1,250.00</span>
              </div>
              <div className="flex justify-between font-body-md">
                <span className="text-on-surface-variant">Tax (Calculated)</span>
                <span className="font-mono-md text-on-surface">$127.50</span>
              </div>
              <div className="pt-lg border-t border-outline-variant flex justify-between items-center">
                <span className="font-headline-sm text-headline-sm text-on-surface">Total</span>
                <span className="font-headline-sm text-headline-sm text-primary">$1,377.50</span>
              </div>
            </div>
            <button className="w-full mt-lg bg-secondary text-on-secondary py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 shadow-sm transition-all active:scale-95">
              <span className="material-symbols-outlined">description</span>
              Generate Invoice
            </button>
          </section>

          {/* Linked Operations Updated */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-lg p-lg shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <h3 className="font-label-md text-label-md text-primary uppercase tracking-widest mb-lg font-bold">Production Linked</h3>
            <div className="space-y-md">
              <div className="group p-md bg-surface-container-low rounded-lg border border-transparent hover:border-primary/20 transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-body-md font-bold text-on-surface">MO-9982</span>
                  <span className="text-[10px] bg-primary text-on-primary px-2 py-0.5 rounded-full font-bold">In Production</span>
                </div>
                <p className="text-body-sm text-on-surface-variant mb-3">5x Minimalist Office Desk</p>
                <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[45%] rounded-full transition-all duration-1000"></div>
                </div>
                <div className="mt-2 flex justify-between items-center text-label-sm text-on-surface-variant">
                  <span className="uppercase tracking-tighter opacity-70">Est. Completion</span>
                  <span className="font-mono-md font-bold">Oct 24, 2024</span>
                </div>
              </div>
            </div>
          </section>

          {/* Workshop Image */}
          <div className="rounded-lg overflow-hidden h-48 relative border border-outline-variant group shadow-sm">
            <img alt="Furniture workshop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtNfVywVoR0x2JqNwsB-pYTUmCM9cpqazVBxfFqUTFMi9xtGHDS6whRCUoDsgEelTy5yssi570BucK2J-AKcMOCts16vuchXYL7NNzOHYkLCB5fFz4fDhvFaQEjaVGTeJNcDQ7NsDALHhGIKPGH2jiwx1dWwrnb4NeqdP9EKb3q-nVMApfF1EggxCdlxGU-lEYM6hHuWILO3fR0lQur3yIzBlh_7S31OCUHu-eDKTDBgWbEOzbzcW37L-nXPWAujP5IyjaA8xduvf0"/>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-lg">
              <p className="text-white font-bold text-label-md">Shiv Furniture Workshop: Delhi Cluster A</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
