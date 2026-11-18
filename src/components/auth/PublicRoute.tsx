import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // The loading screen is reserved for the landing page.
  if (isLoading) return null;

  if (isAuthenticated) {
    // Nếu đã đăng nhập, tự động vào /chat thay vì xem lại form đăng nhập
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
}
