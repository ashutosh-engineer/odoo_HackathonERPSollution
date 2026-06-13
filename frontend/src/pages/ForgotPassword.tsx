import { useState } from 'react';
import { Link } from 'react-router-dom';

export const ForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSuccess(true);
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-gutter py-12 relative overflow-hidden bg-surface font-body-md text-on-surface antialiased">
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
        <div 
          className="absolute top-0 left-0 w-full h-full" 
          style={{ backgroundImage: 'radial-gradient(#714b67 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
        ></div>
      </div>
      
      <div className="w-full max-w-[400px] z-10">
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 mb-4 text-primary flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-full h-full" fill="currentColor">
              <path d="M10 20C10 14.4772 14.4772 10 20 10V20H10Z" opacity="0.8"/>
              <path d="M20 10C25.5228 10 30 14.4772 30 20H20V10Z" />
              <path d="M30 20C30 25.5228 25.5228 30 20 30V20H30Z" opacity="0.6"/>
              <path d="M20 30C14.4772 30 10 25.5228 10 20H20V30Z" opacity="0.4"/>
            </svg>
          </div>
          <h1 className="font-headline-md text-headline-md font-extrabold text-slate-900 tracking-tight">SHIV<span className="text-primary font-light">ERP</span></h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Account Recovery</p>
        </div>
        
        {/* Recovery Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-xl shadow-sm">
          {!isSuccess ? (
            <form className="space-y-6" id="recoveryForm" onSubmit={handleSubmit}>
              <div className="text-center mb-6">
                <p className="text-sm text-slate-600">Enter your email address and we'll send you a link to reset your password.</p>
              </div>

              {/* Email Field */}
              <div className="space-y-2 group">
                <label className="font-label-md text-label-md text-on-surface-variant block uppercase" htmlFor="email">Email Address</label>
                <div className="relative group-focus-within:scale-[1.01] transition-transform">
                  <input 
                    className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md form-input-focus transition-all focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                    id="email" 
                    name="email" 
                    placeholder="name@shivfurniture.com" 
                    required 
                    type="email" 
                  />
                </div>
              </div>
              
              {/* Actions */}
              <div className="pt-2 space-y-4">
                <button 
                  className={`w-full h-10 text-on-primary font-semibold rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 bg-primary-container disabled:opacity-80`} 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Sending Link...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Recovery Link</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success-forest/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-success-forest text-[32px]">check_circle</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Check Your Email</h3>
              <p className="text-slate-600 text-sm">We've sent a password reset link to your email address. Please check your inbox and spam folder.</p>
            </div>
          )}
        </div>
        
        {/* Footer / Secondary Actions */}
        <div className="mt-8 text-center space-y-4">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Remember your password? <Link to="/login" className="text-primary font-semibold hover:underline">Back to Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
