import { Bot, FolderOpen, Inbox, MessagesSquare, Server, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { ChatsTab } from "./ChatsTab";
import { FilesTab } from "./FilesTab";
import { ModelsTab } from "./ModelsTab";
import { ProvidersTab } from "./ProvidersTab";
import { RequestsTab } from "./RequestsTab";
import { UsersTab } from "./UsersTab";

const TABS = [
  { id: "users", label: "Người dùng", Icon: Users, Component: UsersTab },
  { id: "requests", label: "Yêu cầu", Icon: Inbox, Component: RequestsTab },
  { id: "files", label: "Tệp", Icon: FolderOpen, Component: FilesTab },
  { id: "chats", label: "Trò chuyện", Icon: MessagesSquare, Component: ChatsTab },
  { id: "models", label: "Models", Icon: Bot, Component: ModelsTab },
  { id: "providers", label: "Providers", Icon: Server, Component: ProvidersTab },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function AdminPage() {
  // Keep the active tab in the URL so it survives reloads and can be linked.
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const active: TabId = TABS.some((t) => t.id === requested) ? (requested as TabId) : "users";
  const { Component } = TABS.find((t) => t.id === active)!;

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8">
      <p className="font-mono text-xs uppercase tracking-[.18em] text-[#04714a]">Quản trị</p>
      <h1 className="mt-3 mb-6 text-3xl sm:text-5xl font-bold tracking-[-.07em]">Dashboard</h1>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-black/10">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setParams({ tab: id }, { replace: true })}
            className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
              active === id
                ? "border-[#04714a] font-semibold text-[#013422]"
                : "border-transparent text-black/55 hover:text-[#04714a]"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* Keyed so switching tabs remounts and refetches fresh data. */}
      <Component key={active} />
    </main>
  );
}
