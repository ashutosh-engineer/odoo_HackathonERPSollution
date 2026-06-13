import { ArrowRight, Box, Settings, ShieldCheck, Zap } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 text-brand-primary font-bold text-xl">
          <Box className="w-6 h-6" />
          <span>Shiv Furniture Works</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/login" className="text-slate-600 font-medium hover:text-brand-primary transition-colors min-h-[44px] flex items-center px-4">Sign In</a>
          <button className="min-h-[44px] min-w-[44px] px-6 py-2 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-hover transition-all shadow-sm">
            Try Demo
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="max-w-6xl mx-auto px-8 py-24 text-center">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
          From Demand to Delivery,<br />
          <span className="text-brand-primary">Seamlessly Integrated.</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          The all-in-one Mini ERP designed specifically for Shiv Furniture Works. Manage inventory, process orders, and track manufacturing in real-time.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button className="min-h-[44px] min-w-[44px] px-8 py-3.5 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-hover transition-all shadow-lg flex items-center gap-2 group">
            Start Free Trial
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="min-h-[44px] min-w-[44px] px-8 py-3.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm">
            Contact Sales
          </button>
        </div>
      </header>

      {/* Features Section */}
      <section className="bg-white py-24 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Enterprise-Grade Architecture</h2>
            <p className="text-slate-500">Built with robust validation, reliable touch targets, and a single source of truth.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-6 border border-slate-200 rounded-2xl hover:shadow-md transition-shadow bg-slate-50">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Inventory-First Truth</h3>
              <p className="text-slate-500">Dynamic computation of On-Hand, Reserved, and Free-To-Use quantities prevents stockouts and over-selling.</p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 border border-slate-200 rounded-2xl hover:shadow-md transition-shadow bg-slate-50">
              <div className="w-12 h-12 bg-brand-successBg text-brand-successText rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Real-Time Dashboards</h3>
              <p className="text-slate-500">Track key performance indicators, pending deliveries, and material shortages at a single glance.</p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 border border-slate-200 rounded-2xl hover:shadow-md transition-shadow bg-slate-50">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Settings className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Manufacturing Execution</h3>
              <p className="text-slate-500">Seamlessly convert sales demand into detailed manufacturing orders and work center tracking.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
