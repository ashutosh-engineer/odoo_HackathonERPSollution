import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not logged in, force redirect to Sign In page
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const location = useLocation();
  if (user.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // If roles are specified and the user's role is not among them
  if (allowedRoles && allowedRoles.length > 0) {
    if (!user.shiv_role || !allowedRoles.includes(user.shiv_role)) {
      // Redirect to a safe page like dashboard if unauthorized
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
}
