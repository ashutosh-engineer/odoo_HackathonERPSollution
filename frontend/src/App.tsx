import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SignIn } from './pages/SignIn';
import { AdminLogin } from './pages/AdminLogin';
import { OperationalDashboard } from './pages/OperationalDashboard';
import { ProductMaster } from './pages/ProductMaster';
import { SalesOrder } from './pages/SalesOrder';
import { ManufacturingOrder } from './pages/ManufacturingOrder';
import { PurchaseOrder } from './pages/PurchaseOrder';
import { Inventory } from './pages/Inventory';
import { Settings } from './pages/Settings';
import { UserManagement } from './pages/UserManagement';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased min-h-screen">
      {/* TopNavBar */}
      <nav className="flex justify-between items-center w-full px-gutter h-16 sticky top-0 z-50 bg-white border-b border-outline-variant shadow-sm">
        <div className="flex items-center gap-8">
          <span className="font-headline-sm text-headline-sm font-extrabold text-primary tracking-tight">Shiv Furniture Works</span>
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
          <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-white border border-white/20">
            <span className="material-symbols-outlined !text-[24px]">factory</span>
          </div>
          <div>
            <p className="font-headline-sm text-[18px] text-white font-bold leading-tight">Shiv Furniture</p>
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
          <Link to="/sales/SO-2024-001" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/sales') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <span className="material-symbols-outlined">receipt_long</span>
            <span className="font-label-md">Sales</span>
          </Link>
          <Link to="/purchase" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/purchase') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <span className="material-symbols-outlined">shopping_cart</span>
            <span className="font-label-md">Purchase</span>
          </Link>
          <Link to="/manufacturing/MO-1045" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/manufacturing') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <span className="material-symbols-outlined">precision_manufacturing</span>
            <span className="font-label-md">Manufacturing</span>
          </Link>
          <Link to="/inventory" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/inventory') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <span className="material-symbols-outlined">warehouse</span>
            <span className="font-label-md">Inventory</span>
          </Link>
          <Link to="/user-management" className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-all ${isActive('/user-management') ? 'nav-active font-semibold' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
            <span className="material-symbols-outlined">group</span>
            <span className="font-label-md">Users</span>
          </Link>
        </nav>
        <div className="mt-4 pt-6 border-t border-white/10 space-y-1 px-2">
          <Link to="/settings" className="flex items-center gap-3 px-4 py-3 cursor-pointer text-white/60 hover:text-white transition-all">
            <span className="material-symbols-outlined">settings_suggest</span>
            <span className="font-label-md">Settings</span>
          </Link>
          <Link to="/" className="flex items-center gap-3 px-4 py-3 cursor-pointer text-white/60 hover:text-white transition-all">
            <span className="material-symbols-outlined">logout</span>
            <span className="font-label-md">Logout</span>
          </Link>
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
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Internal Application Routes (wrapped in layout) */}
        <Route path="/dashboard" element={<AppLayout><OperationalDashboard /></AppLayout>} />
        <Route path="/products" element={<AppLayout><ProductMaster /></AppLayout>} />
        <Route path="/sales/:id" element={<AppLayout><SalesOrder /></AppLayout>} />
        <Route path="/purchase" element={<AppLayout><PurchaseOrder /></AppLayout>} />
        <Route path="/manufacturing/:id" element={<AppLayout><ManufacturingOrder /></AppLayout>} />
        <Route path="/inventory" element={<AppLayout><Inventory /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
        <Route path="/user-management" element={<AppLayout><UserManagement /></AppLayout>} />
      </Routes>
    </Router>
  );
}

export default App;
