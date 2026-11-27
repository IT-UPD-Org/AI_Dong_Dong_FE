import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LibraryManager, getDocumentIcon, getSafeDownloadUrl } from "../components/library/LibraryManager";
import { SkillsTab, slugify } from "../pages/admin/SkillsTab";
import { AppShell } from "../components/layout/AppShell";
import { libraryApi, type LibraryDocument } from "../api/library.api";
import { skillsApi, type Skill } from "../api/skills.api";

let mockAuthUser: { id: string; display_name: string; email: string; role: string } | null = null;
const mockLogout = vi.fn();

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isAuthenticated: !!mockAuthUser,
    isAdmin: mockAuthUser?.role === "admin",
    logout: mockLogout,
  }),
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

vi.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({
    lang: "vi",
    t: (key: string) => {
      const map: Record<string, string> = {
        navKnowledge: "Kho tri thức",
        navContributors: "Người đóng góp",
        navAdmin: "Quản trị",
        navMore: "Thêm...",
        navLess: "Ẩn",
        navHistory: "Lịch sử",
        navDocuments: "Tài liệu",
        newChat: "Cuộc trò chuyện mới",
        recent: "Gần đây",
        noRecentChats: "Chưa có cuộc trò chuyện",
        preferences: "Cấu hình",
        roleStudent: "Sinh viên",
        roleTeacher: "Giảng viên",
        roleAdmin: "Quản trị viên",
        profile: "Hồ sơ cá nhân",
        settings: "Cài đặt",
        logout: "Đăng xuất",
      };
      return map[key] || key;
    },
  }),
}));

vi.mock("../api/library.api", () => ({
  libraryApi: {
    getDocuments: vi.fn(),
    uploadDocument: vi.fn(),
    updateDocument: vi.fn(),
    deleteDocument: vi.fn(),
  },
}));

