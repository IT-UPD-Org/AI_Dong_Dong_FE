import { ArrowUpRight, MessageCircle } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function PublicLayout() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between gap-x-3 border-b border-black/10 bg-white/80 px-5 backdrop-blur-md md:px-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-base font-bold leading-none text-[#04714a] md:text-lg">
              IT UPD GenAI
            </span>
          </div>
        </Link>

        {/* Menu Điều hướng */}
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-8 text-sm font-medium md:flex">
          {[
            { path: "/", label: "Trang chủ" },
            { path: "/donate", label: "Đóng góp" },
            { path: "/approve", label: "Cấp phép ngoài trường" },
          ].map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? "page" : undefined}
                className={`group relative py-1 transition-colors duration-200 ${
                  isActive
                    ? "font-semibold text-[#04714a]"
                    : "text-black/70 hover:text-[#04714a]"
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-1 left-0 h-[2.5px] w-full rounded-full bg-[#04714a] transition-all duration-300 ease-out origin-left ${
                    isActive
                      ? "scale-x-100 opacity-100"
                      : "scale-x-0 opacity-0 group-hover:scale-x-100 group-hover:opacity-100"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        {/* Nút hành động: thay đổi theo trạng thái đăng nhập */}
        <div className="flex items-center gap-3">
          {!isLoading && isAuthenticated ? (
            <Link
              to="/chat"
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[#04714a] px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#035e3f] hover:shadow-md md:px-5 md:text-sm"
            >
              <MessageCircle size={15} />
              Vào phòng chat
            </Link>
          ) : (
            <Link
              to="/login"
              className="flex min-h-11 items-center justify-center rounded-full bg-[#11130f] px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-[#04714a] hover:shadow-md md:px-5 md:text-sm"
            >
              Đăng nhập <ArrowUpRight className="ml-1 inline" size={16} />
            </Link>
          )}
        </div>
      </header>
      <Outlet />
    </>
  );
}
