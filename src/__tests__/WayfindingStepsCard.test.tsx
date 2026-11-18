import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import rawCampus from "../features/campus-map/data/minh-khai.campus.json";
import { buildWayfindingDatasets } from "../features/campus-map/data/export-wayfinding-json.mjs";
import { WayfindingStepsCard } from "../components/chat/WayfindingStepsCard";
import { ChatPage } from "../pages/ChatPage";
import type { WayfindingRoutePayload } from "../api/types";

const mockWayfindingQuery = vi.fn();
const mockStreamChatMessage = vi.fn();

vi.mock("../api/wayfinding.api", () => ({
  wayfindingApi: {
    query: (...args: unknown[]) => mockWayfindingQuery(...args),
  },
}));

vi.mock("../services/chat.service", () => ({
  streamChatMessage: (...args: unknown[]) => mockStreamChatMessage(...args),
  getConversationState: vi.fn().mockResolvedValue({ messages: [], asyncStatus: "none" }),
}));

vi.mock("../api/document.api", () => ({
  documentApi: {
    listDocuments: vi.fn().mockResolvedValue([]),
    subscribe: vi.fn().mockReturnValue(() => {}),
    getDocument: vi.fn(),
  },
}));

vi.mock("../api/chat.api", () => ({
  chatApi: {
    patchTitle: vi.fn().mockResolvedValue(undefined),
    stopReply: vi.fn().mockResolvedValue(undefined),
    resumeReply: vi.fn(),
    getConversations: vi.fn().mockResolvedValue([]),
  },
  mapLevelToModelType: () => "standard",
}));

vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "1", email: "sv@pduni.edu.vn", name: "Sinh Viên", role: "student" },
    isAuthenticated: true,
    isAdmin: false,
    isLoading: false,
  }),
}));