vi.mock("../api/skills.api", () => ({
  skillsApi: {
    getSkills: vi.fn(),
    createSkill: vi.fn(),
    updateSkill: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const sampleDoc: LibraryDocument = {
  id: "doc-123456",
  title: "Quy định học vụ 2026",
  description: "Hướng dẫn đăng ký và thi",
  filename: "quy-dinh.pdf",
  content_type: "application/pdf",
  size: 1048576,
  file_url: "https://storage.example.com/library/quy-dinh.pdf",
};

const sampleSkill: Skill = {
  id: "skill-987",
  slug: "huong-dan-tin-chi",
  name: "Hướng dẫn đăng ký tín chỉ",
  description: "Quy trình đăng ký học phần",
  instructions: "Bước 1: vào trang sinh viên. Bước 2: chọn môn...",
  enabled: true,
  created_at: "2026-03-01T10:00:00Z",
  updated_at: "2026-03-01T10:00:00Z",
};

describe("Library and Skills UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Security boundary: safe download URL", () => {
    it("permits valid http and https URLs and rejects dangerous schemes", () => {
      expect(getSafeDownloadUrl("https://example.com/file.pdf")).toBe("https://example.com/file.pdf");
      expect(getSafeDownloadUrl("http://example.com/file.pdf")).toBe("http://example.com/file.pdf");
      expect(getSafeDownloadUrl("javascript:alert(1)")).toBeNull();
      expect(getSafeDownloadUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
      expect(getSafeDownloadUrl("/relative/path")).toBeNull();
      expect(getSafeDownloadUrl("")).toBeNull();
      expect(getSafeDownloadUrl(null)).toBeNull();
    });

    it("renders disabled indicator instead of executable anchor when file_url has unsafe scheme", async () => {
      mockAuthUser = { id: "1", display_name: "Sinh viên", email: "student@pduni.edu.vn", role: "student" };
      const unsafeDoc: LibraryDocument = {
        ...sampleDoc,
        file_url: "javascript:alert('malicious')",
      };
      vi.mocked(libraryApi.getDocuments).mockResolvedValue([unsafeDoc]);

      render(
        <MemoryRouter>
          <LibraryManager />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Quy định học vụ 2026")).toBeInTheDocument();
      });

      // Assert no link with javascript: exists in the DOM
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("File icon format detection", () => {
    it("distinguishes spreadsheet openxmlformats from word documents", () => {
      const xlsxIcon = getDocumentIcon(
        "bang-diem.xlsx",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      // Lucide FileSpreadsheet has green text class
      expect(xlsxIcon.props.className).toContain("text-emerald-500");

      const docxIcon = getDocumentIcon(
        "de-cuong.docx",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      expect(docxIcon.props.className).toContain("text-blue-500");
    });
  });

  describe("Slugify utility", () => {
    it("removes diacritics, lowercase-hyphenates, and trims trailing hyphens after slice", () => {
      expect(slugify("Hướng Dẫn Đăng Ký")).toBe("huong-dan-dang-ky");
      const longName = "a".repeat(79) + "-extra";
      const slug = slugify(longName);
      expect(slug.length).toBeLessThanOrEqual(80);
      expect(slug.endsWith("-")).toBe(false);
    });
  });

  describe("LibraryManager permissions & visibility", () => {
    it("renders document list for student but hides upload and edit actions", async () => {
      mockAuthUser = { id: "1", display_name: "Sinh viên", email: "student@pduni.edu.vn", role: "student" };
      vi.mocked(libraryApi.getDocuments).mockResolvedValue([sampleDoc]);

      render(
        <MemoryRouter>
          <LibraryManager />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Quy định học vụ 2026")).toBeInTheDocument();
      });

      expect(screen.getByText("quy-dinh.pdf")).toBeInTheDocument();
      expect(screen.getByText("1 MB")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Tải lên tài liệu/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Sửa" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Xoá" })).not.toBeInTheDocument();

      // Download link has safe attributes
      const downloadLink = screen.getByRole("link", { name: /Tải xuống/i });
      expect(downloadLink).toHaveAttribute("href", "https://storage.example.com/library/quy-dinh.pdf");
      expect(downloadLink).toHaveAttribute("target", "_blank");
      expect(downloadLink).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders upload, edit and delete buttons for teacher", async () => {
      mockAuthUser = { id: "2", display_name: "Giảng viên", email: "teacher@pduni.edu.vn", role: "teacher" };
      vi.mocked(libraryApi.getDocuments).mockResolvedValue([sampleDoc]);

      render(
        <MemoryRouter>
          <LibraryManager />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Quy định học vụ 2026")).toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: /Tải lên tài liệu/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Sửa" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Xoá" })).toBeInTheDocument();
    });

    it("opens upload modal, submits document, and explicitly closes modal on success", async () => {
      const user = userEvent.setup();
      mockAuthUser = { id: "2", display_name: "Giảng viên", email: "teacher@pduni.edu.vn", role: "teacher" };
      vi.mocked(libraryApi.getDocuments).mockResolvedValue([]);
      vi.mocked(libraryApi.uploadDocument).mockResolvedValue(sampleDoc);

      render(
        <MemoryRouter>
          <LibraryManager />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Kho tài liệu chung hiện chưa có tài liệu nào/i)).toBeInTheDocument();
      });

      const uploadBtn = screen.getByRole("button", { name: /Tải lên tài liệu đầu tiên/i });
      await user.click(uploadBtn);

      expect(screen.getByText("Tải lên tài liệu vào Kho chung")).toBeInTheDocument();

      const file = new File(["test content"], "syllabus.pdf", { type: "application/pdf" });
      const fileInput = document.getElementById("library-file-input") as HTMLInputElement;
      await user.upload(fileInput, file);

      expect(screen.getByDisplayValue("syllabus")).toBeInTheDocument();

      const submitBtn = screen.getByRole("button", { name: /^Tải lên$/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(libraryApi.uploadDocument).toHaveBeenCalledWith(
          file,
          "syllabus",
          undefined
        );
      });

      // Regression check: upload modal is closed after success
      await waitFor(() => {
        expect(screen.queryByText("Tải lên tài liệu vào Kho chung")).not.toBeInTheDocument();
      });
    });

    it("opens edit modal, updates metadata, and explicitly closes modal on success", async () => {
      const user = userEvent.setup();
      mockAuthUser = { id: "2", display_name: "Giảng viên", email: "teacher@pduni.edu.vn", role: "teacher" };
      vi.mocked(libraryApi.getDocuments).mockResolvedValue([sampleDoc]);
      vi.mocked(libraryApi.updateDocument).mockResolvedValue({
        ...sampleDoc,
        title: "Quy định học vụ 2026 (Mới)",
      });

      render(
        <MemoryRouter>
          <LibraryManager />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Quy định học vụ 2026")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: "Sửa" }));

      expect(screen.getByText("Chỉnh sửa thông tin tài liệu")).toBeInTheDocument();
      const titleInput = screen.getByDisplayValue("Quy định học vụ 2026");
      await user.clear(titleInput);
      await user.type(titleInput, "Quy định học vụ 2026 (Mới)");

      await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

      await waitFor(() => {
        expect(libraryApi.updateDocument).toHaveBeenCalledWith("doc-123456", {
          title: "Quy định học vụ 2026 (Mới)",
          description: "Hướng dẫn đăng ký và thi",
        });
      });

      // Regression check: edit modal is closed after success
      await waitFor(() => {
        expect(screen.queryByText("Chỉnh sửa thông tin tài liệu")).not.toBeInTheDocument();
      });
    });
  });

  describe("SkillsTab management", () => {
    it("renders skills list and toggles enabled state using PATCH with server authoritative returned object", async () => {
      const user = userEvent.setup();
      const serverReturnedDisabled: Skill = {
        ...sampleSkill,
        enabled: false,
        updated_at: "2026-03-01T15:30:00Z",
      };
      vi.mocked(skillsApi.getSkills).mockResolvedValue([sampleSkill]);
      vi.mocked(skillsApi.updateSkill).mockResolvedValue(serverReturnedDisabled);

      render(
        <MemoryRouter>
          <SkillsTab />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Hướng dẫn đăng ký tín chỉ")).toBeInTheDocument();
      });

      expect(screen.getByText("huong-dan-tin-chi")).toBeInTheDocument();
      const toggleBtn = screen.getByRole("button", { name: /Bấm để tắt/i });
      await user.click(toggleBtn);

      await waitFor(() => {
        expect(skillsApi.updateSkill).toHaveBeenCalledWith("skill-987", { enabled: false });
      });

      // Button now reflects the disabled state from server
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Bấm để kích hoạt/i })).toBeInTheDocument();
      });
    });

    it("opens create dialog, creates skill, and explicitly closes dialog on success", async () => {
      const user = userEvent.setup();
      vi.mocked(skillsApi.getSkills).mockResolvedValue([]);
      vi.mocked(skillsApi.createSkill).mockResolvedValue(sampleSkill);

      render(
        <MemoryRouter>
          <SkillsTab />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Chưa có skill nào")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /Tạo Skill đầu tiên/i }));

      expect(screen.getByText("Thêm Skill mới")).toBeInTheDocument();

      const nameInput = screen.getByPlaceholderText("Ví dụ: Hướng dẫn đăng ký tín chỉ học phần");
      await user.type(nameInput, "Kỹ năng đăng ký học phần");

      const descInput = screen.getByPlaceholderText("Mô tả hoàn cảnh và mục đích khi Agent cần sử dụng kỹ năng này...");
      await user.type(descInput, "Mô tả mục đích áp dụng");

      const instructionsInput = screen.getByPlaceholderText(/Viết các chỉ dẫn rõ ràng cho Agent/i);
      await user.type(instructionsInput, "Chỉ dẫn chi tiết bằng văn bản thuần");

      await user.click(screen.getByRole("button", { name: "Tạo Skill" }));

      await waitFor(() => {
        expect(skillsApi.createSkill).toHaveBeenCalledWith({
          slug: "ky-nang-dang-ky-hoc-phan",
          name: "Kỹ năng đăng ký học phần",
          description: "Mô tả mục đích áp dụng",
          instructions: "Chỉ dẫn chi tiết bằng văn bản thuần",
          enabled: true,
        });
      });

      // Regression check: dialog is closed after success
      await waitFor(() => {
        expect(screen.queryByText("Thêm Skill mới")).not.toBeInTheDocument();
      });
    });

    it("surfaces 409 conflict when creating duplicate slug", async () => {
      const user = userEvent.setup();
      vi.mocked(skillsApi.getSkills).mockResolvedValue([]);
      const conflictError: any = new Error("Skill slug already in use; choose another slug");
      conflictError.status = 409;
      vi.mocked(skillsApi.createSkill).mockRejectedValue(conflictError);

      render(
        <MemoryRouter>
          <SkillsTab />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Chưa có skill nào")).toBeInTheDocument();
      });

      await user.click(screen.getByRole("button", { name: /Tạo Skill đầu tiên/i }));

      const nameInput = screen.getByPlaceholderText("Ví dụ: Hướng dẫn đăng ký tín chỉ học phần");
      await user.type(nameInput, "Kỹ năng test");

      const descInput = screen.getByPlaceholderText("Mô tả hoàn cảnh và mục đích khi Agent cần sử dụng kỹ năng này...");
      await user.type(descInput, "Mô tả test");

      const instructionsInput = screen.getByPlaceholderText(/Viết các chỉ dẫn rõ ràng cho Agent/i);
      await user.type(instructionsInput, "Hướng dẫn test chi tiết");

      await user.click(screen.getByRole("button", { name: "Tạo Skill" }));

      await waitFor(() => {
        expect(
          screen.getByText("Mã định danh (slug) này đã được sử dụng. Vui lòng chọn một mã khác.")
        ).toBeInTheDocument();
      });

      // Form inputs are preserved
      expect(screen.getByDisplayValue("Kỹ năng test")).toBeInTheDocument();
    });
  });

  describe("AppShell discovery of Knowledge route", () => {
    it("includes Kho tri thức link in More navigation", async () => {
      const user = userEvent.setup();
      mockAuthUser = { id: "2", display_name: "Giảng viên", email: "teacher@pduni.edu.vn", role: "teacher" };

      render(
        <MemoryRouter initialEntries={["/chat"]}>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/chat" element={<div>chat page</div>} />
              <Route path="/knowledge" element={<div>knowledge page</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Open the desktop More accordion
      const moreBtns = screen.getAllByRole("button", { name: /Thêm.../i });
      await user.click(moreBtns[0]);

      const knowledgeLink = await screen.findByRole("link", { name: /Kho tri thức/i });
      expect(knowledgeLink).toBeInTheDocument();
      expect(knowledgeLink).toHaveAttribute("href", "/knowledge");
    });
  });
});
