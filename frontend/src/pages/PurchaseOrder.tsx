import { useState, useEffect } from 'react';

export const PurchaseOrder = () => {
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // Micro-interaction for notification
    const timer = setTimeout(() => {
      setShowToast(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full relative overflow-hidden bg-surface-base text-on-surface">
      {/* TOP BAR */}
      <header className="flex justify-between items-center px-lg py-sm sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant w-full">
        <div className="flex items-center gap-md">
          <h1 className="font-headline-sm text-headline-sm font-bold text-primary">Purchase Order PO-2023-0089</h1>
        </div>
        <div className="flex items-center gap-md">
          <button className="bg-primary text-on-primary px-md py-xs rounded-lg font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm">Confirm</button>
          <button className="border border-outline text-primary px-md py-xs rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors">Receive Products</button>
          <button className="border border-outline text-primary px-md py-xs rounded-lg font-label-md text-label-md hover:bg-surface-container transition-colors">Print PO</button>
          <div className="h-6 w-px bg-outline-variant mx-sm"></div>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">notifications</span>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">help</span>
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary">account_circle</span>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="p-lg flex flex-col md:flex-row gap-lg">
        {/* LEFT COLUMN: Order Details */}
        <div className="flex-1 flex flex-col gap-lg max-w-[1000px]">
          {/* Status Tracker Header */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden flex items-stretch h-12 shadow-sm">
            <div className="flex-1 flex items-center justify-center bg-surface-container text-on-surface-variant font-label-md text-label-md relative px-md">
              Draft
            </div>
            <div className="flex-1 flex items-center justify-center bg-primary text-on-primary font-label-md text-label-md relative px-md">
              Confirmed
              <div className="absolute right-0 top-0 bottom-0 border-l-[12px] border-l-primary border-y-[24px] border-y-transparent translate-x-full z-10"></div>
            </div>
            <div className="flex-1 flex items-center justify-center text-on-surface-variant font-label-md text-label-md pl-xl px-md">
              Partially Received
            </div>
            <div className="flex-1 flex items-center justify-center text-on-surface-variant font-label-md text-label-md px-md">
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
                <p className="font-body-lg text-body-lg font-bold text-primary">Global Timber Supplies</p>
              </div>
              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs uppercase tracking-wider text-[10px]">Contact Person</label>
                <p className="font-body-md text-body-md">Robert Henderson (+1 555-0192)</p>
              </div>
              <div className="col-span-2">
                <label className="font-label-md text-label-md text-on-surface-variant block mb-xs uppercase tracking-wider text-[10px]">Address</label>
                <p className="font-body-md text-body-md">Warehouse 42, North Industrial Zone, Lumberton, OR 97000</p>
              </div>
            </div>
          </div>

          {/* Order Lines Table */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            <div className="p-md bg-surface-container-low border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-label-md text-label-md text-on-surface-variant uppercase">Order Lines</h3>
              <button className="text-primary font-label-md text-label-md flex items-center gap-xs hover:underline">
                <span className="material-symbols-outlined text-[16px]">add</span> Add Line
              </button>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low/50">
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant">Product</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant text-right">Quantity</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant text-right">Unit Price</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant text-right">Taxes</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                <tr className="hover:bg-primary-container/10 transition-colors group cursor-pointer">
                  <td className="px-md py-md">
                    <div className="flex items-center gap-sm">
                      <div className="w-10 h-10 rounded-lg bg-surface-container overflow-hidden flex-shrink-0">
                        <img alt="Wood Planks" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTz6chJi_q2lFI2K1QdjvK_BR1JT27q85qi6aAVt3zzcjWSMW2ytb8DU9Ekmi_33moo-pf5c30GeFWNb9x7KfAjgn6g9buyV0IrUp6m2sy-YuB4gOteg8POvNr80QyCnnTj97i-iRSNvHKDyozw74M8tZLi3yv2rQo749UYc1SqU_oiEqaOMovBbYb0CDzDNyRQtX2dqUJsPpc-mXVQoH6YD-NEfKbhDlXF7YobsjCn1RPQ2yDW0Z3dLuajLjRjjILwL8iodcugWi-"/>
                      </div>
                      <div>
                        <p className="font-body-md text-body-md font-bold text-on-surface">Oak Wood Planks</p>
                        <p className="font-body-sm text-body-sm text-on-surface-variant">Grade A - 2" x 4" x 8'</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-md py-md text-right font-body-md text-body-md">100.00 Units</td>
                  <td className="px-md py-md text-right font-body-md text-body-md">$40.00</td>
                  <td className="px-md py-md text-right font-body-md text-body-md">12.5%</td>
                  <td className="px-md py-md text-right font-body-md text-body-md font-bold text-primary">$4,500.00</td>
                </tr>
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
                  <span className="font-headline-md text-headline-md text-on-surface">100</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mb-1">Units</span>
                </div>
              </div>
              <div className="p-md rounded-lg bg-surface-container-low border border-outline-variant">
                <span className="font-label-sm text-label-sm text-on-surface-variant block mb-xs">RECEIVED TO DATE</span>
                <div className="flex items-end gap-sm">
                  <span className="font-headline-md text-headline-md text-warning-amber">0</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mb-1">Units</span>
                </div>
              </div>
              <div className="p-md rounded-lg bg-surface-container-low border border-outline-variant">
                <span className="font-label-sm text-label-sm text-on-surface-variant block mb-xs">REMAINING</span>
                <div className="flex items-end gap-sm">
                  <span className="font-headline-md text-headline-md text-error">100</span>
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
            <div className="space-y-sm pb-md border-b border-outline-variant">
              <div className="flex justify-between items-center">
                <span className="font-body-md text-body-md text-on-surface-variant">Untaxed Amount</span>
                <span className="font-body-md text-body-md">$4,000.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-body-md text-body-md text-on-surface-variant">Taxes (12.5%)</span>
                <span className="font-body-md text-body-md">$500.00</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-md">
              <span className="font-headline-sm text-headline-sm text-on-surface">Total</span>
              <span className="font-headline-sm text-headline-sm text-primary font-bold">$4,500.00</span>
            </div>
            <button className="w-full bg-primary text-on-primary py-sm rounded-lg font-label-md text-label-md hover:bg-primary-container transition-all flex items-center justify-center gap-sm mt-sm">
              <span className="material-symbols-outlined text-[18px]">verified</span> Confirm Order
            </button>
          </div>

          {/* Linked Documents */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase mb-md">Linked Documents</h3>
            <div className="space-y-xs">
              <div className="flex items-center gap-sm p-sm rounded-lg hover:bg-surface-container transition-colors cursor-pointer group">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">description</span>
                <div className="flex-1 overflow-hidden">
                  <p className="font-label-md text-label-md text-on-surface truncate">RFQ-2023-0102</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Request for Quotation</p>
                </div>
                <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
              </div>
              <div className="flex items-center gap-sm p-sm rounded-lg hover:bg-surface-container transition-colors cursor-pointer group">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">inventory</span>
                <div className="flex-1 overflow-hidden">
                  <p className="font-label-md text-label-md text-on-surface truncate">WH/IN/00542</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Incoming Shipment</p>
                </div>
                <span className="material-symbols-outlined text-[16px] text-outline opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
              </div>
            </div>
          </div>

          {/* Notes/Audit Log */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-md shadow-sm">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase mb-md">Purchase Notes</h3>
            <textarea className="w-full h-32 bg-surface-container-low border border-outline rounded-lg p-sm font-body-sm text-body-sm focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none" placeholder="Add internal notes for this purchase..."></textarea>
            <div className="mt-md flex justify-between items-center text-label-sm text-on-surface-variant">
              <span>Last edited: 2h ago</span>
              <button className="text-primary font-bold hover:underline">Save Note</button>
            </div>
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
          <p className="font-label-md text-label-md">Inventory Alert</p>
          <p className="font-body-sm text-body-sm opacity-90">Expecting delivery from Global Timber in 4 days.</p>
        </div>
        <button onClick={() => setShowToast(false)}>
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
};
