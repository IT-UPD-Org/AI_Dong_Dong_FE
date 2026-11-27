import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";
import { AppShell } from "../components/layout/AppShell";

const mockLogout = vi.fn();
let mockAuth: Record<string, unknown>;

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => mockAuth,
}));

vi.mock("../api/chat.api", () => ({
  chatApi: {
    getConversations: vi.fn().mockResolvedValue([]),
    getConversation: vi.fn(),
    patchTitle: vi.fn(),
  },
}));

vi.mock("../components/layout/DocumentProcessingNotifications", () => ({
  DocumentProcessingNotifications: () => null,
}));

const student = {
  id: "1",
  email: "524100098@pduni.edu.vn",
  display_name: "Nguyễn Dương",
  role: "student",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLogout.mockResolvedValue(undefined);
  mockAuth = {
    user: student,
    isAuthenticated: true,
    isAdmin: false,
    isLoading: false,
    logout: mockLogout,
  };
});

describe("PublicLayout account menu", () => {
  const renderPublic = () =>
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<div>home</div>} />
          </Route>
          <Route path="/login" element={<div>login screen</div>} />
        </Routes>
      </MemoryRouter>
    );

  it("shows the account name and opens a menu with chat, profile and logout", async () => {
    const user = userEvent.setup();
    renderPublic();

    const trigger = screen.getByRole("button", { name: /Tài khoản Nguyễn Dương/i });
    expect(trigger).toHaveTextContent("Nguyễn Dương");
    expect(screen.queryByRole("menuitem", { name: /Đăng xuất/i })).not.toBeInTheDocument();

    await user.click(trigger);

    expect(await screen.findByRole("menuitem", { name: /Vào phòng chat/i })).toHaveAttribute("href", "/chat");
    expect(screen.getByRole("menuitem", { name: /Hồ sơ cá nhân/i })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("menuitem", { name: /Đăng xuất/i })).toBeInTheDocument();
  });

  it("logs out and goes to the login page", async () => {
    const user = userEvent.setup();
    renderPublic();

    await user.click(screen.getByRole("button", { name: /Tài khoản Nguyễn Dương/i }));
    await user.click(await screen.findByRole("menuitem", { name: /Đăng xuất/i }));

    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("login screen")).toBeInTheDocument();
  });

  it("keeps the login link for logged-out visitors", () => {
    mockAuth = { ...mockAuth, user: null, isAuthenticated: false };
    renderPublic();

    expect(screen.getByRole("link", { name: /Đăng nhập/i })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: /Tài khoản/i })).not.toBeInTheDocument();
  });
});

describe("AppShell sidebar account menu", () => {
  const renderShell = () =>
    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/chat" element={<div>chat page</div>} />
            <Route path="/profile" element={<div>profile page</div>} />
          </Route>
          <Route path="/login" element={<div>login screen</div>} />
        </Routes>
      </MemoryRouter>
    );

  it("hides profile, settings and logout until the account card is opened", async () => {
    const user = userEvent.setup();
    renderShell();

    const card = screen.getByRole("button", { name: /Menu tài khoản Nguyễn Dương/i });
    expect(card).toHaveTextContent("Sinh viên");
    expect(screen.queryByRole("menuitem")).not.toBeInTheDocument();

    await user.click(card);

    expect(await screen.findByRole("menuitem", { name: /Hồ sơ cá nhân/i })).toHaveAttribute("href", "/profile");
    expect(screen.getByRole("menuitem", { name: /Cài đặt/i })).toHaveAttribute("href", "/settings");
    expect(screen.getByRole("menuitem", { name: /Đăng xuất/i })).toBeInTheDocument();
  });

  it("opens with the keyboard and logs out", async () => {
    const user = userEvent.setup();
    renderShell();

    screen.getByRole("button", { name: /Menu tài khoản Nguyễn Dương/i }).focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: /Đăng xuất/i })).toBeInTheDocument();

    await user.click(screen.getByRole("menuitem", { name: /Đăng xuất/i }));
    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
    expect(await screen.findByText("login screen")).toBeInTheDocument();
  });

  describe("More navigation", () => {
    const openShell = (admin = false) => {
      mockAuth = { ...mockAuth, isAdmin: admin };
      renderShell();
      return userEvent.setup();
    };
    // Desktop sidebar only; the mobile bottom bar keeps its own menu.
    const sidebar = () => within(screen.getByRole("complementary"));

    it("expands the extra items in the same list and hides the trigger while open", async () => {
      const user = openShell();
      expect(sidebar().queryByRole("link", { name: /Kho tri thức/ })).not.toBeInTheDocument();

      await user.click(sidebar().getByRole("button", { name: /Thêm\.\.\./ }));

      expect(sidebar().getByRole("link", { name: /Kho tri thức/ })).toHaveAttribute("href", "/knowledge");
      expect(sidebar().getByRole("link", { name: /Cây Nghề Nghiệp/ })).toHaveAttribute("href", "/chat/career-universe");
      expect(sidebar().getByRole("link", { name: /Người đóng góp/ })).toHaveAttribute("href", "/contributors");
      expect(sidebar().queryByRole("link", { name: /Quản trị/ })).not.toBeInTheDocument();
      // The "More" trigger is gone; a small "Ẩn" sits at the end of the list instead.
      expect(sidebar().queryByRole("button", { name: /Thêm\.\.\./ })).not.toBeInTheDocument();
      expect(sidebar().getByRole("button", { name: "Ẩn" })).toBeInTheDocument();
    });

    it("collapses again with the Ẩn button", async () => {
      const user = openShell();
      await user.click(sidebar().getByRole("button", { name: /Thêm\.\.\./ }));
      await user.click(sidebar().getByRole("button", { name: "Ẩn" }));

      expect(sidebar().queryByRole("link", { name: /Kho tri thức/ })).not.toBeInTheDocument();
      expect(sidebar().getByRole("button", { name: /Thêm\.\.\./ })).toBeInTheDocument();
    });

    it("shows the Admin link only to admins", async () => {
      const user = openShell(true);
      await user.click(sidebar().getByRole("button", { name: /Thêm\.\.\./ }));
      expect(sidebar().getByRole("link", { name: /Quản trị/ })).toHaveAttribute("href", "/admin");
    });
  });
});