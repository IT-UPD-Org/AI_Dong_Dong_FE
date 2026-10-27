import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { ApprovePage } from "../pages/ApprovePage";

describe("ApprovePage", () => {
  const renderApprovePage = (initialEntries = ["/approve"]) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <ApprovePage />
      </MemoryRouter>
    );
  };

  it("renders page title and administrative recipient email", () => {
    renderApprovePage();
    expect(screen.getByRole("heading", { name: /Cấp phép tài khoản UAI/i })).toBeInTheDocument();
    expect(screen.getAllByText(/dung\.nm@phuongdong\.edu\.vn/i).length).toBeGreaterThan(0);
  });

  it("renders the 3 main request type options", () => {
    renderApprovePage();
    expect(screen.getByRole("button", { name: /Xin cấp tài khoản/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tăng dung lượng lưu trữ/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Báo lỗi hệ thống/i })).toBeInTheDocument();
  });

  it("switches between student and non-student status, showing appropriate fields", async () => {
    renderApprovePage();

    // Default is student
    expect(screen.getByLabelText(/Mã sinh viên/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mã lớp/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ngành học/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Khoa/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Số điện thoại/i)).not.toBeInTheDocument();

    // Switch to non-student
    const nonStudentBtn = screen.getByRole("button", { name: /Không còn là sinh viên/i });
    fireEvent.click(nonStudentBtn);

    expect(screen.queryByLabelText(/Mã sinh viên/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Số điện thoại liên hệ/i)).toBeInTheDocument();
    expect(screen.getByText(/Ảnh chụp bằng tốt nghiệp/i)).toBeInTheDocument();
  });

  it("shows the discrete quota stops (236 MB, 512 MB, 1080 MB) when storage_increase is active", () => {
    renderApprovePage(["/approve?type=storage_increase"]);

    expect(screen.getAllByText("236 MB").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("512 MB")).toBeInTheDocument();
    expect(screen.getByText("1080 MB")).toBeInTheDocument();
    expect(screen.getByText(/Mặc định tiêu chuẩn UAI/i)).toBeInTheDocument();
  });

  it("shows bug report fields when bug_report is selected", () => {
    renderApprovePage(["/approve?type=bug_report"]);

    expect(screen.getByLabelText(/Tiêu đề lỗi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Trang hoặc chức năng gặp sự cố/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mô tả chi tiết các bước xảy ra lỗi/i)).toBeInTheDocument();
  });

  it("displays validation errors when submitting an empty form", async () => {
    renderApprovePage();

    const submitBtn = screen.getByRole("button", { name: /Gửi yêu cầu đến quản trị viên/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Vui lòng nhập họ và tên đầy đủ/i)).toBeInTheDocument();
      expect(screen.getByText(/Vui lòng chọn ngày, tháng, năm sinh/i)).toBeInTheDocument();
    });
  });
});
