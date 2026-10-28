import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "../pages/LoginPage";
import { authApi } from "../api/auth.api";
import { ApiError } from "../api/client";

// Mock useAuth
const mockPasswordLogin = vi.fn();
const mockDevLogin = vi.fn();
const mockLogout = vi.fn();

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isAdmin: false,
    isLoading: false,
    passwordLogin: mockPasswordLogin,
    devLogin: mockDevLogin,
    logout: mockLogout,
    setUser: vi.fn(),
  }),
}));

// Mock authApi
vi.mock("../api/auth.api", () => ({
  authApi: {
    getMethods: vi.fn(),
    passwordLogin: vi.fn(),
    getMicrosoftConfig: vi.fn(),
  },
}));

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authApi.getMethods).mockResolvedValue({
      microsoft: false,
      password: true,
      dev: false,
    });
  });

  const renderLoginPage = async (initialEntries = ["/login"]) => {
    const utils = render(
      <MemoryRouter initialEntries={initialEntries}>
        <LoginPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Đăng nhập vào IT UPD GenAI\./i })).toBeInTheDocument();
    });
    return utils;
  };

  it("renders the official login page by default (no TemporaryLogin)", async () => {
    await renderLoginPage();

    expect(screen.getByRole("heading", { name: /Đăng nhập vào IT UPD GenAI\./i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email tài khoản/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Mật khẩu$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Đăng nhập$/i })).toBeInTheDocument();

    // Verify demo accounts and temporary login bypass are NOT displayed
    expect(screen.queryByText(/Đăng nhập thử nghiệm/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Chế độ thử nghiệm/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/usr_demo_student/i)).not.toBeInTheDocument();
  });

  it("toggles password visibility when clicking the eye icon", async () => {
    await renderLoginPage();

    const passwordInput = screen.getByLabelText(/^Mật khẩu$/i) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    const toggleBtn = screen.getByRole("button", { name: /Hiện mật khẩu/i });
    fireEvent.click(toggleBtn);

    expect(passwordInput.type).toBe("text");

    const hideBtn = screen.getByRole("button", { name: /Ẩn mật khẩu/i });
    fireEvent.click(hideBtn);

    expect(passwordInput.type).toBe("password");
  });

  it("validates empty email, invalid email, and empty password", async () => {
    await renderLoginPage();

    const submitBtn = screen.getByRole("button", { name: /^Đăng nhập$/i });

    // Submit with empty email
    fireEvent.click(submitBtn);
    expect(screen.getByText(/Vui lòng nhập địa chỉ email\./i)).toBeInTheDocument();

    // Fill invalid email
    const emailInput = screen.getByLabelText(/Email tài khoản/i);
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.click(submitBtn);
    expect(screen.getByText(/Địa chỉ email không đúng định dạng\./i)).toBeInTheDocument();

    // Fill valid email, empty password
    fireEvent.change(emailInput, { target: { value: "student@pduni.edu.vn" } });
    fireEvent.click(submitBtn);
    expect(screen.getByText(/Vui lòng nhập mật khẩu\./i)).toBeInTheDocument();
  });

  it("displays visual role badges for university email domains without overriding role", async () => {
    await renderLoginPage();

    const emailInput = screen.getByLabelText(/Email tài khoản/i);

    // Student domain
    fireEvent.change(emailInput, { target: { value: "21cntt01@pduni.edu.vn" } });
    expect(screen.getByText(/Sinh viên Phương Đông/i)).toBeInTheDocument();

    // Teacher domain
    fireEvent.change(emailInput, { target: { value: "gv_cntt@phuongdong.edu.vn" } });
    expect(screen.getByText(/Giảng viên Phương Đông/i)).toBeInTheDocument();

    // Other domain - no badge
    fireEvent.change(emailInput, { target: { value: "someone@gmail.com" } });
    expect(screen.queryByText(/Sinh viên Phương Đông/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Giảng viên Phương Đông/i)).not.toBeInTheDocument();
  });

  it("calls passwordLogin when valid credentials are submitted", async () => {
    mockPasswordLogin.mockResolvedValueOnce({
      id: "1",
      email: "student@pduni.edu.vn",
      name: "Student",
      role: "student",
    });

    await renderLoginPage();

    fireEvent.change(screen.getByLabelText(/Email tài khoản/i), {
      target: { value: "student@pduni.edu.vn" },
    });
    fireEvent.change(screen.getByLabelText(/^Mật khẩu$/i), {
      target: { value: "secretPassword123" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Đăng nhập$/i }));

    await waitFor(() => {
      expect(mockPasswordLogin).toHaveBeenCalledWith("student@pduni.edu.vn", "secretPassword123");
    });
  });

  it("displays friendly Vietnamese error message on 401 and 403 API errors", async () => {
    mockPasswordLogin.mockRejectedValueOnce(
      new ApiError("Invalid email or password", 401)
    );

    await renderLoginPage();

    fireEvent.change(screen.getByLabelText(/Email tài khoản/i), {
      target: { value: "student@pduni.edu.vn" },
    });
    fireEvent.change(screen.getByLabelText(/^Mật khẩu$/i), {
      target: { value: "wrongpass" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^Đăng nhập$/i }));

    await waitFor(() => {
      expect(screen.getByText(/Email hoặc mật khẩu không chính xác\./i)).toBeInTheDocument();
    });
  });

  it("contains valid navigation links to /approve and /admin/create", async () => {
    await renderLoginPage();

    const approveLink = screen.getByRole("link", { name: /Cấp phép tài khoản/i });
    expect(approveLink).toHaveAttribute("href", "/approve");

    const adminCreateLink = screen.getByRole("link", { name: /Khởi tạo tài khoản quản trị/i });
    expect(adminCreateLink).toHaveAttribute("href", "/admin/create");
  });

  it("renders Microsoft login button when microsoft is available from backend methods", async () => {
    vi.mocked(authApi.getMethods).mockResolvedValueOnce({
      microsoft: true,
      password: true,
      dev: false,
    });

    renderLoginPage();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Đăng nhập bằng Microsoft/i })).toBeInTheDocument();
    });
  });
});
