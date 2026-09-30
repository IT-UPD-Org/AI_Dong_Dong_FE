import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../layout/PageLoader';

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader content label="Đang kiểm tra phiên đăng nhập..." />;
  }

  if (isAuthenticated) {
    // Nếu đã đăng nhập, tự động vào /chat thay vì xem lại form đăng nhập
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
}
