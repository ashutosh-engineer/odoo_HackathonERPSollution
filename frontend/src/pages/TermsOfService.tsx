import { Link } from 'react-router-dom';

export const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white border-b border-outline-variant/30 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center gap-2">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-full h-full text-primary" fill="currentColor">
                  <path d="M10 20C10 14.4772 14.4772 10 20 10V20H10Z" opacity="0.8"/>
                  <path d="M20 10C25.5228 10 30 14.4772 30 20H20V10Z" />
                  <path d="M30 20C30 25.5228 25.5228 30 20 30V20H30Z" opacity="0.6"/>
                  <path d="M20 30C14.4772 30 10 25.5228 10 20H20V30Z" opacity="0.4"/>
                </svg>
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">SHIV<span className="text-primary font-light">ERP</span></span>
            </Link>
            <Link to="/login" className="text-sm font-semibold text-primary hover:underline">Back to Login</Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="pt-32 pb-24 max-w-3xl mx-auto px-6">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">Terms of Service</h1>
        <p className="text-slate-500 mb-8 font-medium">Last updated: June 13, 2026</p>

        <div className="space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using SHIV ERP, you accept and agree to be bound by the terms and provision of this agreement. In addition, when using these particular services, you shall be subject to any posted guidelines or rules applicable to such services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Description of Service</h2>
            <p>
              SHIV ERP provides a comprehensive manufacturing and operations management system designed specifically for the furniture industry. The service includes inventory tracking, order management, procurement automation, and factory floor operations. We reserve the right to modify, suspend, or discontinue the service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. User Conduct</h2>
            <p className="mb-4">
              You agree to use the service only for lawful purposes. You agree not to take any action that might compromise the security of the site, render the site inaccessible to others, or otherwise cause damage to the site or its content.
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Do not attempt to access restricted areas of the system without authorization.</li>
              <li>Do not engage in activities that could disrupt the service for other users.</li>
              <li>Do not upload malicious code or attempt to compromise our database.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Data and Privacy</h2>
            <p>
              Your use of the service is also governed by our Privacy Policy. By using SHIV ERP, you consent to the practices detailed in the Privacy Policy. We maintain strict ACID compliance and immutable audit logs to ensure your business data is secure and accurate.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Disclaimer of Warranties</h2>
            <p>
              The service is provided on an "AS IS" and "AS AVAILABLE" basis. SHIV ERP expressly disclaims all warranties of any kind, whether express or implied, including, but not limited to the implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
            </p>
          </section>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white py-10 border-t border-slate-200 text-center text-sm text-slate-500 font-medium">
        <p>© 2026 Shiv Furniture Works. All rights reserved.</p>
      </footer>
    </div>
  );
};
