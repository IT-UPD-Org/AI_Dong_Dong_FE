import { useEffect, useRef, useState, type SVGProps } from "react";
import { NavLink, Outlet, useLocation, useMatch, useNavigate } from "react-router-dom";
import {
  ChevronsUpDown,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  SquarePen,
  X,
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import { chatApi } from "../../api/chat.api";
import type { Conversation } from "../../api/types";
import { useDeleteChat } from "../../lib/deleteChat";
import { DocumentProcessingNotifications } from "./DocumentProcessingNotifications";
import { useLanguage } from "../../contexts/LanguageContext";
import { ThemeToggle, LanguageToggle } from "../theme/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

const BaseIcon = ({ size = 16, ...props }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  />
);

const HistoryIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 7v5l3 2" />
  </BaseIcon>
);

const BookOpenIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M2 5.5A2.5 2.5 0 0 1 4.5 3H20v15H4.5A2.5 2.5 0 0 0 2 20.5v-15Z" />
    <path d="M2 18.5A2.5 2.5 0 0 1 4.5 16H20" />
    <path d="M7 7h6" />
    <path d="M7 11h10" />
  </BaseIcon>
);

const FileTextIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6" />
    <path d="M9 17h6" />
  </BaseIcon>
);

const UsersIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" />
    <circle cx="10" cy="7" r="3" />
    <path d="M22 19v-1a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </BaseIcon>
);

const ShieldCheckIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="m9 12 2 2 4-4" />
  </BaseIcon>
);

const OrbitIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <circle cx="12" cy="12" r="3" />
    <circle cx="19" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <path d="M10.4 21.9a10 10 0 0 0 9.94-8.4" />
    <path d="M13.6 2.1a10 10 0 0 0-9.94 8.4" />
  </BaseIcon>
);

const Trash2Icon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
  </BaseIcon>
);

const SettingsIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.84l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.1.4l-.09.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2.8a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0 .4-1.1V7.4a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 9.4 8.6a1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.1-.4l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 15 9.4a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.09a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.1.4 1.7 1.7 0 0 0-.4 1Z" />
  </BaseIcon>
);

const UserRoundIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </BaseIcon>
);

const PlusIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </BaseIcon>
);

const LogOutIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </BaseIcon>
);