const sampleRouteOk: WayfindingRoutePayload = {
  status: "ok",
  answer: "Bạn đi từ Phòng 101 lên Cầu thang chính tới Tầng 2 rồi rẽ vào Phòng 201.",
  start_assumed: true,
  start: {
    id: "A-F1-VP-SANH",
    code: null,
    name: "Sảnh",
    area_id: "A",
    area_name: "Tòa A",
    floor_level: 1,
    floor_name: "Tầng 1",
  },
  destination: {
    id: "A201",
    code: "A201",
    name: "Phòng 201 – Phòng máy",
    area_id: "A",
    area_name: "Tòa A",
    floor_level: 2,
    floor_name: "Tầng 2",
  },
  steps: [
    {
      step_index: 1,
      kind: "start",
      area_id: "A",
      area_name: "Tòa A",
      floor_level: 1,
      floor_name: "Tầng 1",
      node_id: "A-F1-VP-SANH",
      label: "Sảnh",
      instruction: "Bắt đầu từ Sảnh (Khối văn phòng, Tầng 1, Tòa A).",
    },
    {
      step_index: 2,
      kind: "corridor",
      area_id: "A",
      area_name: "Tòa A",
      floor_level: 1,
      floor_name: "Tầng 1",
      node_id: "A-F1-CT-CHINH",
      label: "Cầu thang chính",
      instruction: "Đi theo hành lang Tầng 1 tới Cầu thang chính.",
    },
    {
      step_index: 3,
      kind: "stair",
      area_id: "A",
      area_name: "Tòa A",
      floor_level: 2,
      floor_name: "Tầng 2",
      node_id: "A-F2-CT-CHINH",
      label: "Cầu thang chính (Tầng 2)",
      instruction: "Đi Cầu thang chính từ Tầng 1 lên Tầng 2.",
    },
    {
      step_index: 4,
      kind: "arrive",
      area_id: "A",
      area_name: "Tòa A",
      floor_level: 2,
      floor_name: "Tầng 2",
      node_id: "A201",
      label: "Phòng 201 – Phòng máy (A201)",
      instruction: "Từ hành lang Tầng 2 (Tòa A) đi tới Phòng 201 – Phòng máy (A201).",
    },
  ],
  candidates: [],
  error_code: null,
  error_message: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

afterEach(() => {
  cleanup();
});

describe("buildWayfindingDatasets (rooms.json & stairs.json normalization)", () => {
  it("normalizes Khu > Tang > Phong/Cau thang without inventing Floor 5 stairs or Building B/D links", () => {
    const { rooms, stairs } = buildWayfindingDatasets(rawCampus);

    const areaA = rooms.areas.find((a) => a.area_id === "A");
    const areaB = rooms.areas.find((a) => a.area_id === "B");
    expect(areaA).toBeDefined();
    expect(areaA!.floors).toHaveLength(6);
    expect(areaB?.floors).toEqual([]);
    expect(areaA!.inter_area_links).toEqual([]);

    const lobby = areaA!.floors[0].rooms.find((r) => r.id === "A-F1-VP-SANH");
    expect(lobby?.aliases).toContain("Lối vào chính");

    const x01Matches = areaA!.floors
      .flatMap((f) => f.rooms)
      .filter((r) => r.aliases.includes("X01"))
      .map((r) => r.id);
    expect(x01Matches).toEqual(["A201", "A301", "A401"]);

    const stairsA = stairs.areas.find((a) => a.area_id === "A");
    const f1MainStair = stairsA!.floors[0].stairs.find((s) => s.id === "A-F1-CT-CHINH");
    const f5Stairs = stairsA!.floors.find((f) => f.floor_level === 5)?.stairs ?? [];
    expect(f1MainStair?.connects_to_floors).toEqual([1, 2, 3, 4, 6]);
    expect(f5Stairs).toEqual([]);
  });
});

describe("WayfindingStepsCard", () => {
  it("renders ordered steps, assumed start banner, and map link", () => {
    render(
      <MemoryRouter>
        <WayfindingStepsCard wayfinding={sampleRouteOk} />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("wayfinding-steps-card")).toBeInTheDocument();
    expect(screen.getByText(/Lộ trình từng bước \(4 bước\)/)).toBeInTheDocument();
    expect(screen.getByText(/Điểm xuất phát mặc định:/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Xem bản đồ/i })).toHaveAttribute("href", "/map?room=A201");

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
    expect(items[0]).toHaveTextContent("Xuất phát");
    expect(items[2]).toHaveTextContent("Cầu thang");
    expect(items[3]).toHaveTextContent("Đích");
  });

  it("renders ambiguous candidates and invokes onSelectCandidate when clicked", () => {
    const onSelect = vi.fn();
    render(
      <MemoryRouter>
        <WayfindingStepsCard
          onSelectCandidate={onSelect}
          wayfinding={{
            status: "ambiguous",
            answer: "Có nhiều phòng khớp với X01.",
            start_assumed: false,
            start: null,
            destination: null,
            steps: [],
            candidates: [
              { id: "A201", code: "A201", name: "Phòng 201", area_id: "A", area_name: "Tòa A", floor_level: 2, floor_name: "Tầng 2" },
              { id: "A301", code: "A301", name: "Phòng 301", area_id: "A", area_name: "Tòa A", floor_level: 3, floor_name: "Tầng 3" },
            ],
            error_code: null,
            error_message: null,
          }}
        />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: /A301/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].id).toBe("A301");
  });

  it("renders structured error card for no_path and returns null for not_wayfinding", () => {
    const { rerender } = render(
      <MemoryRouter>
        <WayfindingStepsCard
          wayfinding={{
            status: "no_path",
            answer: "Tầng 5 chưa có cầu thang.",
            start_assumed: true,
            start: null,
            destination: null,
            steps: [],
            candidates: [],
            error_code: "no_stair_on_destination_floor",
            error_message: "Tầng 5 (Tòa A) chưa có cầu thang kết nối.",
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("wayfinding-error-card")).toBeInTheDocument();
    expect(screen.getByText(/Tầng 5 \(Tòa A\) chưa có cầu thang kết nối\./)).toBeInTheDocument();

    rerender(
      <MemoryRouter>
        <WayfindingStepsCard
          wayfinding={{
            status: "not_wayfinding",
            answer: "",
            start_assumed: false,
            start: null,
            destination: null,
            steps: [],
            candidates: [],
            error_code: null,
            error_message: null,
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId("wayfinding-steps-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("wayfinding-error-card")).not.toBeInTheDocument();
  });
});

describe("ChatPage wayfinding integration", () => {
  const renderChat = () =>
    render(
      <MemoryRouter initialEntries={["/chat"]}>
        <Routes>
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/c/:id" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>,
    );

  it("shows structured route steps for a wayfinding question without calling normal chat stream", async () => {
    const user = userEvent.setup();
    mockWayfindingQuery.mockResolvedValueOnce(sampleRouteOk);

    renderChat();

    const textbox = screen.getByPlaceholderText(/Hãy hỏi bất cứ điều gì/i);
    await user.type(textbox, "Đường đi tới phòng A201?");
    await user.click(screen.getByRole("button", { name: /Gửi/i }));

    expect(await screen.findByTestId("wayfinding-steps-card")).toBeInTheDocument();
    expect(screen.getByText(/Bạn đi từ Phòng 101 lên Cầu thang chính tới Tầng 2/)).toBeInTheDocument();
    expect(mockWayfindingQuery).toHaveBeenCalledTimes(1);
    expect(mockStreamChatMessage).not.toHaveBeenCalled();
  });

  it("delegates non-wayfinding questions to the existing chat stream unchanged", async () => {
    const user = userEvent.setup();
    mockWayfindingQuery.mockResolvedValueOnce({
      status: "not_wayfinding",
      answer: "",
      start_assumed: false,
      start: null,
      destination: null,
      steps: [],
      candidates: [],
      error_code: null,
      error_message: null,
    });
    mockStreamChatMessage.mockImplementationOnce(async (_payload, _onChunk, onFinish) => {
      onFinish({
        id: "reply-1",
        role: "assistant",
        content: "BFS là thuật toán tìm kiếm theo chiều rộng.",
        status: "completed",
      });
    });

    renderChat();

    const textbox = screen.getByPlaceholderText(/Hãy hỏi bất cứ điều gì/i);
    await user.type(textbox, "Giải thích thuật toán BFS là gì?");
    await user.click(screen.getByRole("button", { name: /Gửi/i }));

    await waitFor(() => expect(mockStreamChatMessage).toHaveBeenCalledTimes(1));
    expect(await screen.findByText(/BFS là thuật toán tìm kiếm theo chiều rộng\./)).toBeInTheDocument();
    expect(screen.queryByTestId("wayfinding-steps-card")).not.toBeInTheDocument();
  });

  it("clarifies an ambiguous room when the user clicks a candidate chip", async () => {
    const user = userEvent.setup();
    mockWayfindingQuery
      .mockResolvedValueOnce({
        status: "ambiguous",
        answer: "Có nhiều phòng đích khớp với câu hỏi của bạn.",
        start_assumed: false,
        start: null,
        destination: null,
        steps: [],
        candidates: [
          { id: "A201", code: "A201", name: "Phòng 201 – Phòng máy", area_id: "A", area_name: "Tòa A", floor_level: 2, floor_name: "Tầng 2" },
          { id: "A301", code: "A301", name: "Phòng 301 – Phòng máy", area_id: "A", area_name: "Tòa A", floor_level: 3, floor_name: "Tầng 3" },
        ],
        error_code: null,
        error_message: null,
      })
      .mockResolvedValueOnce({
        ...sampleRouteOk,
        destination: {
          id: "A301",
          code: "A301",
          name: "Phòng 301 – Phòng máy",
          area_id: "A",
          area_name: "Tòa A",
          floor_level: 3,
          floor_name: "Tầng 3",
        },
      });

    renderChat();

    const textbox = screen.getByPlaceholderText(/Hãy hỏi bất cứ điều gì/i);
    await user.type(textbox, "Phòng X01 ở đâu?");
    await user.click(screen.getByRole("button", { name: /Gửi/i }));

    const a301Btn = await screen.findByRole("button", { name: /A301/i });
    await user.click(a301Btn);

    expect(await screen.findByTestId("wayfinding-steps-card")).toBeInTheDocument();
    expect(mockWayfindingQuery).toHaveBeenCalledTimes(2);
    expect(mockStreamChatMessage).not.toHaveBeenCalled();
  });
});
