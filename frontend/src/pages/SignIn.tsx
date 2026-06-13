import { useState } from 'react';

export const SignIn = () => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    // Simulate API call
    setTimeout(() => {
      setIsSuccess(true);
      
      // Redirect simulation
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-gutter py-12 relative overflow-hidden bg-surface font-body-md text-on-surface antialiased">
      {/* Background Decoration (Artisan Enterprise Modern Style) */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-5">
        <div 
          className="absolute top-0 left-0 w-full h-full" 
          style={{ backgroundImage: 'radial-gradient(#714b67 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }}
        ></div>
      </div>
      
      <div className="w-full max-w-[400px] z-10">
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 mb-4 bg-primary rounded-xl flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-on-primary text-4xl">chair</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface tracking-tight">Shiv Furniture Works</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Workshop Management Portal</p>
        </div>
        
        {/* Login Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-xl shadow-sm">
          <form className="space-y-6" id="loginForm" onSubmit={handleSubmit}>
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
            
            {/* Password Field */}
            <div className="space-y-2 group">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface-variant block uppercase" htmlFor="password">Password</label>
                <a className="font-label-md text-label-md text-primary hover:underline transition-all" href="#">Forgot?</a>
              </div>
              <div className="relative group-focus-within:scale-[1.01] transition-transform">
                <input 
                  className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md form-input-focus transition-all focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  id="password" 
                  name="password" 
                  placeholder="••••••••" 
                  required 
                  type="password" 
                />
              </div>
            </div>
            
            {/* Actions */}
            <div className="pt-2 space-y-4">
              <button 
                className={`w-full h-10 text-on-primary font-semibold rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${isSuccess ? 'bg-success-forest' : 'bg-primary-container'} disabled:opacity-80`} 
                type="submit"
                disabled={isAuthenticating || isSuccess}
              >
                {isSuccess ? (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    <span>Success!</span>
                  </>
                ) : isAuthenticating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Log in</span>
                    <span className="material-symbols-outlined text-lg">login</span>
                  </>
                )}
              </button>
              
              <div className="flex items-center justify-center">
                <span className="h-[1px] w-full bg-outline-variant"></span>
                <span className="px-4 font-label-md text-label-md text-outline">OR</span>
                <span className="h-[1px] w-full bg-outline-variant"></span>
              </div>
            </div>
          </form>
        </div>
        
        {/* Footer / Secondary Actions */}
        <div className="mt-8 text-center space-y-4">
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Don't have an account? <a className="text-primary font-semibold hover:underline" href="#">Contact Administrator</a>
          </p>
          <div className="pt-8 flex justify-center gap-6">
            <a className="font-label-md text-label-md text-outline hover:text-on-surface transition-colors" href="#">Privacy Policy</a>
            <a className="font-label-md text-label-md text-outline hover:text-on-surface transition-colors" href="#">Terms of Service</a>
          </div>
          <div className="flex items-center justify-center gap-2 text-outline">
            <span className="material-symbols-outlined text-sm">copyright</span>
            <span className="font-label-md text-label-md">Shiv Furniture</span>
          </div>
        </div>
      </div>
    </div>
  );
};
