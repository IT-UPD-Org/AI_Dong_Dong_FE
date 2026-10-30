import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { User, UserState } from "../api/types";

const auth = vi.hoisted(() => ({
  value: {
    user: null as User | null,
    isAuthenticated: false,
    isLoading: false,
    refreshUser: vi.fn(async () => {}),
  },
}));

vi.mock("../contexts/AuthContext", () => ({ useAuth: () => auth.value }));

vi.mock("../api/approval.api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../api/approval.api")>();
  return {
    ...actual,
    requestApi: {
      listAccount: vi.fn(async () => []),
      createAccount: vi.fn(async () => ({})),
      listStorage: vi.fn(async () => []),
      createStorage: vi.fn(async () => ({})),
      reportBug: vi.fn(() => "abcdef1234"),
    },
  };
});

import { requestApi } from "../api/approval.api";
import { ApprovePage } from "../pages/ApprovePage";

function signIn(state: UserState) {
  auth.value.user = {
    id: "1",
    email: "a@pduni.edu.vn",
    name: "An",
    role: "student",
    credits: 1000,
    storage_used: 0,
    storage_limit: 236 * 1024 * 1024,
    first_use: null,
    state,
  };
  auth.value.isAuthenticated = true;
}

const renderPage = (entry = "/approve") =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <ApprovePage />
    </MemoryRouter>,
  );

describe("ApprovePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.value.user = null;
    auth.value.isAuthenticated = false;
  });

  it("asks signed-out visitors to sign in with Microsoft", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /Cấp phép tài khoản UAI/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Đăng nhập bằng Microsoft/i })).toBeInTheDocument();
  });

  it("shows the access request form to an inactive account and validates it", async () => {
    signIn("inactive");
    renderPage();
    expect(screen.getByRole("heading", { name: /Yêu cầu cấp quyền truy cập/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã sinh viên/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Gửi yêu cầu cấp quyền/i }));
    expect(await screen.findByText(/Vui lòng nhập họ và tên/i)).toBeInTheDocument();
    expect(requestApi.createAccount).not.toHaveBeenCalled();
  });

  it("hides student fields for teachers and sends the request", async () => {
    signIn("inactive");
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /^Giảng viên$/i }));
    expect(screen.queryByLabelText(/Mã sinh viên/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Họ và tên/i), { target: { value: "Nguyễn An" } });
    fireEvent.change(screen.getByLabelText(/Ngày sinh/i), { target: { value: "1990-01-01" } });
    fireEvent.change(screen.getByLabelText(/Mục đích sử dụng/i), { target: { value: "Soạn bài giảng và nghiên cứu" } });
    fireEvent.click(screen.getByRole("button", { name: /Gửi yêu cầu cấp quyền/i }));

    await waitFor(() => expect(requestApi.createAccount).toHaveBeenCalledTimes(1));
    expect(vi.mocked(requestApi.createAccount).mock.calls[0][0]).toMatchObject({
      full_name: "Nguyễn An",
      student_status: "teacher",
      student_id: undefined,
    });
    expect(auth.value.refreshUser).toHaveBeenCalled();
  });

  it("tells a pending account its request is waiting", () => {
    signIn("pending");
    renderPage();
    expect(screen.getByRole("heading", { name: /Yêu cầu đang chờ duyệt/i })).toBeInTheDocument();
  });

  it("offers storage and bug report to an active account", async () => {
    signIn("active");
    renderPage();
    expect(screen.getByRole("button", { name: /Tăng dung lượng lưu trữ/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Báo lỗi hệ thống/i })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /512 MB/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /1080 MB/i })).toBeInTheDocument();
  });

  it("sends a bug report through Sentry feedback", async () => {
    signIn("active");
    renderPage("/approve?type=bug_report");
    fireEvent.change(screen.getByLabelText(/Tiêu đề/i), { target: { value: "Không gửi được tin nhắn" } });
    fireEvent.change(screen.getByLabelText(/Mô tả lỗi/i), { target: { value: "Bấm gửi thì không có gì xảy ra." } });
    fireEvent.click(screen.getByRole("button", { name: /Gửi báo lỗi/i }));
    expect(requestApi.reportBug).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Không gửi được tin nhắn" }),
    );
    expect(await screen.findByText(/Báo lỗi đã được gửi/i)).toBeInTheDocument();
  });
});
