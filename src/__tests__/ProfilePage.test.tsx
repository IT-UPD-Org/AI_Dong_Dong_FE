import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { User } from "../api/types";

const auth = vi.hoisted(() => ({
  value: { user: null as User | null, logout: vi.fn(async () => {}), setUser: vi.fn() },
}));
vi.mock("../contexts/AuthContext", () => ({ useAuth: () => auth.value }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("../api/auth.api", () => ({
  authApi: { listSessions: vi.fn(), revokeSession: vi.fn(), updateProfile: vi.fn() },
}));

import { authApi } from "../api/auth.api";
import { ProfilePage } from "../pages/ProfilePage";

const me: User = {
  id: "1",
  email: "an@pduni.edu.vn",
  display_name: "An Nguyen",
  role: "student",
  credits: 120,
  storage_used: 59 * 1024 * 1024,
  storage_limit: 236 * 1024 * 1024,
  first_use: null,
  state: "active",
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/profile"]}>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<div>login screen</div>} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  auth.value.user = me;
  vi.mocked(authApi.listSessions).mockResolvedValue([
    { id: "s1", expires_at: "2026-12-31T10:00:00Z" },
    { id: "s2", expires_at: "2027-01-02T10:00:00Z" },
  ]);
});

describe("ProfilePage", () => {
  it("shows the translated logout label (not a raw key) and the account details", async () => {
    renderPage();
    expect(screen.getByRole("button", { name: "Đăng xuất" })).toBeInTheDocument();
    expect(screen.queryByText("nav.logout")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "An Nguyen" })).toBeInTheDocument();
    expect(screen.getByText("120 credits")).toBeInTheDocument();
    await screen.findAllByRole("button", { name: "Đăng xuất phiên" });
  });

  it("shows storage as a progress bar with a request-more link", async () => {
    renderPage();
    const bar = screen.getByRole("progressbar", { name: "Dung lượng đã dùng" });
    expect(bar).toHaveAttribute("aria-valuenow", "25");
    expect(screen.getByText("59.0 MB / 236 MB")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Yêu cầu thêm dung lượng/ })).toHaveAttribute(
      "href",
      "/approve?type=storage_increase",
    );
    await screen.findAllByRole("button", { name: "Đăng xuất phiên" });
  });

  it("lists sign-in sessions and signs one out", async () => {
    const u = userEvent.setup();
    vi.mocked(authApi.revokeSession).mockResolvedValue(undefined);
    renderPage();

    const buttons = await screen.findAllByRole("button", { name: "Đăng xuất phiên" });
    expect(buttons).toHaveLength(2);
    await u.click(buttons[0]);

    await waitFor(() => expect(authApi.revokeSession).toHaveBeenCalledWith("s1"));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Đăng xuất phiên" })).toHaveLength(1));
  });

  it("disables every sign-out button while one session is being signed out", async () => {
    const u = userEvent.setup();
    let finish!: () => void;
    vi.mocked(authApi.revokeSession).mockImplementation(() => new Promise<void>((r) => (finish = r)));
    renderPage();

    const buttons = await screen.findAllByRole("button", { name: "Đăng xuất phiên" });
    await u.click(buttons[0]);
    await waitFor(() => screen.getAllByRole("button", { name: "Đăng xuất phiên" }).forEach((b) => expect(b).toBeDisabled()));
    expect(authApi.revokeSession).toHaveBeenCalledTimes(1);

    finish();
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Đăng xuất phiên" })).toHaveLength(1));
    expect(screen.getByRole("button", { name: "Đăng xuất phiên" })).toBeEnabled();
  });

  it("saves the display name (never name) and clears it when blank", async () => {
    const u = userEvent.setup();
    vi.mocked(authApi.updateProfile).mockResolvedValue({ ...me, display_name: "Annie" });
    renderPage();

    const input = screen.getByLabelText("Tên hiển thị");
    await u.clear(input);
    await u.type(input, "  Annie ");
    await u.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(authApi.updateProfile).toHaveBeenCalledWith({ display_name: "Annie" }));
    expect(auth.value.setUser).toHaveBeenCalled();

    await u.clear(input);
    await u.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(authApi.updateProfile).toHaveBeenLastCalledWith({ display_name: null }));
    await screen.findAllByRole("button", { name: "Đăng xuất phiên" });
  });

  it("logs out and goes to the login page", async () => {
    const u = userEvent.setup();
    renderPage();
    await u.click(screen.getByRole("button", { name: "Đăng xuất" }));
    expect(await screen.findByText("login screen")).toBeInTheDocument();
    expect(auth.value.logout).toHaveBeenCalledTimes(1);
  });
});