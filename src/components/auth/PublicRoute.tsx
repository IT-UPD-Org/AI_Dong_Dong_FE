import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <Loader2 className="animate-spin text-[#04714a]" size={28} />
      </div>
    );
  }

  if (isAuthenticated) {
    // Nếu đã đăng nhập, tự động vào /chat thay vì xem lại form đăng nhập
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
}
