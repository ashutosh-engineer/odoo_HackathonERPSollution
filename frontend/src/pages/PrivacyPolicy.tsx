import { Link } from 'react-router-dom';

export const PrivacyPolicy = () => {
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
        <h1 className="text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">Privacy Policy</h1>
        <p className="text-slate-500 mb-8 font-medium">Last updated: June 13, 2026</p>

        <div className="space-y-8 text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information to provide better services to all our users. The types of information we collect include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, password, and organization details when you sign up.</li>
              <li><strong>Operational Data:</strong> Inventory counts, manufacturing orders, procurement data, and other business records entered into the ERP.</li>
              <li><strong>Usage Data:</strong> How you interact with the application, feature usage, and system performance metrics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">
              We use the information we collect from all our services for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide, maintain, and improve the SHIV ERP system.</li>
              <li>To develop new features and capabilities.</li>
              <li>To provide customer support and troubleshoot system anomalies.</li>
              <li>To ensure the security of our platform and prevent unauthorized access.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Data Security and Retention</h2>
            <p>
              Security is core to our architecture. All data is transmitted over encrypted channels (HTTPS) and stored securely in our PostgreSQL databases. We employ daily S3 snapshots and WAL archiving to ensure high availability. By default, operational audit trails are retained for 7 years to meet compliance standards.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Sharing Your Information</h2>
            <p>
              We do not sell your personal information or business data. We only share information with third parties when it is necessary to provide our service (such as cloud hosting providers), when we have your explicit consent, or when legally required to do so.
            </p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact your system administrator or reach out to our security team directly.
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
