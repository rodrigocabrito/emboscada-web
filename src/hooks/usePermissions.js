import { useAuth } from '../context/AuthContext';

// Single place for the role → capability matrix.
//  admin           → everything
//  monitor_leader  → session line items + payments
//  monitor         → session line items only
export const usePermissions = () => {
  const { profile, isAdmin } = useAuth();
  const role = profile?.role;
  return {
    role,
    isAdmin,
    canEditSessionData: role === 'admin',
    canPay: role === 'admin' || role === 'monitor_leader',
    canEditLineItems: role === 'admin' || role === 'monitor_leader' || role === 'monitor',
  };
};
