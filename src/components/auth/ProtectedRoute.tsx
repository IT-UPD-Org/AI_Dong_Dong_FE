import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Chờ AuthContext khởi tạo xong mới quyết định
  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#04714a]" size={32} />
          <p className="text-sm font-medium text-black/60">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Lưu lại trang user muốn vào để redirect về sau khi đăng nhập thành công
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
