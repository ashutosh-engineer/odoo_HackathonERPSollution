import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
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
    floor_console: ['admin', 'production_manager', 'production_user'],
    audit: ['admin', 'auditor'],
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      {/* TopNavBar */}
      <nav className="flex justify-between items-center w-full px-gutter h-16 sticky top-0 z-50 bg-white border-b border-outline-variant shadow-sm">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 40 40" className="w-7 h-7 text-primary" fill="currentColor">
              <path d="M10 20C10 14.4772 14.4772 10 20 10V20H10Z" opacity="0.8"/>
              <path d="M20 10C25.5228 10 30 14.4772 30 20H20V10Z" />
              <path d="M30 20C30 25.5228 25.5228 30 20 30V20H30Z" opacity="0.6"/>
              <path d="M20 30C14.4772 30 10 25.5228 10 20H20V30Z" opacity="0.4"/>
            </svg>
            <span className="font-headline-sm text-headline-sm font-extrabold tracking-tight text-slate-900">SHIV<span className="text-primary font-light">ERP</span></span>
          </div>
          <div className="hidden md:flex items-center bg-surface-variant rounded-lg px-4 py-2 gap-3 border border-outline-variant transition-all focus-within:border-primary/50 focus-within:bg-white focus-within:shadow-sm">
            <span className="material-symbols-outlined text-on-surface-variant">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-body-sm w-72 p-0 placeholder-on-surface-variant/60 outline-none" placeholder="Search for orders, products or customers..." type="text"/>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2.5 hover:bg-surface-variant transition-colors rounded-lg relative group">
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">notifications</span>
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-error rounded-full border-2 border-white"></span>
          </button>
          <button className="p-2.5 hover:bg-surface-variant transition-colors rounded-lg group">
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">settings</span>
          </button>
          <button className="p-2.5 hover:bg-surface-variant transition-colors rounded-lg group">
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">help_outline</span>
          </button>
          <div className="ml-2 w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
            <img alt="User profile" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9nPQnPwiyFACYIPnvMJjPGpK9C_afxFIxEIdwTSghixSRtkn2ZQT-Da0TaPd0cKhwTB5chX3IJzrQrj_T5NM90mas94xO9ZxY02cbP35cTEMP8iC7gCQon0CMzExNndE_iq-B3hFj3bpdf-8nYbddYY-T8hTK6O1IRg9MZd1yGH4RHBKpAJ_cUemlSttRhfh2fIDlUcTZSTSRM4BM3DMuSL4pknCZT4Hf3x9oEGizfg8mdqvbVaVzV5diKd6S8hE8-pMLaBrEyibG"/>
          </div>
        </div>
      </nav>

      {/* SideNavBar */}
      <aside className="fixed left-0 top-0 h-full w-[260px] flex flex-col pt-lg pb-md px-sm z-40 bg-primary shadow-xl">
        <div className="flex items-center gap-3 mb-10 px-4 mt-16">
          <div className="w-10 h-10 flex items-center justify-center text-white">
            <svg viewBox="0 0 40 40" className="w-full h-full text-white" fill="currentColor">
              <path d="M10 20C10 14.4772 14.4772 10 20 10V20H10Z" opacity="0.8"/>
              <path d="M20 10C25.5228 10 30 14.4772 30 20H20V10Z" />
              <path d="M30 20C30 25.5228 25.5228 30 20 30V20H30Z" opacity="0.6"/>
              <path d="M20 30C14.4772 30 10 25.5228 10 20H20V30Z" opacity="0.4"/>
            </svg>
          </div>
          <div>
            <p className="font-headline-sm text-[18px] text-white font-extrabold tracking-tight leading-tight">SHIV<span className="font-light opacity-80">ERP</span></p>
            <p className="text-[10px] text-white/60 uppercase tracking-[0.1em] font-black">Enterprise ERP</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar px-2">
          <Link to="/dashboard" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/dashboard') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <span className="material-symbols-outlined">grid_view</span>
            <span className="font-label-md">Dashboard</span>
          </Link>
          <Link to="/products" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/products') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <span className="material-symbols-outlined">inventory</span>
            <span className="font-label-md">Products</span>
          </Link>
          
          {hasAccess(roles.sales) && (
            <Link to="/sales" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/sales') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">receipt_long</span>
              <span className="font-label-md">Sales</span>
            </Link>
          )}
          
          {hasAccess(roles.purchase) && (
            <Link to="/purchase" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/purchase') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">shopping_cart</span>
              <span className="font-label-md">Purchase</span>
            </Link>
          )}
          
          {hasAccess(roles.mfg) && (
            <Link to="/manufacturing" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/manufacturing') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">precision_manufacturing</span>
              <span className="font-label-md">Manufacturing</span>
            </Link>
          )}
          
          {hasAccess(roles.inv) && (
            <Link to="/inventory" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/inventory') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">warehouse</span>
              <span className="font-label-md">Inventory</span>
            </Link>
          )}
          
          {hasAccess(roles.floor_console) && (
            <Link to="/floor-console" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/floor-console') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">dashboard_customize</span>
              <span className="font-label-md">Floor Console</span>
            </Link>
          )}

          {hasAccess(roles.audit) && (
            <Link to="/audit-log" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/audit-log') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">history</span>
              <span className="font-label-md">Audit Log</span>
            </Link>
          )}
          
          {hasAccess(roles.admin) && (
            <Link to="/user-management" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/user-management') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              <span className="material-symbols-outlined">group</span>
              <span className="font-label-md">Users</span>
            </Link>
          )}
        </nav>
        <div className="mt-4 pt-6 border-t border-white/10 space-y-1 px-2">
          {hasAccess(roles.admin) && (
            <Link to="/settings" className="flex items-center gap-3 px-4 py-3 cursor-pointer text-white/60 hover:text-white transition-all">
              <span className="material-symbols-outlined">settings_suggest</span>
              <span className="font-label-md">Settings</span>
            </Link>
          )}
          <button onClick={() => {
            logout().then(() => window.location.href = '/login');
          }} className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-white/60 hover:text-white transition-all bg-transparent border-none text-left">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md">Logout</span>
          </button>
        </div>
        <div className="px-4 mt-6">
          <button className="w-full flex items-center justify-center gap-2 bg-white text-primary py-3.5 rounded-xl font-bold hover:bg-primary-fixed-dim transition-all shadow-lg active:scale-[0.98]">
            <span className="material-symbols-outlined">add_circle</span>
            <span>New Entry</span>
          </button>
        </div>
      </aside>

      <main className="ml-[260px] min-h-[calc(100vh-64px)] bg-surface">
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

          <Route element={<ProtectedRoute allowedRoles={['admin', 'production_manager', 'production_user']} />}>
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
