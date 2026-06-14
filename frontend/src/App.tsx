import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SignIn } from './pages/SignIn';
import { AdminLogin } from './pages/AdminLogin';
import { TermsOfService } from './pages/TermsOfService';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { OperationalDashboard } from './pages/OperationalDashboard';
import { ProductMaster } from './pages/ProductMaster';
import { SalesOrder } from './pages/SalesOrder';
import { ManufacturingOrder } from './pages/ManufacturingOrder';
import { PurchaseOrder } from './pages/PurchaseOrder';
import { SalesList } from './pages/SalesList';
import { PurchaseList } from './pages/PurchaseList';
import { ManufacturingList } from './pages/ManufacturingList';
import { Inventory } from './pages/Inventory';
import { Settings } from './pages/Settings';
import { UserManagement } from './pages/UserManagement';
import { ChangePassword } from './pages/ChangePassword';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FloorConsole } from './pages/FloorConsole';
import { AuditLog } from './pages/AuditLog';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [showNewEntryMenu, setShowNewEntryMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const role = user?.shiv_role || '';

  const hasAccess = (allowed: string[]) => allowed.includes(role);

  const roles = {
    admin: ['admin'],
    dashboard: ['admin', 'sales_manager', 'sales_user', 'warehouse_manager', 'warehouse_user', 'purchase_manager', 'purchase_user', 'production_manager', 'production_user', 'accountant', 'auditor', 'viewer'],
    products: ['admin', 'sales_manager', 'sales_user', 'warehouse_manager', 'warehouse_user', 'purchase_manager', 'purchase_user', 'production_manager', 'production_user', 'accountant', 'auditor', 'viewer'],
    sales: ['admin', 'sales_manager', 'sales_user', 'accountant', 'auditor'],
    purchase: ['admin', 'purchase_manager', 'purchase_user', 'accountant', 'auditor'],
    mfg: ['admin', 'production_manager', 'production_user', 'auditor'],
    inv: ['admin', 'warehouse_manager', 'warehouse_user', 'accountant', 'auditor'],
    floor_console: ['admin', 'production_manager', 'production_user', 'auditor'],
    audit: ['admin', 'auditor'],
    // Create-specific roles (excludes read-only: auditor, accountant, viewer)
    create_sales: ['admin', 'sales_manager', 'sales_user'],
    create_purchase: ['admin', 'purchase_manager', 'purchase_user'],
    create_mfg: ['admin', 'production_manager', 'production_user'],
    create_inv: ['admin', 'warehouse_manager', 'warehouse_user'],
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">


      {/* SideNavBar — full height, no top header offset */}
      <aside className="fixed left-0 top-0 h-full w-[260px] flex flex-col pt-lg pb-md px-sm z-40 bg-primary">
        <div className="flex items-center gap-3 mb-10 px-4 mt-4">
          <div className="w-10 h-10 flex items-center justify-center text-white">
            <svg viewBox="0 0 40 40" className="w-full h-full text-white" fill="currentColor">
              <path d="M10 20C10 14.4772 14.4772 10 20 10V20H10Z" opacity="0.8" />
              <path d="M20 10C25.5228 10 30 14.4772 30 20H20V10Z" />
              <path d="M30 20C30 25.5228 25.5228 30 20 30V20H30Z" opacity="0.6" />
              <path d="M20 30C14.4772 30 10 25.5228 10 20H20V30Z" opacity="0.4" />
            </svg>
          </div>
          <div className="flex flex-col">
            <p className="font-headline-sm text-[18px] text-white font-extrabold tracking-tight leading-tight">SHIV<span className="font-light opacity-80">ERP</span></p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-2">
          <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all ${isActive('/dashboard') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <span className="material-symbols-outlined">grid_view</span>
            <span className="font-label-md">Dashboard</span>
          </Link>
          <Link to="/products" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all ${isActive('/products') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <span className="material-symbols-outlined">inventory</span>
            <span className="font-label-md">Products</span>
          </Link>

          {hasAccess(roles.sales) && (
            <Link to="/sales" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all ${isActive('/sales') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">receipt_long</span>
              <span className="font-label-md">Sales</span>
            </Link>
          )}

          {hasAccess(roles.purchase) && (
            <Link to="/purchase" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all ${isActive('/purchase') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">shopping_cart</span>
              <span className="font-label-md">Purchase</span>
            </Link>
          )}

          {hasAccess(roles.mfg) && (
            <Link to="/manufacturing" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all ${isActive('/manufacturing') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">precision_manufacturing</span>
              <span className="font-label-md">Manufacturing</span>
            </Link>
          )}

          {hasAccess(roles.inv) && (
            <Link to="/inventory" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all ${isActive('/inventory') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">warehouse</span>
              <span className="font-label-md">Inventory</span>
            </Link>
          )}

          {hasAccess(roles.floor_console) && (
            <Link to="/floor-console" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all ${isActive('/floor-console') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">dashboard_customize</span>
              <span className="font-label-md">Floor Console</span>
            </Link>
          )}

          {hasAccess(roles.audit) && (
            <Link to="/audit-log" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all ${isActive('/audit-log') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">history</span>
              <span className="font-label-md">Audit Log</span>
            </Link>
          )}

          {hasAccess(roles.admin) && (
            <Link to="/user-management" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg transition-all ${isActive('/user-management') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">group</span>
              <span className="font-label-md">Users</span>
            </Link>
          )}
        </nav>
        <div className="mt-4 pt-4 border-t border-white/10 space-y-1 px-2">
          <div className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg hover:bg-white/10 transition-all group" onClick={() => window.location.href = '/user-management'}>
            <div className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-white group-hover:text-primary transition-colors">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white leading-tight truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-white/60 capitalize leading-tight truncate">{user?.shiv_role?.replace(/_/g, ' ') || ''}</p>
            </div>
          </div>
          {hasAccess(roles.admin) && (
            <Link to="/settings" className="flex items-center gap-3 px-4 py-3 cursor-pointer text-white/60 hover:text-white transition-all rounded-lg hover:bg-white/10">
              <span className="material-symbols-outlined">settings_suggest</span>
              <span className="font-label-md">Settings</span>
            </Link>
          )}
          <button onClick={() => {
            logout().then(() => window.location.href = '/login');
          }} className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-white/60 hover:text-white transition-all bg-transparent border-none text-left rounded-lg hover:bg-white/10">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md">Logout</span>
          </button>
        </div>
        {(hasAccess(roles.create_sales) || hasAccess(roles.create_purchase) || hasAccess(roles.create_mfg) || hasAccess(roles.create_inv)) && (
          <div className="px-4 mt-6 relative">
            {showNewEntryMenu && (
              <>
                <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowNewEntryMenu(false)} />
                <div className="absolute bottom-16 left-4 right-4 bg-white rounded-lg shadow-xl border border-outline-variant p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 text-on-surface">
                  <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest px-3 py-1 mb-1 border-b border-outline-variant/30">Create New Record</p>
                  {hasAccess(roles.create_sales) && (
                    <Link
                      to="/sales/new"
                      onClick={() => setShowNewEntryMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-all font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                      <span>New Sales Order</span>
                    </Link>
                  )}
                  {hasAccess(roles.create_purchase) && (
                    <Link
                      to="/purchase/new"
                      onClick={() => setShowNewEntryMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-all font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">shopping_cart</span>
                      <span>New Purchase Order</span>
                    </Link>
                  )}
                  {hasAccess(roles.create_mfg) && (
                    <Link
                      to="/manufacturing/new"
                      onClick={() => setShowNewEntryMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-all font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">precision_manufacturing</span>
                      <span>New Mfg Order</span>
                    </Link>
                  )}
                  {hasAccess(roles.create_inv) && (
                    <Link
                      to="/inventory"
                      onClick={() => setShowNewEntryMenu(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-all font-semibold"
                    >
                      <span className="material-symbols-outlined text-[18px]">warehouse</span>
                      <span>New Stock Movement</span>
                    </Link>
                  )}
                </div>
              </>
            )}
            <button
              onClick={() => setShowNewEntryMenu(!showNewEntryMenu)}
              className="w-full flex items-center justify-center gap-2 bg-white text-primary py-3.5 rounded-lg font-bold hover:bg-primary-fixed-dim transition-all shadow-sm active:scale-[0.98]"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span>New Entry</span>
            </button>
          </div>
        )}

      </aside>

      <main className="ml-[260px] min-h-screen bg-surface">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />

          {/* Internal Application Routes (Secured) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/dashboard" element={<AppLayout><OperationalDashboard /></AppLayout>} />
            <Route path="/products" element={<AppLayout><ProductMaster /></AppLayout>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'sales_manager', 'sales_user', 'accountant', 'auditor']} />}>
            <Route path="/sales" element={<AppLayout><SalesList /></AppLayout>} />
            <Route path="/sales/:id" element={<AppLayout><SalesOrder /></AppLayout>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'purchase_manager', 'purchase_user', 'accountant', 'auditor']} />}>
            <Route path="/purchase" element={<AppLayout><PurchaseList /></AppLayout>} />
            <Route path="/purchase/:id" element={<AppLayout><PurchaseOrder /></AppLayout>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'production_manager', 'production_user', 'auditor']} />}>
            <Route path="/manufacturing" element={<AppLayout><ManufacturingList /></AppLayout>} />
            <Route path="/manufacturing/:id" element={<AppLayout><ManufacturingOrder /></AppLayout>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'production_manager', 'production_user', 'auditor']} />}>
            <Route path="/floor-console" element={<AppLayout><FloorConsole /></AppLayout>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'warehouse_manager', 'warehouse_user', 'accountant', 'auditor']} />}>
            <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin', 'auditor']} />}>
            <Route path="/audit-log" element={<AppLayout><AuditLog /></AppLayout>} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
            <Route path="/user-management" element={<AppLayout><UserManagement /></AppLayout>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
