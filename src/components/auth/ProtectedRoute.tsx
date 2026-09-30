import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PageLoader } from '../layout/PageLoader';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Chờ AuthContext khởi tạo xong mới quyết định
  if (isLoading) {
    return <PageLoader label="Đang kiểm tra quyền truy cập..." />;
  }

  if (!isAuthenticated) {
    // Lưu lại trang user muốn vào để redirect về sau khi đăng nhập thành công
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
