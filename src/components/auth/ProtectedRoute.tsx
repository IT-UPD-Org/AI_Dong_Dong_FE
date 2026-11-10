import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Chờ AuthContext khởi tạo xong mới quyết định. The loading screen is
  // reserved for the landing page, so render nothing during the brief check.
  if (isLoading) return null;

  if (!isAuthenticated) {
    // Lưu lại trang user muốn vào để redirect về sau khi đăng nhập thành công
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Accounts not yet approved can only use /approve (request access, see their request).
  // Admins keep access unless disabled; the backend enforces the same rule.
  if (user && user.role !== 'admin' && user.state !== 'active') {
    return <Navigate to="/approve" replace />;
  }

  return <Outlet />;
}
