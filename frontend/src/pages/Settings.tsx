import { useState } from 'react';

export const Settings = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'users' | 'warehouse' | 'procurement'>('general');

  return (
    <div className="flex flex-col min-h-screen bg-surface-base text-on-surface">
      {/* Setting Canvas */}
      <div className="p-lg flex-grow max-w-[1200px] mx-auto w-full">
        <div className="mb-lg">
          <h2 className="font-headline-md text-headline-md text-primary">System Settings</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Configure your SHIV ERP environment and manage access control.</p>
        </div>

        {/* Settings Layout: Vertical Tabs */}
        <div className="flex flex-col md:flex-row gap-lg">
          {/* Vertical Nav */}
          <nav className="w-full md:w-64 shrink-0 flex flex-col gap-base">
            <button 
              className={`setting-tab-btn flex items-center gap-sm px-md py-sm rounded-lg font-label-md text-left transition-colors ${activeTab === 'general' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container'}`} 
              onClick={() => setActiveTab('general')}
            >
              <span className="material-symbols-outlined">tune</span>
              General Settings
            </button>
            <button 
              className={`setting-tab-btn flex items-center gap-sm px-md py-sm rounded-lg font-label-md text-left transition-colors ${activeTab === 'users' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container'}`} 
              onClick={() => setActiveTab('users')}
            >
              <span className="material-symbols-outlined">group</span>
              Users &amp; Roles
            </button>
            <button 
              className={`setting-tab-btn flex items-center gap-sm px-md py-sm rounded-lg font-label-md text-left transition-colors ${activeTab === 'warehouse' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container'}`} 
              onClick={() => setActiveTab('warehouse')}
            >
              <span className="material-symbols-outlined">warehouse</span>
              Warehouse Config
            </button>
            <button 
              className={`setting-tab-btn flex items-center gap-sm px-md py-sm rounded-lg font-label-md text-left transition-colors ${activeTab === 'procurement' ? 'bg-primary-container text-on-primary-container' : 'text-on-surface-variant hover:bg-surface-container'}`} 
              onClick={() => setActiveTab('procurement')}
            >
              <span className="material-symbols-outlined">shopping_cart_checkout</span>
              Procurement Triggers
            </button>
          </nav>

          {/* Content Area */}
          <div className="flex-grow bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm min-h-[600px] p-xl bg-white">
            
            {/* General Settings */}
            {activeTab === 'general' && (
              <div>
                <h3 className="font-headline-sm text-headline-sm mb-md">Global Brand Settings</h3>
                <div className="space-y-xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                    <div>
                      <label className="block font-label-md text-label-md mb-xs">Company Logo</label>
                      <div className="flex items-center gap-md border-2 border-dashed border-outline-variant rounded-lg p-md">
                        <div className="w-16 h-16 bg-surface-container-high rounded flex items-center justify-center">
                          <span className="material-symbols-outlined text-outline">image</span>
                        </div>
                        <div>
                          <button className="font-label-md text-label-md text-primary hover:underline">Upload new logo</button>
                          <p className="text-body-sm text-on-surface-variant">PNG or SVG, max 2MB</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md mb-xs">Primary Color Theme</label>
                      <div className="flex gap-sm">
                        <div className="w-8 h-8 rounded-full bg-[#57344f] ring-2 ring-primary ring-offset-2 cursor-pointer"></div>
                        <div className="w-8 h-8 rounded-full bg-[#00696e] cursor-pointer"></div>
                        <div className="w-8 h-8 rounded-full bg-[#34451e] cursor-pointer"></div>
                        <div className="w-8 h-8 rounded-full bg-[#212529] cursor-pointer"></div>
                        <button className="w-8 h-8 rounded-full border border-outline flex items-center justify-center">
                          <span className="material-symbols-outlined text-body-sm">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-md">
                    <div>
                      <label className="block font-label-md text-label-md mb-xs">Company Name</label>
                      <input className="w-full px-md py-sm border border-outline-variant rounded focus:ring-primary focus:border-primary" type="text" defaultValue="SHIV ERP"/>
                    </div>
                    <div>
                      <label className="block font-label-md text-label-md mb-xs">Official Currency</label>
                      <select className="w-full px-md py-sm border border-outline-variant rounded focus:ring-primary focus:border-primary">
                        <option>INR (₹)</option>
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-lg border-t border-outline-variant flex justify-end gap-md">
                    <button className="px-lg py-sm border border-outline-variant rounded font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors">Cancel</button>
                    <button className="px-lg py-sm bg-primary text-white rounded font-label-md text-label-md hover:bg-primary/90 transition-colors">Save Changes</button>
                  </div>
                </div>
              </div>
            )}

            {/* Users & Roles */}
            {activeTab === 'users' && (
              <div>
                <div className="flex justify-between items-center mb-md">
                  <h3 className="font-headline-sm text-headline-sm">Users &amp; Access Management</h3>
                  <button className="bg-primary text-white px-md py-sm rounded-lg font-label-md text-label-md flex items-center gap-sm hover:bg-primary/90 transition-colors">
                    <span className="material-symbols-outlined">person_add</span>
                    Add User
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-outline-variant">
                        <th className="py-md font-label-md text-label-md text-on-surface-variant">Name</th>
                        <th className="py-md font-label-md text-label-md text-on-surface-variant">Role</th>
                        <th className="py-md font-label-md text-label-md text-on-surface-variant">Last Login</th>
                        <th className="py-md font-label-md text-label-md text-on-surface-variant">Status</th>
                        <th className="py-md"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                        <td className="py-md">
                          <div className="flex items-center gap-sm">
                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">RJ</div>
                            <div>
                              <p className="font-label-md text-label-md">Rajesh Jha</p>
                              <p className="text-body-sm text-on-surface-variant">rajesh@shivfurniture.com</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-md">
                          <span className="px-sm py-xs bg-tertiary-container/30 text-tertiary rounded text-[10px] font-bold uppercase tracking-wider">Admin</span>
                        </td>
                        <td className="py-md text-body-sm">2 mins ago</td>
                        <td className="py-md">
                          <span className="flex items-center gap-xs text-success-forest font-label-md text-label-md">
                            <span className="w-2 h-2 rounded-full bg-success-forest"></span> Active
                          </span>
                        </td>
                        <td className="py-md text-right">
                          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary">more_vert</button>
                        </td>
                      </tr>
                      <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                        <td className="py-md">
                          <div className="flex items-center gap-sm">
                            <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-xs">SM</div>
                            <div>
                              <p className="font-label-md text-label-md">Sunita Mishra</p>
                              <p className="text-body-sm text-on-surface-variant">sunita.m@shivfurniture.com</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-md">
                          <span className="px-sm py-xs bg-secondary-container text-on-secondary-container rounded text-[10px] font-bold uppercase tracking-wider">Sales</span>
                        </td>
                        <td className="py-md text-body-sm">3 hours ago</td>
                        <td className="py-md">
                          <span className="flex items-center gap-xs text-success-forest font-label-md text-label-md">
                            <span className="w-2 h-2 rounded-full bg-success-forest"></span> Active
                          </span>
                        </td>
                        <td className="py-md text-right">
                          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary">more_vert</button>
                        </td>
                      </tr>
                      <tr className="border-b border-outline-variant hover:bg-surface-container-low transition-colors">
                        <td className="py-md">
                          <div className="flex items-center gap-sm">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">AK</div>
                            <div>
                              <p className="font-label-md text-label-md">Amit Kumar</p>
                              <p className="text-body-sm text-on-surface-variant">amit.prod@shivfurniture.com</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-md">
                          <span className="px-sm py-xs bg-tertiary-container/20 text-on-tertiary-container rounded text-[10px] font-bold uppercase tracking-wider">Manufacturing</span>
                        </td>
                        <td className="py-md text-body-sm">1 day ago</td>
                        <td className="py-md">
                          <span className="flex items-center gap-xs text-on-surface-variant font-label-md text-label-md">
                            <span className="w-2 h-2 rounded-full bg-outline"></span> Inactive
                          </span>
                        </td>
                        <td className="py-md text-right">
                          <button className="material-symbols-outlined text-on-surface-variant hover:text-primary">more_vert</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Warehouse Config */}
            {activeTab === 'warehouse' && (
              <div>
                <h3 className="font-headline-sm text-headline-sm mb-md">Warehouse &amp; Storage Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
                  <div className="p-md bg-surface-container rounded-lg border border-outline-variant">
                    <h4 className="font-label-md text-label-md mb-sm text-primary">Main Factory Warehouse</h4>
                    <p className="text-body-sm mb-md">Primary storage for raw timber, upholstery fabrics, and finished furniture items.</p>
                    <div className="flex justify-between items-center text-body-sm">
                      <span>Capacity Utilization: 78%</span>
                      <div className="w-24 h-2 bg-outline-variant rounded-full overflow-hidden">
                        <div className="bg-primary h-full" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </div>
                  <button className="border-2 border-dashed border-outline-variant rounded-lg p-md flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors min-h-[140px]">
                    <span className="material-symbols-outlined text-headline-md mb-xs">add_business</span>
                    <span className="font-label-md text-label-md">Add Storage Location</span>
                  </button>
                </div>
              </div>
            )}

            {/* Procurement Triggers */}
            {activeTab === 'procurement' && (
              <div>
                <h3 className="font-headline-sm text-headline-sm mb-md">Procurement Automation</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-xl">Define rules for automatic purchase order generation and inventory replenishment strategies.</p>
                <div className="space-y-lg">
                  <div className="flex items-center justify-between p-md border border-outline-variant rounded-lg">
                    <div className="flex gap-md items-start">
                      <span className="material-symbols-outlined text-primary mt-xs">auto_fix_high</span>
                      <div>
                        <p className="font-label-md text-label-md">Auto-generate PO on shortage</p>
                        <p className="text-body-sm text-on-surface-variant">Automatically creates a draft Purchase Order when stock falls below safety levels.</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-md border border-outline-variant rounded-lg">
                    <div className="flex gap-md items-start">
                      <span className="material-symbols-outlined text-primary mt-xs">precision_manufacturing</span>
                      <div>
                        <p className="font-label-md text-label-md">MTO (Make-To-Order) Default Strategy</p>
                        <p className="text-body-sm text-on-surface-variant">Trigger production sequence immediately upon sales order confirmation for custom items.</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-md border border-outline-variant rounded-lg">
                    <div className="flex gap-md items-start">
                      <span className="material-symbols-outlined text-primary mt-xs">notifications_active</span>
                      <div>
                        <p className="font-label-md text-label-md">Vendor Lead Time Alerts</p>
                        <p className="text-body-sm text-on-surface-variant">Notify procurement team if vendor acknowledgment is delayed by more than 24 hours.</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider"></span>
                    </label>
                  </div>
                  <div className="bg-surface-container-low p-md rounded-lg mt-md">
                    <label className="block font-label-md text-label-md mb-xs">Default Safety Stock Level (%)</label>
                    <div className="flex items-center gap-md">
                      <input className="flex-grow accent-primary" type="range" defaultValue={15} />
                      <span className="font-label-md text-label-md w-12 text-right">15%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};
