import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface RoleGuardProps {
  allowedRoles?: string[];
  children: ReactNode;
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user || !user.shiv_role) {
    return null;
  }

  // Admin always has full access to UI elements unless specifically omitted
  if (user.shiv_role === 'admin' && (!allowedRoles || allowedRoles.includes('admin'))) {
      return <>{children}</>;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.shiv_role)) {
      return null; // Hide the component
    }
  }

  return <>{children}</>;
}
