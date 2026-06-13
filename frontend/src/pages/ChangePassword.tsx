import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils/api';

export const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await apiFetch('/shiv/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });

      // Update user context so ProtectedRoute stops blocking
      updateUser({ must_change_password: false });
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to change password. Please check your current password and try again.');
    } finally {
      setIsSubmitting(false);
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
        
        {/* Change Password Card */}
        <div className="bg-surface-container-lowest border border-outline-variant p-8 rounded-xl shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-on-surface">Change Password</h2>
            <p className="text-sm text-on-surface-variant mt-1">You must change your password before continuing</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded bg-error-container text-error text-sm font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              {/* Current Password Field */}
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="currentPassword">Current Password</label>
                <div className="relative group/input">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within/input:text-primary transition-colors text-[20px]">lock</span>
                  <input 
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-surface-container-low font-body-md text-on-surface outline-none" 
                    id="currentPassword" 
                    placeholder="Enter current password" 
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* New Password Field */}
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="newPassword">New Password</label>
                <div className="relative group/input">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within/input:text-primary transition-colors text-[20px]">key</span>
                  <input 
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-surface-container-low font-body-md text-on-surface outline-none" 
                    id="newPassword" 
                    placeholder="Enter new password" 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="confirmPassword">Confirm New Password</label>
                <div className="relative group/input">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within/input:text-primary transition-colors text-[20px]">key</span>
                  <input 
                    className="w-full h-10 pl-10 pr-4 rounded-lg border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-surface-container-low font-body-md text-on-surface outline-none" 
                    id="confirmPassword" 
                    placeholder="Confirm new password" 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="pt-2">
              <button 
                className="w-full h-10 bg-primary-container text-on-primary font-semibold rounded-lg shadow-sm hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-80" 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Changing...</span>
                  </>
                ) : (
                  <>
                    <span>Change Password</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
