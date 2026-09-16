import { ArrowUpRight } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

export function PublicLayout() {
  const location = useLocation();

  return (
    <>
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between border-b border-black/10 bg-white/80 px-6 backdrop-blur-md md:px-12">
        {/* Logo & Avatar */}
        <Link to="/" className="flex items-center gap-3">
          <div className="size-18 overflow-hidden rounded-full flex items-center justify-center">
            <img
              src="/assets/dongdong_avt_00.png"
              alt="Đông Đông AI Logo"
              className="size-18 max-w-none object-cover scale-125 transition-transform hover:scale-135"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold leading-none text-[#04714a] text-lg">
              ĐÔNG ĐÔNG
            </span>
          </div>
        </Link>

        {/* Menu Điều hướng */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-black/70 md:flex">
          <Link
            to="/"
            className={`transition-colors hover:text-[#04714a] ${
              location.pathname === "/" ? "font-semibold text-[#04714a]" : ""
            }`}
          >
            Trang chủ
          </Link>
          <Link
            to="/donate"
            className={`transition-colors hover:text-[#04714a] ${
              location.pathname === "/donate"
                ? "font-semibold text-[#04714a]"
                : ""
            }`}
          >
            Đóng góp
          </Link>
          <Link
            to="/approve"
            className={`transition-colors hover:text-[#04714a] ${
              location.pathname === "/approve"
                ? "font-semibold text-[#04714a]"
                : ""
            }`}
          >
            Cấp phép ngoài trường
          </Link>
        </nav>

        {/* Nút Đăng nhập */}
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full bg-[#11130f] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#04714a] hover:shadow-md flex items-center justify-center"
          >
            Đăng nhập <ArrowUpRight className="ml-1 inline" size={16} />
          </Link>
        </div>
      </header>
      <Outlet />
    </>
  );
}
