import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import {
  BACHELOR_STATS,
  INITIAL_DOMAINS,
  CAREER_UNIVERSE_CATALOG,
} from "../data/careerUniverseData";
import {
  buildSkeletonGraph,
  buildActiveDomainGraph,
  calculateAcademicFit,
} from "../services/careerScoring.service";
import { CareerUniversePage } from "../pages/CareerUniversePage";
import { AppShell } from "../components/layout/AppShell";
import { documentApi } from "../api/document.api";

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

vi.mock("../api/document.api", () => ({
  documentApi: {
    listDocuments: vi.fn().mockResolvedValue([]),
    uploadDocument: vi.fn().mockResolvedValue({
      document_id: "doc-test-123",
      title: "BangDiem.pdf",
      filename: "BangDiem.pdf",
      file_type: "docs",
      size_bytes: 1024 * 1024,
      file_url: null,
      status: "ready",
    }),
  },
  STORAGE_QUOTA_BYTES: 236 * 1024 * 1024,
}));

vi.mock("../components/layout/DocumentProcessingNotifications", () => ({
  DocumentProcessingNotifications: () => null,
}));

const student = {
  id: "1",
  email: "student@pduni.edu.vn",
  display_name: "Sinh Viên IT",
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

describe("Career Universe Data Model & Scoring Engine", () => {
  it("enforces Bachelor curriculum of exactly 52 total courses", () => {
    expect(BACHELOR_STATS.totalCourses).toBe(52);
    expect(BACHELOR_STATS.completedCourses).toBe(6);
    expect(BACHELOR_STATS.progressPercent).toBeCloseTo(11.54, 2);
  });

  it("contains all 9 mandated Career Domains", () => {
    expect(INITIAL_DOMAINS.length).toBe(9);
    expect(INITIAL_DOMAINS).toContain("Software Engineering");
    expect(INITIAL_DOMAINS).toContain("Data & Artificial Intelligence");
    expect(INITIAL_DOMAINS).toContain("Business & Product");
    expect(INITIAL_DOMAINS).toContain("Cybersecurity");
    expect(INITIAL_DOMAINS).toContain("Infrastructure, Cloud & Network");
    expect(INITIAL_DOMAINS).toContain("UI/UX & Digital Design");
    expect(INITIAL_DOMAINS).toContain("Software Testing & QA");
    expect(INITIAL_DOMAINS).toContain("IT Operations & Consulting");
    expect(INITIAL_DOMAINS).toContain("Research & Education");
  });

  it("builds a skeleton graph with central Bachelor node and 9 peripheral domain nodes", () => {
    const { nodes, edges } = buildSkeletonGraph();
    const bachelor = nodes.find((n) => n.type === "bachelor");
    expect(bachelor).toBeDefined();
    expect(bachelor?.x).toBe(0);
    expect(bachelor?.y).toBe(0);

    const domains = nodes.filter((n) => n.type === "domain");
    expect(domains.length).toBe(9);
    expect(edges.length).toBe(9);
  });

  it("builds an active domain graph when a domain is selected", () => {
    const { nodes, edges } = buildActiveDomainGraph({
      domainId: "domain-se",
      occupationId: null,
      specializationId: null,
    });

    const bachelor = nodes.find((n) => n.type === "bachelor");
    const domain = nodes.find((n) => n.id === "domain-se");
    const occupations = nodes.filter((n) => n.type === "occupation");
    const specializations = nodes.filter((n) => n.type === "specialization");

    expect(bachelor).toBeDefined();
    expect(domain).toBeDefined();
    expect(domain?.x).toBe(0);
    expect(domain?.y).toBe(0);
    expect(occupations.length).toBeGreaterThan(0);
    expect(specializations.length).toBeGreaterThan(0);
    expect(edges.length).toBeGreaterThan(0);
  });

  it("deterministically computes Academic Career Fit without random scores", () => {
    const sampleCourses = [
      { code: "IT202", relevanceWeight: 1.0 },
      { code: "IT204", relevanceWeight: 1.0 },
      { code: "IT301", relevanceWeight: 1.0 },
      { code: "IT304", relevanceWeight: 1.0 },
    ];

    // When 2 out of 4 courses are completed
    const score50 = calculateAcademicFit(sampleCourses, ["IT202", "IT204"]);
    expect(score50).toBe(50);

    // When all 4 are completed
    const score100 = calculateAcademicFit(sampleCourses, ["IT202", "IT204", "IT301", "IT304"]);
    expect(score100).toBe(100);

    // When none are completed
    const score0 = calculateAcademicFit(sampleCourses, []);
    expect(score0).toBe(0);
  });
});

describe("Career Universe Page & UI Interaction", () => {
  it("renders the Career Universe page with the mandatory Career Domain selector", () => {
    render(
      <MemoryRouter initialEntries={["/chat/career-universe"]}>
        <Routes>
          <Route path="/chat/career-universe" element={<CareerUniversePage />} />
        </Routes>
      </MemoryRouter>
    );

    // Skeleton instruction banner
    expect(
      screen.getByText("Chọn nhóm nghề nghiệp để khám phá mạng lưới nghề nghiệp của bạn.")
    ).toBeInTheDocument();

    // Transcript upload zone
    expect(screen.getByText("Upload bảng điểm của bạn")).toBeInTheDocument();
    expect(
      screen.getByText("PDF, DOCX, XLSX, XLS, JPG, PNG – Tối đa 236 MB")
    ).toBeInTheDocument();

    // Career Domain selector
    expect(screen.getByText("Career Domain")).toBeInTheDocument();

    // Faculty (Khoa) and Major (Ngành) selectors
    const facultySelect = screen.getByLabelText("Khoa") as HTMLSelectElement;
    expect(facultySelect).toBeInTheDocument();
    expect(facultySelect).toBeRequired();
    expect(facultySelect.value).toBe("cns-tt");

    const majorSelect = screen.getByLabelText("Ngành") as HTMLSelectElement;
    expect(majorSelect).toBeInTheDocument();
    expect(majorSelect).toBeRequired();
    expect(majorSelect.value).toBe("cntt");
  });

  it("updates graph and selectors when a Career Domain is selected", async () => {
    render(
      <MemoryRouter initialEntries={["/chat/career-universe"]}>
        <Routes>
          <Route path="/chat/career-universe" element={<CareerUniversePage />} />
        </Routes>
      </MemoryRouter>
    );

    const domainSelect = screen.getByLabelText("Career Domain");
    fireEvent.change(domainSelect, { target: { value: "domain-se" } });

    // After selection, the occupation dropdown becomes enabled and options are loaded
    await waitFor(() => {
      const occMatches = screen.getAllByText(/Backend Developer|Lập trình viên Backend/);
      expect(occMatches.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("locks all faculties and majors except Khoa Công nghệ số – Truyền thông and Ngành Công nghệ thông tin", () => {
    render(
      <MemoryRouter initialEntries={["/chat/career-universe"]}>
        <Routes>
          <Route path="/chat/career-universe" element={<CareerUniversePage />} />
        </Routes>
      </MemoryRouter>
    );

    const facultySelect = screen.getByLabelText("Khoa") as HTMLSelectElement;
    const facultyOptions = Array.from(facultySelect.options);
    const enabledFaculties = facultyOptions.filter((opt) => !opt.disabled);
    expect(enabledFaculties).toHaveLength(1);
    expect(enabledFaculties[0].value).toBe("cns-tt");

    const majorSelect = screen.getByLabelText("Ngành") as HTMLSelectElement;
    const majorOptions = Array.from(majorSelect.options);
    const enabledMajors = majorOptions.filter((opt) => !opt.disabled);
    expect(enabledMajors).toHaveLength(1);
    expect(enabledMajors[0].value).toBe("cntt");
  });

  it("shows Career Tree in the AppShell expanded subnav (navMore: 'Thêm...')", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/chat" element={<div>Chat screen</div>} />
            <Route path="/chat/career-universe" element={<div>Career Universe Screen</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Click "Thêm..." in desktop sidebar to open subnav
    const moreBtns = screen.getAllByRole("button", { name: /Thêm.../i });
    await user.click(moreBtns[0]);

    // "Cây Nghề Nghiệp" should be present in the expanded subnav
    const careerTreeLink = await screen.findByRole("link", {
      name: /Cây Nghề Nghiệp/i,
    });
    expect(careerTreeLink).toBeInTheDocument();
    expect(careerTreeLink).toHaveAttribute("href", "/chat/career-universe");
  });

  it("allows selecting a previously uploaded document from Tài liệu and analyzing without re-uploading", async () => {
    const user = userEvent.setup();
    vi.mocked(documentApi.listDocuments).mockResolvedValueOnce([
      {
        document_id: "existing-doc-1",
        title: "Bảng điểm HK1 2026",
        filename: "bang_diem_hk1.pdf",
        file_type: "docs",
        size_bytes: 204800,
        file_url: "/api/files/existing-doc-1/download",
        status: "ready",
      },
      {
        document_id: "existing-doc-2",
        title: "Đề cương học phần",
        filename: "de_cuong.docx",
        file_type: "docs",
        size_bytes: 51200,
        file_url: "/api/files/existing-doc-2/download",
        status: "ready",
      },
    ]);

    function ChatStateProbe() {
      const location = useLocation();
      const state = location.state as {
        initialPrompt?: string;
        initialAttachmentIds?: string[];
      } | null;
      return (
        <div data-testid="chat-probe">
          <span data-testid="chat-attachments">
            {(state?.initialAttachmentIds ?? []).join(",")}
          </span>
          <span data-testid="chat-prompt">{state?.initialPrompt ?? ""}</span>
        </div>
      );
    }

    render(
      <MemoryRouter initialEntries={["/chat/career-universe"]}>
        <Routes>
          <Route path="/chat/career-universe" element={<CareerUniversePage />} />
          <Route path="/chat" element={<ChatStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    // Switch to "Từ Tài liệu" tab
    const existingTab = screen.getByRole("tab", { name: /Từ Tài liệu/i });
    await user.click(existingTab);

    expect(documentApi.listDocuments).toHaveBeenCalledWith(1, 100);
    expect(await screen.findByText("Bảng điểm HK1 2026")).toBeInTheDocument();
    expect(screen.getByText("Đề cương học phần")).toBeInTheDocument();

    // Filter documents via search input
    const searchInput = screen.getByLabelText("Tìm kiếm tài liệu đã tải lên");
    await user.type(searchInput, "HK1");
    expect(screen.getByText("Bảng điểm HK1 2026")).toBeInTheDocument();
    expect(screen.queryByText("Đề cương học phần")).not.toBeInTheDocument();

    // Select the matching document
    await user.click(screen.getByRole("button", { name: /Bảng điểm HK1 2026/i }));
    expect(screen.getByText("bang_diem_hk1.pdf")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Chọn tài liệu khác/i })).toBeInTheDocument();

    // Analyze sends existing document_id directly to /chat without calling uploadDocument
    await user.click(screen.getByRole("button", { name: /Phân tích/i }));

    expect(await screen.findByTestId("chat-probe")).toBeInTheDocument();
    expect(screen.getByTestId("chat-attachments")).toHaveTextContent("existing-doc-1");
    expect(screen.getByTestId("chat-prompt")).toHaveTextContent("bang_diem_hk1.pdf");
    expect(documentApi.uploadDocument).not.toHaveBeenCalled();
  });

  it("shows empty state and error retry when loading documents from Tài liệu", async () => {
    const user = userEvent.setup();
    vi.mocked(documentApi.listDocuments)
      .mockRejectedValueOnce(new Error("Mất kết nối máy chủ"))
      .mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={["/chat/career-universe"]}>
        <Routes>
          <Route path="/chat/career-universe" element={<CareerUniversePage />} />
        </Routes>
      </MemoryRouter>
    );

    await user.click(screen.getByRole("tab", { name: /Từ Tài liệu/i }));

    // Error state with retry button
    expect(await screen.findByText("Mất kết nối máy chủ")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Thử lại/i }));

    // Empty state after retry returns []
    expect(await screen.findByText("Chưa có tài liệu nào")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mở Tài liệu/i })).toBeInTheDocument();
  });

  it("places the Career Tree Reset button at the top corner and reliably resets zoom, pan, and domain selection", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/chat/career-universe"]}>
        <Routes>
          <Route path="/chat/career-universe" element={<CareerUniversePage />} />
        </Routes>
      </MemoryRouter>
    );

    const toolbar = screen.getByTestId("career-canvas-controls");
    expect(toolbar.className).toMatch(/\btop-3\b/);
    expect(toolbar.className).toMatch(/\bleft-3\b/);
    expect(toolbar.className).not.toMatch(/\bbottom-5\b/);

    const resetBtn = screen.getByTestId("career-reset-btn");
    expect(resetBtn).toBeInTheDocument();
    expect(resetBtn.className).toMatch(/min-h-11/);

    const viewport = screen.getByTestId("career-canvas-viewport");
    const zoomLabel = screen.getByTestId("career-zoom-percent");
    const initialTransform = viewport.getAttribute("transform");
    const initialZoomText = zoomLabel.textContent;

    // 1. Zoom in multiple times and verify transform & zoom percentage change
    const zoomInBtn = screen.getByRole("button", { name: /Phóng to/i });
    await user.click(zoomInBtn);
    await user.click(zoomInBtn);
    expect(viewport.getAttribute("transform")).not.toBe(initialTransform);
    expect(zoomLabel.textContent).not.toBe(initialZoomText);

    // 2. Click Reset -> restores initial camera transform & zoom %
    await user.click(resetBtn);
    expect(viewport.getAttribute("transform")).toBe(initialTransform);
    expect(zoomLabel.textContent).toBe(initialZoomText);

    // 3. Select a Career Domain -> skeleton banner disappears
    const domainSelect = screen.getByLabelText("Career Domain") as HTMLSelectElement;
    fireEvent.change(domainSelect, { target: { value: "domain-se" } });
    await waitFor(() => {
      expect(
        screen.queryByText("Chọn nhóm nghề nghiệp để khám phá mạng lưới nghề nghiệp của bạn.")
      ).not.toBeInTheDocument();
    });

    // Zoom while in active domain, then click Reset -> returns to skeleton overview AND keeps faculty/major
    await user.click(zoomInBtn);
    await user.click(resetBtn);

    expect(
      await screen.findByText("Chọn nhóm nghề nghiệp để khám phá mạng lưới nghề nghiệp của bạn.")
    ).toBeInTheDocument();
    expect(domainSelect.value).toBe("");
    expect((screen.getByLabelText("Khoa") as HTMLSelectElement).value).toBe("cns-tt");
    expect((screen.getByLabelText("Ngành") as HTMLSelectElement).value).toBe("cntt");
    expect(viewport.getAttribute("transform")).toBe(initialTransform);
  });

  it("defaults CareerRightPanel closed on mobile viewports and toggles as an overlay drawer with Escape/backdrop close", async () => {
    const user = userEvent.setup();
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      writable: true,
      value: 375,
    });

    try {
      render(
        <MemoryRouter initialEntries={["/chat/career-universe"]}>
          <Routes>
            <Route path="/chat/career-universe" element={<CareerUniversePage />} />
          </Routes>
        </MemoryRouter>
      );

      // Closed by default on mobile so canvas is not crushed
      expect(screen.queryByRole("dialog", { name: /Định Hướng Nghề Nghiệp/i })).not.toBeInTheDocument();
      const openBtn = screen.getByTestId("career-panel-toggle-btn");
      expect(openBtn).toBeInTheDocument();

      // Open drawer
      await user.click(openBtn);
      expect(screen.getByRole("dialog", { name: /Định Hướng Nghề Nghiệp/i })).toBeInTheDocument();
      expect(screen.getByTestId("career-panel-backdrop")).toBeInTheDocument();

      // Close via Escape key
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog", { name: /Định Hướng Nghề Nghiệp/i })).not.toBeInTheDocument();

      // Re-open and close via backdrop click
      await user.click(screen.getByTestId("career-panel-toggle-btn"));
      await user.click(screen.getByTestId("career-panel-backdrop"));
      expect(screen.queryByRole("dialog", { name: /Định Hướng Nghề Nghiệp/i })).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "innerWidth", {
        configurable: true,
        writable: true,
        value: originalWidth,
      });
    }
  });
});
