import { ArrowRight, CheckCircle2, Factory, TrendingUp, Clock, ShieldCheck, Database, Server, Smartphone, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface">
      {/* Navigation - Minimalist & Clean */}
      <nav className="fixed w-full z-50 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/30 transition-all">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Custom Designed Logo */}
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-full h-full text-primary" fill="currentColor">
                  <path d="M10 20C10 14.4772 14.4772 10 20 10V20H10Z" opacity="0.8"/>
                  <path d="M20 10C25.5228 10 30 14.4772 30 20H20V10Z" />
                  <path d="M30 20C30 25.5228 25.5228 30 20 30V20H30Z" opacity="0.6"/>
                  <path d="M20 30C14.4772 30 10 25.5228 10 20H20V30Z" opacity="0.4"/>
                </svg>
              </div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">SHIV<span className="text-primary font-light">ERP</span></span>
            </div>
            
            <div className="flex items-center gap-6">
              <Link to="/login" className="hidden md:block text-on-surface hover:text-primary text-sm font-semibold transition-colors">Sign In</Link>
              <Link to="/login" className="px-5 py-2.5 bg-primary text-white text-sm rounded font-semibold hover:bg-primary/90 transition-all shadow-sm">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Professional SaaS Layout */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15] mb-8">
              Manufacturing ERP,<br />
              <span className="text-primary">Engineered for Scale.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto font-medium">
              A production-ready system designed to cut ₹2Cr+ in operational waste. Unifying inventory, procurement, and manufacturing with absolute ACID compliance.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/login" className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white rounded font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center justify-center gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="w-full sm:w-auto px-8 py-3.5 bg-white text-slate-700 border border-slate-300 rounded font-bold hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm">
                View Architecture
              </a>
            </div>
          </div>
          
          {/* Hero Image - Displayed cleanly like a dashboard showcase */}
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200/50 bg-white shadow-2xl p-2">
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent z-10 top-[80%]" />
            <img 
              src="/hero_bg.png" 
              alt="Shiv Furniture Manufacturing Interface" 
              className="w-full h-auto rounded-xl object-cover border border-slate-100"
              style={{ maxHeight: '600px', objectPosition: 'center 20%' }}
            />
          </div>
        </div>
      </section>

      {/* Data & Impact Strip */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-100 text-center">
            <div className="px-4">
              <div className="text-3xl font-extrabold text-slate-900 mb-1">99.9%</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Inventory Accuracy</div>
            </div>
            <div className="px-4">
              <div className="text-3xl font-extrabold text-slate-900 mb-1">1-2 Days</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Fulfillment Cycle</div>
            </div>
            <div className="px-4">
              <div className="text-3xl font-extrabold text-slate-900 mb-1">5 Min</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Procurement Time</div>
            </div>
            <div className="px-4">
              <div className="text-3xl font-extrabold text-slate-900 mb-1">100%</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Audit Compliance</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Architecture Section -> Rebranded for Business Value */}
      <section id="architecture" className="py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">Built for High-Volume Manufacturing</h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                This system is designed to grow with your business. Whether you are processing 100 orders a month or 10,000, our platform guarantees lightning-fast performance without ever slowing down your operations.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1">
                    <Server className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Flawless Inventory Control</h4>
                    <p className="text-slate-600 text-sm mt-1">Never oversell a product again. Our system instantly locks inventory the moment an order is placed, ensuring absolute accuracy even during busy seasons.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1">
                    <Lock className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">100% Audit-Proof Records</h4>
                    <p className="text-slate-600 text-sm mt-1">Protect your business with a permanent, unchangeable record of every action. See exactly who did what, and when, guaranteeing complete accountability.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1">
                    <Database className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Always Online, Always Secure</h4>
                    <p className="text-slate-600 text-sm mt-1">Your data is automatically backed up every single minute. Rest easy knowing your factory operations are protected against any disruption.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* The "Old vs New" Matrix -> Business Focused */}
            <div className="lg:w-1/2 w-full">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="grid grid-cols-2 bg-slate-50 border-b border-slate-200 text-sm font-bold text-slate-500 uppercase tracking-wider">
                  <div className="p-4 px-6 border-r border-slate-200">The Problem</div>
                  <div className="p-4 px-6 text-primary">The Solution</div>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-2">
                    <div className="p-6 border-r border-slate-200 text-slate-600 text-sm">Constant stockouts and missing inventory</div>
                    <div className="p-6 font-medium text-slate-900 text-sm flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success-forest mt-0.5 shrink-0" />
                      99.9% real-time accuracy
                    </div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="p-6 border-r border-slate-200 text-slate-600 text-sm">Wasting days waiting on vendor emails</div>
                    <div className="p-6 font-medium text-slate-900 text-sm flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success-forest mt-0.5 shrink-0" />
                      Purchase orders in 5 minutes
                    </div>
                  </div>
                  <div className="grid grid-cols-2">
                    <div className="p-6 border-r border-slate-200 text-slate-600 text-sm">Blind to factory floor bottlenecks</div>
                    <div className="p-6 font-medium text-slate-900 text-sm flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success-forest mt-0.5 shrink-0" />
                      Live tracking of every machine
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Business Capabilities - Clean Grid */}
      <section id="features" className="py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Functional Modules</h2>
            <p className="text-slate-600 text-lg max-w-2xl">
              End-to-end management from customer order to factory floor execution.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-x-12 gap-y-16">
            <div className="flex gap-5">
              <div className="shrink-0 mt-1">
                <Database className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Inventory Management</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                  Real-time tracking of on-hand, reserved, and free-to-use quantities. Complete with FIFO/LIFO valuation and multi-location support.
                </p>
                <Link to="/inventory" className="text-primary text-sm font-bold hover:underline">View Module →</Link>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="shrink-0 mt-1">
                <TrendingUp className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Sales Order Processing</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                  Create orders with instant availability checks. Workflow management from Draft to Confirmed to Delivered with precise delivery date estimations.
                </p>
                <Link to="/sales-orders" className="text-primary text-sm font-bold hover:underline">View Module →</Link>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="shrink-0 mt-1">
                <Clock className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Automated Procurement</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                  MTO vs MTS decision engine automatically selects vendors based on lead time and cost, generating Purchase Orders recursively for BoM components.
                </p>
                <Link to="/purchase-orders" className="text-primary text-sm font-bold hover:underline">View Module →</Link>
              </div>
            </div>

            <div className="flex gap-5">
              <div className="shrink-0 mt-1">
                <Factory className="w-6 h-6 text-slate-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Manufacturing Execution</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-3">
                  Manage complex hierarchical Bills of Materials. Schedule and track Manufacturing Orders while monitoring Work Center capacity and raw material wastage.
                </p>
                <Link to="/manufacturing/MO-1045" className="text-primary text-sm font-bold hover:underline">View Module →</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Feature: Factory Floor Console - Minimalist approach */}
      <section id="console" className="py-24 bg-surface border-t border-slate-200 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-5/12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-primary/20 text-primary text-xs font-bold mb-6 tracking-wide">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                Hardware Integration
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">
                Live Work Center Console
              </h2>
              <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                Most ERPs sit in the back office. We built a high-density, touch-friendly operational panel specifically for rugged tablets on the factory floor, directly linking machine operators to planning logic.
              </p>
              
              <div className="space-y-8 mt-8">
                <div className="relative pl-6 border-l-2 border-slate-200 hover:border-primary transition-colors duration-300">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-primary" />
                  <h4 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight">Built for the Factory Floor</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">Large, easy-to-tap buttons let operators start and stop work instantly, keeping their focus on manufacturing rather than navigating menus.</p>
                </div>
                
                <div className="relative pl-6 border-l-2 border-slate-200 hover:border-primary transition-colors duration-300">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-primary" />
                  <h4 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight">Instant Problem Solving</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">If a machine breaks down, a single tap alerts the entire factory and automatically reassigns the workload to keep production moving without delay.</p>
                </div>

                <div className="relative pl-6 border-l-2 border-slate-200 hover:border-primary transition-colors duration-300">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-primary" />
                  <h4 className="text-xl font-extrabold text-slate-900 mb-2 tracking-tight">Real-Time Visibility</h4>
                  <p className="text-slate-600 leading-relaxed font-medium">Every tablet and office dashboard updates instantly. Supervisors never have to guess—they always know exactly what is happening on the floor right now.</p>
                </div>
              </div>
            </div>
            
            <div className="lg:w-7/12 w-full">
              <img 
                src="/tablet_console.png" 
                alt="Factory Floor Tablet Console" 
                className="w-full h-auto rounded-xl shadow-xl border border-slate-200"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Product Approach */}
      <footer className="bg-white py-10 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 40 40" className="w-5 h-5 text-primary" fill="currentColor">
              <path d="M10 20C10 14.4772 14.4772 10 20 10V20H10Z" opacity="0.8"/>
              <path d="M20 10C25.5228 10 30 14.4772 30 20H20V10Z" />
              <path d="M30 20C30 25.5228 25.5228 30 20 30V20H30Z" opacity="0.6"/>
              <path d="M20 30C14.4772 30 10 25.5228 10 20H20V30Z" opacity="0.4"/>
            </svg>
            <span className="font-extrabold text-sm tracking-tight text-slate-900">SHIV<span className="text-primary font-light">ERP</span></span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <Link to="/dashboard" className="hover:text-primary transition-colors">Product</Link>
            <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
