import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError('');

    try {
      await login(email, password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsAuthenticating(false);
    }
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
          <div className="w-16 h-16 mb-4 text-primary flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-full h-full" fill="currentColor">
              <path d="M10 20C10 14.4772 14.4772 10 20 10V20H10Z" opacity="0.8"/>
              <path d="M20 10C25.5228 10 30 14.4772 30 20H20V10Z" />
              <path d="M30 20C30 25.5228 25.5228 30 20 30V20H30Z" opacity="0.6"/>
              <path d="M20 30C14.4772 30 10 25.5228 10 20H20V30Z" opacity="0.4"/>
            </svg>
          </div>
          <h1 className="font-headline-md text-headline-md font-extrabold text-slate-900 tracking-tight">SHIV<span className="text-primary font-light">ERP</span></h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Workshop Management Portal</p>
        </div>
        
        {/* Login Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-xl shadow-sm">
          <form className="space-y-6" id="loginForm" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-error-container text-error px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Email/Login Field */}
            <div className="space-y-2 group">
              <label className="font-label-md text-label-md text-on-surface-variant block uppercase" htmlFor="email">Email or Username</label>
              <div className="relative group-focus-within:scale-[1.01] transition-transform">
                <input 
                  className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md form-input-focus transition-all focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  id="email" 
                  name="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin or name@shivfurniture.com" 
                  required 
                  type="text" 
                />
              </div>
            </div>
            
            {/* Password Field */}
            <div className="space-y-2 group">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface-variant block uppercase" htmlFor="password">Password</label>
              </div>
              <div className="relative group-focus-within:scale-[1.01] transition-transform">
                <input 
                  className="w-full h-10 px-3 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md form-input-focus transition-all focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" 
                  id="password" 
                  name="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
          <div className="pt-4 flex justify-center gap-6">
            <Link className="font-label-md text-label-md text-outline hover:text-on-surface transition-colors" to="/privacy">Privacy Policy</Link>
            <Link className="font-label-md text-label-md text-outline hover:text-on-surface transition-colors" to="/terms">Terms of Service</Link>
          </div>
          <div className="flex items-center justify-center gap-2 text-outline">
            <svg viewBox="0 0 40 40" className="w-4 h-4 text-outline" fill="currentColor">
              <path d="M10 20C10 14.4772 14.4772 10 20 10V20H10Z" opacity="0.8"/>
              <path d="M20 10C25.5228 10 30 14.4772 30 20H20V10Z" />
              <path d="M30 20C30 25.5228 25.5228 30 20 30V20H30Z" opacity="0.6"/>
              <path d="M20 30C14.4772 30 10 25.5228 10 20H20V30Z" opacity="0.4"/>
            </svg>
            <span className="font-label-md text-label-md">SHIV ERP</span>
          </div>
        </div>
      </div>
    </div>
  );
};
