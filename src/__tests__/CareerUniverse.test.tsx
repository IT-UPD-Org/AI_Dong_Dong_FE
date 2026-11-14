import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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
  name: "Sinh Viên IT",
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
  });

  it("updates graph and selectors when a Career Domain is selected", async () => {
    render(
      <MemoryRouter initialEntries={["/chat/career-universe"]}>
        <Routes>
          <Route path="/chat/career-universe" element={<CareerUniversePage />} />
        </Routes>
      </MemoryRouter>
    );

    const comboboxes = screen.getAllByRole("combobox");
    const domainSelect = comboboxes[0];
    fireEvent.change(domainSelect, { target: { value: "domain-se" } });

    // After selection, the occupation dropdown becomes enabled and options are loaded
    await waitFor(() => {
      const occMatches = screen.getAllByText("Backend Developer");
      expect(occMatches.length).toBeGreaterThanOrEqual(1);
    });
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

    // "Cây Nghề Nghiệp - Career Tree" should be present in the expanded subnav
    const careerTreeLink = await screen.findByRole("link", {
      name: /Cây Nghề Nghiệp - Career Tree/i,
    });
    expect(careerTreeLink).toBeInTheDocument();
    expect(careerTreeLink).toHaveAttribute("href", "/chat/career-universe");
  });
});
