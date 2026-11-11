import { useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  LogOut,
  Menu,
  MessageCircle,
  UserRound,
  X,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { ThemeToggle, LanguageToggle } from "../theme/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function PublicLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountName = user?.name || user?.email || "Tài khoản";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navLinks = [
    { to: "/", label: t("home") },
    { to: "/donate", label: t("donate") },
    { to: "/approve", label: t("approveAccount") },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 px-3 sm:px-6 md:px-12 backdrop-blur-md transition-colors">
        <div className="flex h-16 sm:h-20 items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex min-w-0 shrink items-center gap-2">
            <span className="truncate font-extrabold leading-none text-brand-text text-base sm:text-lg tracking-tight">
              IT UPD GenAI<span className="text-brand-bright">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 text-sm font-medium text-fg-secondary md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`transition-colors hover:text-brand-text ${
                  location.pathname === link.to
                    ? "font-semibold text-brand-text"
                    : ""
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Action Button & Mobile Menu Toggle */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <span className="hidden sm:flex">
              <LanguageToggle />
            </span>
            <ThemeToggle />

            {!isLoading && isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={`Tài khoản ${accountName}`}
                  className="flex max-w-[8.5rem] xs:max-w-[11rem] sm:max-w-[16rem] items-center gap-1.5 sm:gap-2 rounded-full bg-brand py-1.5 pl-1.5 pr-2.5 sm:pr-4 text-xs sm:text-sm font-semibold text-brand-foreground outline-none transition-all hover:bg-brand-hover hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-popup-open:bg-brand-hover cursor-pointer"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-full bg-brand-hover text-brand-foreground text-[11px] font-bold"
                  >
                    {accountName.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{accountName}</span>
                  <ChevronDown size={14} aria-hidden="true" className="shrink-0 opacity-80" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl p-1.5">
                  <div className="px-2 pb-2 pt-1.5">
                    <p className="truncate text-sm font-semibold text-foreground">{accountName}</p>
                    {user?.name && user.email && (
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem render={<Link to="/chat" />} className="gap-2.5 rounded-lg px-2 py-2 text-sm">
                    <MessageCircle size={15} />
                    {t("enterChat")}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link to="/profile" />} className="gap-2.5 rounded-lg px-2 py-2 text-sm">
                    <UserRound size={15} />
                    {t("profile")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleLogout}
                    className="gap-2.5 rounded-lg px-2 py-2 text-sm"
                  >
                    <LogOut size={15} />
                    {t("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-foreground px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-background transition-all hover:bg-brand hover:text-brand-foreground hover:shadow-md flex items-center justify-center"
              >
                {t("login")} <ArrowUpRight className="ml-1 inline" size={15} />
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={mobileMenuOpen}
              className="flex size-9 items-center justify-center rounded-xl border border-border text-fg-secondary transition-colors hover:bg-hover md:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav
            aria-label="Điều hướng di động"
            className="border-t border-border-subtle py-3 md:hidden animate-in slide-in-from-top-2 duration-200 bg-surface"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between px-3 py-1 mb-1 border-b border-border-subtle sm:hidden">
                <span className="text-xs text-muted-foreground font-mono uppercase">
                  {t("preferences")}
                </span>
                <div className="flex items-center gap-1">
                  <LanguageToggle />
                </div>
              </div>
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-soft font-semibold text-brand-text"
                        : "text-fg-secondary hover:bg-hover hover:text-foreground"
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
