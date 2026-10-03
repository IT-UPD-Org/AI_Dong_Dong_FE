import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { authApi } from "../api/auth.api";
import type { AuthResponse, User } from "../api/types";

vi.mock("../api/auth.api", () => ({ authApi: {
  getCurrentUser: vi.fn(), requestMagicLink: vi.fn(), verifyMagicLink: vi.fn(), logout: vi.fn(),
} }));

const user: User = { id: "1", email: "student@example.com", role: "student" };
function Status() {
  const auth = useAuth();
  return <>
    <p>{auth.isAuthenticated ? "Đã đăng nhập" : "Chưa đăng nhập"}</p>
    <button onClick={auth.logout}>Đăng xuất</button>
    <button onClick={() => { void auth.verifyMagicLink("verify").catch(() => {}); }}>Xác thực</button>
    <p>{auth.isLoading ? "Đang chờ" : "Sẵn sàng"}</p>
  </>;
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(authApi.getCurrentUser).mockResolvedValue(null);
  vi.mocked(authApi.logout).mockImplementation(async () => { localStorage.removeItem("access_token"); });
});
afterEach(cleanup);

describe("authentication request races", () => {
  it("does not restore the old session after logout while loading the user", async () => {
    localStorage.setItem("access_token", "old-token");
    let finish!: (result: User) => void;
    vi.mocked(authApi.getCurrentUser).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<AuthProvider><Status /></AuthProvider>);
    fireEvent.click(screen.getByText("Đăng xuất"));
    await act(async () => { finish(user); });
    expect(screen.getByText("Chưa đăng nhập")).toBeInTheDocument();
    expect(screen.getByText("Sẵn sàng")).toBeInTheDocument();
    expect(localStorage.getItem("access_token")).toBeNull();
  });

  it("does not complete a pending verification after logout", async () => {
    let finish!: (result: AuthResponse) => void;
    vi.mocked(authApi.verifyMagicLink).mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<AuthProvider><Status /></AuthProvider>);
    await waitFor(() => expect(screen.getByText("Sẵn sàng")).toBeInTheDocument());
    fireEvent.click(screen.getByText("Xác thực"));
    fireEvent.click(screen.getByText("Đăng xuất"));
    await act(async () => { finish({ status: "ok", access_token: "stale-token", user }); });
    expect(screen.getByText("Chưa đăng nhập")).toBeInTheDocument();
    expect(localStorage.getItem("access_token")).toBeNull();
  });
});
