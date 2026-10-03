import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { AuthVerifyPage } from "../pages/AuthVerifyPage";

const { verify } = vi.hoisted(() => ({ verify: vi.fn() }));
vi.mock("../contexts/AuthContext", () => ({ useAuth: () => ({ verifyMagicLink: verify }) }));

function Navigation() {
  const navigate = useNavigate();
  return <button onClick={() => navigate("/other")}>Rời trang xác thực</button>;
}
beforeEach(() => {
  vi.useFakeTimers();
  verify.mockReset().mockResolvedValue({});
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

it("cancels the delayed redirect when the student leaves the verification page", async () => {
  render(<MemoryRouter initialEntries={["/auth/verify?token=test"]}>
    <Navigation />
    <Routes>
      <Route path="/auth/verify" element={<AuthVerifyPage />} />
      <Route path="/chat" element={<p>Trang chat</p>} />
      <Route path="/other" element={<p>Trang khác</p>} />
    </Routes>
  </MemoryRouter>);
  await act(async () => {});
  expect(screen.getByText("Đăng nhập thành công!")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Rời trang xác thực"));
  await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
  expect(screen.getByText("Trang khác")).toBeInTheDocument();
  expect(screen.queryByText("Trang chat")).not.toBeInTheDocument();
});
