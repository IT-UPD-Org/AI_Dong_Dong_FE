import { useEffect, useRef, useState } from "react";
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
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const accountName = user?.display_name || user?.email || "Tài khoản";

  // Close mobile menu when navigating to another page.
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape and return focus to trigger.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileMenuOpen(false);
        menuTriggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const navLinks = [
    { to: "/", label: t("home") },
    { to: "/map", label: t("navMap") },
    { to: "/donate", label: t("donate") },
    { to: "/approve", label: t("approveAccount") },
  ];

  return (
    <>
      <header
        className={`sticky top-0 ${
          mobileMenuOpen ? "z-40" : "z-30"
        } border-b border-border bg-background/90 px-3 sm:px-6 md:px-10 lg:px-12 safe-top backdrop-blur-md transition-colors`}
      >
        <div className="flex h-14 sm:h-16 w-full min-w-0 items-center justify-between gap-2">
          {/* Logo */}
          <Link to="/" className="flex min-w-0 shrink items-center gap-2">
            <span className="truncate font-extrabold leading-none text-brand-text text-base sm:text-lg tracking-tight">
              IT UPD GenAI<span className="text-brand-bright">.</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 lg:gap-8 text-sm font-medium text-fg-secondary md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`whitespace-nowrap transition-colors hover:text-brand-text ${
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
                  className="flex min-h-10 max-w-[7.5rem] xs:max-w-[10.5rem] sm:max-w-[16rem] items-center gap-1.5 sm:gap-2 rounded-full bg-brand py-1.5 pl-1.5 pr-2.5 sm:pr-4 text-xs sm:text-sm font-semibold text-brand-foreground outline-none transition-all hover:bg-brand-hover hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-popup-open:bg-brand-hover cursor-pointer"
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
                <DropdownMenuContent
                  align="end"
                  sideOffset={8}
                  className="z-50 w-56 rounded-xl p-1.5"
                >
                  <div className="px-2 pb-2 pt-1.5">
                    <p className="truncate text-sm font-semibold text-foreground">{accountName}</p>
                    {user?.display_name && user.email && (
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
                className="flex min-h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-foreground px-3 py-2 sm:px-5 sm:py-2 text-xs sm:text-sm font-semibold text-background transition-all hover:bg-brand hover:text-brand-foreground hover:shadow-md"
              >
                <span>{t("login")}</span>
                <ArrowUpRight className="ml-1 inline shrink-0" size={14} />
              </Link>
            )}

            {/* Mobile menu button (>= 44x44px touch target) */}
            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? t("closeMenu") : t("openMenu")}
              aria-expanded={mobileMenuOpen}
              aria-controls="public-mobile-nav"
              className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-fg-secondary transition-colors hover:bg-hover md:hidden cursor-pointer"
            >
              {mobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <nav
            id="public-mobile-nav"
            aria-label="Điều hướng di động"
            className="border-t border-border-subtle py-3 md:hidden animate-in slide-in-from-top-2 duration-200 bg-surface/95 -mx-3 px-3 sm:-mx-6 sm:px-6 shadow-lg"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex min-h-11 items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-brand-soft font-semibold text-brand-text"
                        : "text-fg-secondary hover:bg-hover hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Placed below nav links so LanguageToggle's upward popup stays inside the viewport */}
              <div className="mt-1 flex items-center justify-between border-t border-border-subtle px-3 pt-2.5 sm:hidden">
                <span className="text-xs text-muted-foreground font-mono uppercase">
                  {t("preferences")}
                </span>
                <div className="flex items-center gap-1">
                  <LanguageToggle />
                </div>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Dimmed backdrop when public mobile menu is open */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-overlay/70 backdrop-blur-[1px] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <Outlet />
    </>
  );
}
