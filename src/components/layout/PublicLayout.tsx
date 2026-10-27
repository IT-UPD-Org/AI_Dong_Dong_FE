import { useState } from "react";
import { ArrowUpRight, Menu, MessageCircle, X } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export function PublicLayout() {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "Trang chủ" },
    { to: "/donate", label: "Đóng góp" },
    { to: "/approve", label: "Cấp phép ngoài trường" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/10 bg-white/85 px-4 sm:px-6 md:px-12 backdrop-blur-md transition-all">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-extrabold leading-none text-[#04714a] text-base sm:text-lg tracking-tight">
              IT UPD GenAI<span className="text-[#00a86b]">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-black/70 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`transition-colors hover:text-[#04714a] ${
                  location.pathname === link.to ? "font-semibold text-[#04714a]" : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Button & Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {!isLoading && isAuthenticated ? (
              <Link
                to="/chat"
                className="rounded-full bg-[#04714a] px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-[#035e3f] hover:shadow-md flex items-center justify-center gap-1.5"
              >
                <MessageCircle size={15} />
                <span className="hidden xs:inline">Vào phòng chat</span>
                <span className="xs:hidden">Chat</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-[#11130f] px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-[#04714a] hover:shadow-md flex items-center justify-center"
              >
                Đăng nhập <ArrowUpRight className="ml-1 inline" size={15} />
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
              aria-expanded={mobileMenuOpen}
              className="flex size-9 items-center justify-center rounded-xl border border-black/10 text-black/70 transition-colors hover:bg-black/5 md:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav
            aria-label="Điều hướng di động"
            className="border-t border-black/5 py-3 md:hidden animate-in slide-in-from-top-2 duration-200"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-[#e8f7ef] font-semibold text-[#04714a]"
                        : "text-black/70 hover:bg-black/5 hover:text-black"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>
      <Outlet />
    </>
  );
}
