import { useState } from 'react';
import { Link } from 'react-router-dom';

export const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState<'username' | 'password' | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center p-md bg-[#F3F4F6] text-on-surface">
      {/* Background Illustration (Minimal Enterprise Patterns) */}
      <div className="fixed inset-0 -z-10 opacity-[0.03] pointer-events-none overflow-hidden">
        <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern height="40" id="grid" patternUnits="userSpaceOnUse" width="40">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"></path>
            </pattern>
          </defs>
          <rect fill="url(#grid)" height="100%" width="100%"></rect>
        </svg>
      </div>

      {/* Main Login Container */}
      <main className="w-full max-w-[440px]">
        {/* Branding Area */}
        <div className="text-center mb-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary-container mb-md">
            <span className="material-symbols-outlined text-white text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>factory</span>
          </div>
          <h1 className="font-headline-sm text-headline-sm text-primary tracking-tight">Shiv Furniture ERP</h1>
        </div>

        {/* Login Card */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-xl login-card bg-white">
          {/* Alert Box (Restricted State Demo) */}
          <div className="mb-lg bg-error-container border border-error/20 p-md rounded-lg flex items-start gap-md animate-shake">
            <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>report</span>
            <div>
              <p className="font-label-md text-on-error-container text-error font-bold">Access Denied</p>
              <p className="font-body-sm text-on-error-container">You do not have administrative privileges</p>
            </div>
          </div>

          {/* Header Section */}
          <header className="mb-lg">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Administrator Access</h2>
            <p className="font-body-md text-on-surface-variant leading-relaxed">
              Standard user accounts are restricted from this area. Please enter admin credentials.
            </p>
          </header>

          {/* Login Form */}
          <form className="space-y-lg" onSubmit={(e) => e.preventDefault()}>
            {/* Username Field */}
            <div className="space-y-xs">
              <label className="font-label-md text-label-md text-on-surface-variant block" htmlFor="username">Username</label>
              <div className="relative">
                <span className={`material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 transition-colors ${isFocused === 'username' ? 'text-primary' : 'text-outline'}`}>person</span>
                <input 
                  className="w-full h-[40px] pl-[44px] pr-md rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-surface-container-low font-body-md text-on-surface" 
                  id="username" 
                  name="username" 
                  placeholder="admin_username" 
                  type="text"
                  onFocus={() => setIsFocused('username')}
                  onBlur={() => setIsFocused(null)}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-xs">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="password">Password</label>
                <button className="text-primary font-label-md hover:underline" type="button">Forgot password?</button>
              </div>
              <div className="relative">
                <span className={`material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 transition-colors ${isFocused === 'password' ? 'text-primary' : 'text-outline'}`}>lock</span>
                <input 
                  className="w-full h-[40px] pl-[44px] pr-md rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-surface-container-low font-body-md text-on-surface" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  onFocus={() => setIsFocused('password')}
                  onBlur={() => setIsFocused(null)}
                />
                <button 
                  className="absolute right-md top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
            </div>

            {/* Primary CTA */}
            <button className="w-full h-[44px] bg-primary-container hover:bg-primary transition-colors text-white font-headline-sm text-label-md rounded-lg flex items-center justify-center gap-sm mt-lg" type="submit">
              <span className="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              Admin Login
            </button>
          </form>

          {/* Footer Links */}
          <footer className="mt-xl pt-lg border-t border-outline-variant text-center">
            <Link to="/login" className="inline-flex items-center gap-xs font-label-md text-primary hover:text-primary-container transition-colors group">
              <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">arrow_back</span>
              Return to Employee Portal
            </Link>
          </footer>
        </div>

        {/* Security Disclaimer */}
        <p className="mt-lg text-center font-label-sm text-outline uppercase tracking-widest flex items-center justify-center gap-sm">
          <span className="material-symbols-outlined text-[16px]">verified_user</span>
          Secure End-to-End Encryption
        </p>
      </main>
    </div>
  );
};