const ChevronDownIcon = ({ size = 14, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="m6 9 6 6 6-6" />
  </BaseIcon>
);

const ChevronUpIcon = ({ size = 14, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="m18 15-6-6-6 6" />
  </BaseIcon>
);

const MoreHorizontalIcon = ({ size = 16, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
    <circle cx="5" cy="12" r="1.5" />
  </BaseIcon>
);

const MapPinIcon = ({ size, ...props }: IconProps) => (
  <BaseIcon size={size} {...props}>
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </BaseIcon>
);

const SIDEBAR_COLLAPSED_KEY = "app_sidebar_collapsed";

const MORE_NAV_PATHS = [
  "/map",
  "/contributors",
  "/admin",
  "/knowledge",
  "/chat/career-universe",
] as const;

function isGenericTitle(title?: string): boolean {
  if (!title) return true;
  const lower = title.trim().toLowerCase();
  return (
    lower === "new conversation" ||
    lower === "cuộc trò chuyện mới" ||
    lower === "cuộc trò chuyện" ||
    lower === "new chat"
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  // The shell sits above the routes, so it reads the chat ID from the path itself.
  const currentChatId = useMatch("/c/:id")?.params.id ?? null;
  const { user, isAdmin, logout } = useAuth();
  const canManageKnowledge = user?.role === "teacher" || user?.role === "admin";
  const [recentChats, setRecentChats] = useState<Conversation[]>([]);
  const [promptSnippets, setPromptSnippets] = useState<Record<string, string>>(
    {},
  );
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    } catch {
      return false;
    }
  });
  const mobileMenuTriggerRef = useRef<HTMLButtonElement>(null);

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const loadRecentChats = async () => {
    try {
      const chats = await chatApi.getConversations(1);
      setRecentChats(chats);

      // Với các chat chưa có nội dung tiêu đề câu hỏi đầu tiên, tự động tìm và cập nhật
      chats.forEach((chat) => {
        const cached = localStorage.getItem(`chat_first_prompt_${chat.id}`);
        if (cached) {
          setPromptSnippets((prev) => ({ ...prev, [chat.id]: cached }));
        } else if (isGenericTitle(chat.title)) {
          chatApi
            .getConversation(chat.id)
            .then((detail) => {
              const userMsg = detail.messages?.find((m: any) => {
                if (m.type === "user" && m.content) return true;
                if (m.role === "user" && m.content) return true;
                return false;
              });
              if (userMsg && userMsg.content) {
                const cleaned = userMsg.content.trim().replace(/\s+/g, " ");
                const snippet =
                  cleaned.length > 40 ? cleaned.slice(0, 40) + "..." : cleaned;
                try {
                  localStorage.setItem(`chat_first_prompt_${chat.id}`, snippet);
                } catch {
                  // ignore
                }
                setPromptSnippets((prev) => ({ ...prev, [chat.id]: snippet }));
                chatApi.patchTitle(chat.id, snippet).catch(() => {});
              }
            })
            .catch(() => {});
        }
      });
    } catch {
      setRecentChats([]);
    }
  };

  useEffect(() => {
    loadRecentChats();

    const handleChatsUpdated = (e: Event) => {
      const custom = e as CustomEvent<{
        conversationId?: string;
        prompt?: string;
      }>;
      if (custom.detail?.conversationId && custom.detail?.prompt) {
        const cleaned = custom.detail.prompt.trim().replace(/\s+/g, " ");
        const snippet =
          cleaned.length > 40 ? cleaned.slice(0, 40) + "..." : cleaned;
        try {
          localStorage.setItem(
            `chat_first_prompt_${custom.detail.conversationId}`,
            snippet,
          );
        } catch {
          // ignore
        }
        setPromptSnippets((prev) => ({
          ...prev,
          [custom.detail!.conversationId!]: snippet,
        }));
      }
      loadRecentChats();
    };

    window.addEventListener("chats:updated", handleChatsUpdated);
    return () =>
      window.removeEventListener("chats:updated", handleChatsUpdated);
  }, []);

  const location = useLocation();
  const isMapRoute = location.pathname === "/map";
  const isViewportLockedRoute =
    location.pathname === "/chat" ||
    location.pathname.startsWith("/c/") ||
    location.pathname === "/chat/career-universe" ||
    isMapRoute;

  const isMoreActive = MORE_NAV_PATHS.some(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
  );

  // "Thêm..." expands the extra nav items in place; it opens by itself on one of their pages.
  const [isMoreOpen, setIsMoreOpen] = useState(() => isMoreActive);

  useEffect(() => {
    if (isMoreActive) {
      setIsMoreOpen(true);
    }
  }, [location.pathname, isMoreActive]);

  // Close mobile drawer automatically on route change.
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [location.pathname]);

  // Close mobile drawer on Escape and restore focus to the trigger button.
  useEffect(() => {
    if (!mobileDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileDrawerOpen(false);
        mobileMenuTriggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileDrawerOpen]);

  const handleLogout = async () => {
    setMobileDrawerOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

  const handleNewChat = () => {
    setMobileDrawerOpen(false);
    navigate("/chat", { state: { newChatKey: crypto.randomUUID() } });
  };

  const { requestDelete: handleDeleteChat, dialog: deleteChatDialog } =
    useDeleteChat((id) => {
      // Leaving a chat that no longer exists.
      if (currentChatId === id)
        navigate("/chat", { state: { newChatKey: crypto.randomUUID() } });
    });

  /** Shared look of the sidebar links, adapting smoothly when desktop rail is collapsed. */
  const sideNavClass = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 md:min-h-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
      sidebarCollapsed ? "md:justify-center md:px-0" : ""
    } ${
      isActive
        ? "bg-brand-soft font-semibold text-brand-text"
        : "text-fg-secondary hover:bg-brand-soft hover:text-brand-text"
    }`;

  // Resolve active chat title or localized route title for the compact mobile top bar.
  const activeConversation = currentChatId
    ? recentChats.find((c) => c.id === currentChatId)
    : undefined;
  const activeChatTitle = currentChatId
    ? promptSnippets[currentChatId] ||
      (activeConversation && !isGenericTitle(activeConversation.title)
        ? activeConversation.title
        : undefined)
    : undefined;

  const mobilePageTitle = (() => {
    if (location.pathname === "/chat/career-universe") return t("navCareerUniverse");
    if (location.pathname === "/map") return t("navMap");
    if (location.pathname === "/history") return t("navHistory");
    if (location.pathname === "/documents") return t("navDocuments");
    if (location.pathname === "/knowledge") return t("navKnowledge");
    if (location.pathname === "/contributors") return t("navContributors");
    if (location.pathname.startsWith("/admin")) return t("navAdmin");
    if (location.pathname === "/profile") return t("profile");
    if (location.pathname === "/settings") return t("settings");
    if (activeChatTitle) return activeChatTitle;
    return null;
  })();

  return (
    <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground transition-colors md:flex-row">
      {/* Mobile Top Bar (< md): pushes navigation & sidebar trigger to the top so the bottom stays clear for the AI prompt dock */}
      <header className="relative z-30 flex shrink-0 flex-col border-b border-border bg-surface/95 backdrop-blur-md safe-top md:hidden transition-colors">
        <div className="flex h-14 w-full min-w-0 items-center justify-between gap-2 px-2">
          <button
            ref={mobileMenuTriggerRef}
            type="button"
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
            aria-label={mobileDrawerOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={mobileDrawerOpen}
            aria-controls="app-sidebar-drawer"
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-fg-secondary transition-colors hover:bg-hover hover:text-foreground active:bg-active cursor-pointer"
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          <div className="flex min-w-0 flex-1 items-center justify-center px-1">
            {mobilePageTitle ? (
              <span className="truncate text-sm font-bold tracking-tight text-foreground">
                {mobilePageTitle}
              </span>
            ) : (
              <NavLink
                to="/"
                className="truncate text-base font-extrabold tracking-tight text-foreground"
              >
                IT UPD GenAI<span className="text-brand-bright">.</span>
              </NavLink>
            )}
          </div>

          <button
            type="button"
            onClick={handleNewChat}
            aria-label={t("newChat")}
            title={t("newChat")}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-fg-secondary transition-colors hover:bg-brand-soft hover:text-brand-text active:bg-active cursor-pointer"
          >
            <SquarePen size={19} aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop (< md only) */}
      {mobileDrawerOpen && (
        <div
          data-testid="mobile-sidebar-backdrop"
          className="fixed inset-0 z-40 bg-overlay backdrop-blur-[2px] md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Unified Sidebar: Off-canvas slide-over drawer on mobile (< md), collapsible rail on desktop (>= md) */}
      <aside
        id="app-sidebar-drawer"
        aria-label="Điều hướng chính"
        className={`fixed inset-y-0 left-0 z-40 flex h-[100dvh] w-[min(20rem,86vw)] max-w-[320px] shrink-0 flex-col border-r border-border bg-surface px-4 pt-[calc(env(safe-area-inset-top,0px)_+_1.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)_+_1.25rem)] shadow-2xl transition-[transform,width,padding] duration-200 ease-out md:static md:z-auto md:h-full md:max-w-none md:translate-x-0 md:pt-7 md:pb-5 md:shadow-none ${
          mobileDrawerOpen
            ? "translate-x-0 visible pointer-events-auto"
            : "-translate-x-full invisible pointer-events-none md:visible md:pointer-events-auto"
        } ${sidebarCollapsed ? "md:w-[4.5rem] md:px-2.5" : "md:w-64 md:px-4"}`}
      >
        {/* Sidebar Header: Brand + Mobile Close / Desktop Collapse */}
        <div
          className={`mb-5 flex shrink-0 items-center gap-2 pt-1 ${
            sidebarCollapsed ? "md:flex-col md:justify-center" : "justify-between"
          }`}
        >
          <NavLink
            to="/"
            onClick={() => setMobileDrawerOpen(false)}
            title="IT UPD GenAI"
            className={`truncate text-lg font-extrabold text-foreground ${
              sidebarCollapsed ? "md:text-center md:text-base" : ""
            }`}
          >
            <span className={sidebarCollapsed ? "md:hidden" : ""}>
              IT UPD GenAI<span className="text-brand-bright">.</span>
            </span>
            {sidebarCollapsed && (
              <span className="hidden md:inline">
                IT<span className="text-brand-bright">.</span>
              </span>
            )}
          </NavLink>

          {/* Mobile Close Button (>= 44x44px touch target) */}
          <button
            type="button"
            onClick={() => {
              setMobileDrawerOpen(false);
              mobileMenuTriggerRef.current?.focus();
            }}
            aria-label={t("closeMenu")}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-fg-secondary transition-colors hover:bg-hover hover:text-foreground md:hidden cursor-pointer"
          >
            <X size={20} aria-hidden="true" />
          </button>

          {/* Desktop Collapse / Expand Toggle */}
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            aria-label={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
            aria-expanded={!sidebarCollapsed}
            title={sidebarCollapsed ? "Mở rộng thanh bên" : "Thu gọn thanh bên"}
            className="hidden size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-hover hover:text-foreground md:flex cursor-pointer"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={16} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={16} aria-hidden="true" />
            )}
          </button>
        </div>

        {/* New Chat CTA */}
        <button
          type="button"
          onClick={handleNewChat}
          title={t("newChat")}
          className={`mb-4 flex min-h-11 md:min-h-0 w-full shrink-0 items-center gap-2 rounded-full bg-foreground px-3 py-2.5 text-left text-sm font-medium text-background transition-all hover:bg-brand hover:text-brand-foreground shadow-xs cursor-pointer ${
            sidebarCollapsed ? "md:justify-center md:px-0" : ""
          }`}
        >
          <PlusIcon size={16} strokeWidth={2} className="shrink-0" />
          <span className={`truncate ${sidebarCollapsed ? "md:hidden" : ""}`}>
            {t("newChat")}
          </span>
        </button>

        {/* Primary Navigation */}
        <nav className="flex shrink-0 flex-col gap-1">
          {/* Lịch sử */}
          <NavLink
            to="/history"
            title={t("navHistory")}
            onClick={() => setMobileDrawerOpen(false)}
            className={sideNavClass}
          >
            <HistoryIcon size={17} className="shrink-0" />
            <span className={`truncate ${sidebarCollapsed ? "md:hidden" : ""}`}>
              {t("navHistory")}
            </span>
          </NavLink>

          {/* Tài liệu */}
          <NavLink
            to="/documents"
            title={t("navDocuments")}
            onClick={() => setMobileDrawerOpen(false)}
            className={sideNavClass}
          >
            <FileTextIcon size={17} className="shrink-0" />
            <span className={`truncate ${sidebarCollapsed ? "md:hidden" : ""}`}>
              {t("navDocuments")}
            </span>
          </NavLink>

          {/* Thêm...: expands the extra items in this same list; a small "Ẩn" at the end folds them back. */}
          {isMoreOpen ? (
            <>
              <NavLink
                to="/map"
                title={t("navMap")}
                onClick={() => setMobileDrawerOpen(false)}
                className={sideNavClass}
              >
                <MapPinIcon size={17} className="shrink-0" />
                <span className={`truncate ${sidebarCollapsed ? "md:hidden" : ""}`}>
                  {t("navMap")}
                </span>
              </NavLink>

              {canManageKnowledge && (
                <NavLink
                  to="/knowledge"
                  title={t("navKnowledge")}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={sideNavClass}
                >
                  <BookOpenIcon size={17} className="shrink-0" />
                  <span className={`truncate ${sidebarCollapsed ? "md:hidden" : ""}`}>
                    {t("navKnowledge")}
                  </span>
                </NavLink>
              )}

              <NavLink
                to="/chat/career-universe"
                onClick={() => setMobileDrawerOpen(false)}
                className={sideNavClass}
                title="Khám phá tiềm năng nghề nghiệp của bạn"
              >
                <OrbitIcon size={17} className="shrink-0" />
                <span className={`truncate ${sidebarCollapsed ? "md:hidden" : ""}`}>
                  {t("navCareerUniverse")}
                </span>
              </NavLink>

              <NavLink
                to="/contributors"
                title={t("navContributors")}
                onClick={() => setMobileDrawerOpen(false)}
                className={sideNavClass}
              >
                <UsersIcon size={17} className="shrink-0" />
                <span className={`truncate ${sidebarCollapsed ? "md:hidden" : ""}`}>
                  {t("navContributors")}
                </span>
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/admin"
                  title={t("navAdmin")}
                  onClick={() => setMobileDrawerOpen(false)}
                  className={sideNavClass}
                >
                  <ShieldCheckIcon size={17} className="shrink-0" />
                  <span className={`truncate ${sidebarCollapsed ? "md:hidden" : ""}`}>
                    {t("navAdmin")}
                  </span>
                </NavLink>
              )}

              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                aria-expanded="true"
                title={t("navLess")}
                className={`ml-auto flex min-h-9 md:min-h-0 items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-brand-text focus-visible:ring-2 focus-visible:ring-ring cursor-pointer outline-none ${
                  sidebarCollapsed ? "md:mx-auto" : ""
                }`}
              >
                <ChevronUpIcon size={12} />
                <span className={sidebarCollapsed ? "md:hidden" : ""}>
                  {t("navLess")}
                </span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              aria-expanded="false"
              title={t("navMore")}
              className={`flex min-h-11 md:min-h-0 w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                sidebarCollapsed ? "md:justify-center md:px-0" : ""
              } ${
                isMoreActive
                  ? "bg-brand-soft font-semibold text-brand-text"
                  : "text-fg-secondary hover:bg-brand-soft hover:text-brand-text"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <MoreHorizontalIcon size={17} className="shrink-0" />
                <span className={`truncate ${sidebarCollapsed ? "md:hidden" : ""}`}>
                  {t("navMore")}
                </span>
              </div>
              <ChevronDownIcon
                size={14}
                className={`opacity-60 shrink-0 ${sidebarCollapsed ? "md:hidden" : ""}`}
              />
            </button>
          )}
        </nav>

        {/* Section: GẦN ĐÂY (Recent) — hidden on collapsed desktop rail, always shown on mobile drawer */}
        <div
          className={`mt-5 flex min-h-0 flex-1 flex-col ${
            sidebarCollapsed ? "md:hidden" : ""
          }`}
        >
          <p className="mb-2 shrink-0 px-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            {t("recent")}
          </p>

          <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto [scrollbar-width:thin]">
            {recentChats.length === 0 ? (
              <p className="px-2 py-3 text-xs text-muted-foreground italic">
                {t("noRecentChats")}
              </p>
            ) : (
              recentChats.map((conversation) => {
                const isCurrent = currentChatId === conversation.id;
                const cachedSnippet =
                  promptSnippets[conversation.id] ||
                  (typeof window !== "undefined"
                    ? localStorage.getItem(
                        `chat_first_prompt_${conversation.id}`,
                      )
                    : null);
                const displayTitle =
                  cachedSnippet ||
                  (!isGenericTitle(conversation.title)
                    ? conversation.title
                    : t("newChat"));

                return (
                  <div key={conversation.id} className="group relative">
                    <NavLink
                      to={`/c/${conversation.id}`}
                      onClick={() => setMobileDrawerOpen(false)}
                      title={displayTitle}
                      className={`flex min-h-11 md:min-h-0 w-full min-w-0 items-center truncate rounded-lg py-2 pl-2.5 pr-10 md:pr-8 text-left text-xs transition-colors ${
                        isCurrent
                          ? "bg-brand-soft font-semibold text-brand-text"
                          : "text-fg-secondary hover:bg-brand-soft hover:text-brand-text"
                      }`}
                    >
                      <span className="truncate">{displayTitle}</span>
                    </NavLink>
                    <button
                      type="button"
                      aria-label={`${t("delete")} ${displayTitle}`}
                      title={t("delete")}
                      onClick={() =>
                        handleDeleteChat(conversation.id, displayTitle)
                      }
                      className="absolute right-1 top-1/2 flex size-9 md:size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-70 transition-opacity hover:bg-destructive/10 hover:text-destructive focus:opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                    >
                      <Trash2Icon size={13} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Spacer when desktop rail is collapsed so user controls stay pinned at the bottom */}
        {sidebarCollapsed && <div className="hidden flex-1 md:block" />}

        {/* User Card, Controls & Logout */}
        <div className="mt-3 flex shrink-0 flex-col gap-2 border-t border-border pt-3">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`Menu tài khoản ${user.display_name || user.email}`}
                className={`flex min-h-11 md:min-h-0 w-full items-center gap-2.5 rounded-xl bg-muted px-2 py-1.5 text-left outline-none transition-colors hover:bg-brand-soft focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-brand-soft cursor-pointer ${
                  sidebarCollapsed ? "md:justify-center md:px-0" : ""
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-text font-bold text-xs">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                <div
                  className={`flex min-w-0 flex-1 flex-col ${
                    sidebarCollapsed ? "md:hidden" : ""
                  }`}
                >
                  <span className="truncate text-xs font-semibold text-foreground">
                    {user.display_name || user.email}
                  </span>
                  <span className="truncate text-[10px] text-muted-foreground">
                    {user.role === "teacher"
                      ? t("roleTeacher")
                      : user.role === "admin"
                        ? t("roleAdmin")
                        : t("roleStudent")}
                  </span>
                </div>
                <ChevronsUpDown
                  size={14}
                  aria-hidden="true"
                  className={`shrink-0 text-muted-foreground ${
                    sidebarCollapsed ? "md:hidden" : ""
                  }`}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                sideOffset={8}
                className="w-56 rounded-xl border border-border bg-elevated p-1.5 shadow-xl text-foreground z-50"
              >
                <DropdownMenuItem
                  render={<NavLink to="/profile" onClick={() => setMobileDrawerOpen(false)} />}
                  className="gap-2.5 rounded-lg px-2 py-2 text-xs"
                >
                  <UserRoundIcon size={15} />
                  {t("profile")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  render={<NavLink to="/settings" onClick={() => setMobileDrawerOpen(false)} />}
                  className="gap-2.5 rounded-lg px-2 py-2 text-xs"
                >
                  <SettingsIcon size={15} />
                  {t("settings")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleLogout}
                  className="gap-2.5 rounded-lg px-2 py-2 text-xs"
                >
                  <LogOutIcon size={15} />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Quick controls row: Language, Theme, Profile, Logout */}
          <div
            className={`flex items-center justify-between px-1 pt-0.5 ${
              sidebarCollapsed ? "md:flex-col md:gap-1 md:px-0" : ""
            }`}
          >
            <div
              className={`flex items-center gap-1 ${
                sidebarCollapsed ? "md:flex-col" : ""
              }`}
            >
              <span className={sidebarCollapsed ? "md:hidden" : ""}>
                <LanguageToggle />
              </span>
              <ThemeToggle />
            </div>
            <div
              className={`flex items-center gap-1 ${
                sidebarCollapsed ? "md:hidden" : ""
              }`}
            >
              <NavLink
                to="/profile"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex size-10 md:size-9 items-center justify-center rounded-lg text-fg-secondary transition-colors hover:bg-hover hover:text-foreground"
                title={t("profile")}
                aria-label={t("profile")}
              >
                <UserRoundIcon size={16} />
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                className="flex size-10 md:size-9 items-center justify-center rounded-lg text-fg-secondary transition-colors hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                title={t("logout")}
                aria-label={t("logout")}
              >
                <LogOutIcon size={16} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Viewport: clean flex-1 min-h-0 min-w-0 so child pages fill exact remaining height */}
      <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
        <main
          className={
            isViewportLockedRoute
              ? "relative flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden"
              : "relative flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden safe-bottom"
          }
        >
          {isMapRoute ? (
            <div className="h-full min-h-0 w-full min-w-0 p-2 sm:p-3 md:p-4">
              <Outlet />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <DocumentProcessingNotifications />
      {deleteChatDialog}
    </div>
  );
}
