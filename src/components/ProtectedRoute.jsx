import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) {
    // Remember where they were going, so we can redirect after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (!profile || !profile.role) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
