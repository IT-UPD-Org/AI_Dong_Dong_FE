import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Hide admin pages from non-admins. This is only a UX guard; the backend
 * enforces admin access on every `/admin` endpoint.
 */
export function AdminRoute() {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/chat" replace />;
  }
  return <Outlet />;
}
