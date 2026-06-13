import { useState } from 'react';
import { Link } from 'react-router-dom';

export const UserManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const users = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      email: 'rajesh.k@shivfurniture.com',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDfCI-C0n_xZB1H_JTgUWoW8-pl9jg8np1WOkCjIq9Lu0kX-gfnas4Cpg0h51qzQQiSzn3d2t-2zYp9Ff6KQZsISNLEHLLtl45_NLnV32BUExDGyiAP3Fb6ejjmSVO-wT3c1D9tRm9xOis3r8kKxwbMkA9M0DaRjy_H7jJo9Y6d3st4xzJP2Rk5WWGATon9dS_0ud55WH0o_kdQEffUSu93ZkMzHr-J-q5E3BQ9ZQ5SWM-eZ1ykVckBscjTuUDO2E27g7fZ61gfFILD',
      role: 'Admin',
      roleStyle: 'bg-primary-container/10 text-primary border-primary/20',
      status: 'Active',
      inventory: true,
      sales: true,
      manufacturing: true,
      finance: true,
      suspended: false,
    },
    {
      id: 2,
      name: 'Anjali Sharma',
      email: 'anjali.s@shivfurniture.com',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAjhfPtDp0Ekqsb3fK2njWtq2hTjv0I-LPNIKcKHwihplvdGqlkAhUTOvUlDYiqsNEAJAJYu8OMJSV84RI9I3t_OZVG6QJQJSFmZ-fVSUpffK_S_NUfXUWTy9FG4LWaJKhOsURmhDAPPCdWmOCLONoqWSaDZtTGicc27LtvgGvV3_mVDH-zgRh3OGJxt3HH6NX6Ghps-FWE0yvkhOATb-5diQeqhbZ1U-3mK1Wt1CwMv-wVQ9i_-H-myYW1hpzuz1SKDWtDPzYSgD2y',
      role: 'Manager',
      roleStyle: 'bg-secondary-container/20 text-secondary border-secondary/20',
      status: 'Active',
      inventory: true,
      sales: true,
      manufacturing: false,
      finance: false,
      suspended: false,
    },
    {
      id: 3,
      name: 'Vikram Singh',
      email: 'vikram.s@shivfurniture.com',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCaBRM3BqfPpJzsNbY2piEk3zGcT8Fb8wBWBQnWKhQyE8Oc1OUUsgpqyvpbNIkY62RAkogG5INpkPLV0alY6707PRnRmaFm5NzPDifqlgccfbTKc3jFzbXvjAgSK7y4X872PtGAT33U4BXsayaRvyzgAOcTyom6Q6Qxol47qALP1F9LFrXsWhDb4eRpmLCOPwRHml5sSXB6n7pKXzgvVA35pX6XYY4VIzIog6qiYYdfXOiOeTcmKQTaSZmkV5anoLMLtmXinzoxIXIZ',
      role: 'Operator',
      roleStyle: 'bg-outline-variant/30 text-outline border-outline-variant',
      status: 'Suspended',
      inventory: false,
      sales: false,
      manufacturing: false,
      finance: false,
      suspended: true,
    },
    {
      id: 4,
      name: 'Meera Das',
      email: 'meera.d@shivfurniture.com',
      avatar: 'https://www.gstatic.com/labs-code/stitch/stitch-placeholder-300x300.svg',
      role: 'Manager',
      roleStyle: 'bg-secondary-container/20 text-secondary border-secondary/20',
      status: 'Active',
      inventory: false,
      sales: true,
      manufacturing: false,
      finance: true,
      suspended: false,
    },
    {
      id: 5,
      name: 'Amit Patel',
      email: 'amit.p@shivfurniture.com',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBwzmm87tPzuIIb6KEgI4SqlPaWsnGE7FxXwEIpWWyezBycY8o72BILuZdxeXW-srE_5-2lHL_mJ3EGJfgMlq07_smkTNerJTdsqMJiOo3QnQDmbdaxgvhqw9XkD0v5LmtLFyYh493dWfgSK5GsViMvNw4XLp_fQY69xDO3CKX3LKUC9j6JcxLqc8EsEbqZOei8Df1alFX3rPobm8ZEBhUeZz0vEdb4cyewz9rFEOazhOZDcq7oCSG9V1znmdJCvx2qv8fdnbAENEiR',
      role: 'Operator',
      roleStyle: 'bg-outline-variant/30 text-outline border-outline-variant',
      status: 'Active',
      inventory: true,
      sales: false,
      manufacturing: true,
      finance: false,
      suspended: false,
    }
  ];

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-grow flex flex-col min-h-[calc(100vh-64px)] w-full">
      {/* Header Area */}
      <div className="flex justify-between items-center px-lg py-md bg-white border-b border-outline-variant">
        <h2 className="font-headline-sm text-headline-sm font-bold text-primary">User Permissions &amp; Access Control</h2>
        <div className="flex items-center gap-md">
          <div className="relative w-64 md:w-80 group">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
            <input 
              className="w-full pl-[36px] pr-sm py-xs bg-surface-container border border-outline-variant rounded-lg text-body-md font-body-md focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all group-hover:bg-surface-container-high" 
              placeholder="Search users or roles..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="bg-primary text-white px-md py-sm rounded-lg font-label-md text-label-md flex items-center gap-sm hover:opacity-90 active:opacity-80 transition-all">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>person_add</span>
            Add New Admin
          </button>
        </div>
      </div>

      {/* Page Content */}
      <div className="p-lg flex-grow flex flex-col gap-lg bg-surface">
        {/* Breadcrumbs / Secondary Meta */}
        <div className="flex items-center justify-between">
          <nav className="flex items-center gap-xs text-on-surface-variant font-label-md text-label-md">
            <Link className="hover:text-primary" to="/settings">Settings</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface">User Management</span>
          </nav>
          <div className="flex items-center gap-md">
            <div className="flex bg-surface-container border border-outline-variant p-[2px] rounded-lg">
              <button className="px-md py-xs bg-white shadow-sm rounded-sm text-primary font-label-md text-label-md">Active Users</button>
              <button className="px-md py-xs text-on-surface-variant hover:text-on-surface font-label-md text-label-md">Suspended</button>
            </div>
            <button className="flex items-center gap-xs px-sm py-xs border border-outline-variant rounded-lg text-on-surface-variant font-label-md text-label-md hover:bg-surface-container transition-colors bg-white">
              <span className="material-symbols-outlined text-[18px]">filter_list</span>
              Filters
            </button>
          </div>
        </div>

        {/* Main Data Table Container */}
        <div className="bg-white rounded-lg border border-outline-variant overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant">
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider w-[240px]">Name</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider w-[120px]">Role</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider w-[100px]">Status</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">Inventory</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">Sales</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">Manufacturing</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">Finance</th>
                  <th className="px-md py-sm font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-right sticky right-0 bg-surface-container-low shadow-[-4px_0_4px_rgba(0,0,0,0.02)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className={`hover:bg-primary/5 transition-colors group ${user.suspended ? 'bg-surface-container-low/30 opacity-70' : ''}`}>
                    <td className={`px-md py-md ${user.suspended ? 'text-on-surface-variant' : ''}`}>
                      <div className="flex items-center gap-sm">
                        <div className={`w-9 h-9 rounded-full overflow-hidden bg-surface-container border border-outline-variant ${user.suspended ? 'grayscale' : ''}`}>
                          <img alt={user.name} className="w-full h-full object-cover" src={user.avatar}/>
                        </div>
                        <div>
                          <p className={`font-label-md text-label-md ${user.suspended ? '' : 'text-on-surface'}`}>{user.name}</p>
                          <p className={`font-body-sm text-body-sm ${user.suspended ? '' : 'text-on-surface-variant'}`}>{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-md py-md">
                      <span className={`inline-flex items-center px-sm py-[2px] rounded-full text-[11px] font-bold uppercase tracking-tighter border ${user.roleStyle}`}>{user.role}</span>
                    </td>
                    <td className="px-md py-md">
                      <span className={`inline-flex items-center gap-xs px-sm py-[2px] rounded-full text-[11px] font-bold ${user.suspended ? 'bg-danger-brick/10 text-danger-brick' : 'bg-success-forest/10 text-success-forest'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.suspended ? 'bg-danger-brick' : 'bg-success-forest'}`}></span> {user.status}
                      </span>
                    </td>
                    <td className="px-md py-md text-center">
                      <input 
                        className={`rounded-sm w-4 h-4 cursor-pointer focus:ring-primary ${user.suspended ? 'border-outline-variant bg-surface-container-high' : 'border-outline text-primary'}`} 
                        type="checkbox" 
                        defaultChecked={user.inventory} 
                        disabled={user.suspended}
                      />
                    </td>
                    <td className="px-md py-md text-center">
                      <input 
                        className={`rounded-sm w-4 h-4 cursor-pointer focus:ring-primary ${user.suspended ? 'border-outline-variant bg-surface-container-high' : 'border-outline text-primary'}`} 
                        type="checkbox" 
                        defaultChecked={user.sales} 
                        disabled={user.suspended}
                      />
                    </td>
                    <td className="px-md py-md text-center">
                      <input 
                        className={`rounded-sm w-4 h-4 cursor-pointer focus:ring-primary ${user.suspended ? 'border-outline-variant bg-surface-container-high' : 'border-outline text-primary'}`} 
                        type="checkbox" 
                        defaultChecked={user.manufacturing} 
                        disabled={user.suspended}
                      />
                    </td>
                    <td className="px-md py-md text-center">
                      <input 
                        className={`rounded-sm w-4 h-4 cursor-pointer focus:ring-primary ${user.suspended ? 'border-outline-variant bg-surface-container-high' : 'border-outline text-primary'}`} 
                        type="checkbox" 
                        defaultChecked={user.finance} 
                        disabled={user.suspended}
                      />
                    </td>
                    <td className="px-md py-md text-right sticky right-0 bg-white group-hover:bg-transparent shadow-[-4px_0_4px_rgba(0,0,0,0.02)]">
                      {user.suspended ? (
                        <div className="flex items-center justify-end gap-xs">
                          <button className="px-sm py-xs text-primary font-label-md text-label-md hover:underline">Reactivate</button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-xs">
                          <button className="p-xs hover:bg-primary-container/10 text-on-surface-variant hover:text-primary rounded transition-colors" title="Edit">
                            <span className="material-symbols-outlined text-[20px]">edit_square</span>
                          </button>
                          <button className="p-xs hover:bg-warning-amber/10 text-on-surface-variant hover:text-warning-amber rounded transition-colors" title="Reset Password">
                            <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                          </button>
                          <button className="p-xs hover:bg-danger-brick/10 text-on-surface-variant hover:text-danger-brick rounded transition-colors" title="Revoke Access">
                            <span className="material-symbols-outlined text-[20px]">person_off</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-md py-sm bg-surface-container-low border-t border-outline-variant flex items-center justify-between">
            <p className="font-body-sm text-body-sm text-on-surface-variant">Showing 1-{filteredUsers.length} of {users.length} users</p>
            <div className="flex items-center gap-xs">
              <button className="p-xs border border-outline-variant rounded bg-white hover:bg-surface-container transition-colors disabled:opacity-40" disabled>
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <button className="w-8 h-8 rounded bg-primary text-white font-label-md text-label-md">1</button>
              <button className="w-8 h-8 rounded border border-outline-variant bg-white text-on-surface-variant font-label-md text-label-md hover:bg-surface-container">2</button>
              <button className="w-8 h-8 rounded border border-outline-variant bg-white text-on-surface-variant font-label-md text-label-md hover:bg-surface-container">3</button>
              <span className="mx-xs text-on-surface-variant">...</span>
              <button className="w-8 h-8 rounded border border-outline-variant bg-white text-on-surface-variant font-label-md text-label-md hover:bg-surface-container">10</button>
              <button className="p-xs border border-outline-variant rounded bg-white hover:bg-surface-container transition-colors">
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bento Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
          <div className="bg-white p-md rounded-lg border border-outline-variant flex flex-col gap-sm shadow-sm">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-primary bg-primary-fixed p-sm rounded-lg">group</span>
              <span className="text-success-forest font-label-md text-label-md">+4 this month</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface">48</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Total Admin Users</p>
            </div>
          </div>
          <div className="bg-white p-md rounded-lg border border-outline-variant flex flex-col gap-sm shadow-sm">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-secondary bg-secondary-container/30 p-sm rounded-lg">verified_user</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface">3 Role Types</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Admin, Manager, Operator</p>
            </div>
          </div>
          <div className="bg-white p-md rounded-lg border border-outline-variant flex flex-col gap-sm shadow-sm">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-warning-amber bg-warning-amber/10 p-sm rounded-lg">lock_open</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface">92%</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">2FA Adoption Rate</p>
            </div>
          </div>
          <div className="bg-white p-md rounded-lg border border-outline-variant flex flex-col gap-sm shadow-sm">
            <div className="flex items-center justify-between">
              <span className="material-symbols-outlined text-danger-brick bg-danger-brick/10 p-sm rounded-lg">security</span>
            </div>
            <div>
              <h4 className="font-headline-sm text-headline-sm text-on-surface">12 Days</h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Avg Password Rotation</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto px-lg py-md border-t border-outline-variant bg-surface-container-low flex justify-between items-center">
        <div className="flex items-center gap-md">
          <span className="font-label-md text-label-md text-on-surface-variant">© 2026 SHIV ERP</span>
          <span className="w-1 h-1 rounded-full bg-outline"></span>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary" href="#">Privacy Policy</a>
          <a className="font-label-md text-label-md text-on-surface-variant hover:text-primary" href="#">System Health</a>
        </div>
        <div className="flex items-center gap-sm">
          <span className="inline-flex h-2 w-2 rounded-full bg-success-forest animate-pulse"></span>
          <span className="font-body-sm text-body-sm text-on-surface-variant">Server: Mumbai-01 (Stable)</span>
        </div>
      </footer>
    </div>
  );
};
