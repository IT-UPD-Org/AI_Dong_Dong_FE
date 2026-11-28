import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CodeBlock } from "../components/chat/CodeBlock";
import {
  ConversationScrollbar,
  SCROLLBAR_HIDE_DELAY_MS,
  type ScrollbarItem,
} from "../components/chat/ConversationScrollbar";
import { FileCard } from "../components/chat/FileCard";
import { FilePreviewPanel } from "../components/chat/FilePreviewPanel";
import { ModifiedPromptInput } from "../components/chat/ModifiedPromptInput";
import { SafeMarkdown } from "../components/chat/SafeMarkdown";
import {
  getFileExtension,
  isSupportedPreviewExtension,
  canPreviewDirectly,
  getFileCategory,
  formatBytes,
  parseCsv,
  PreviewFile,
} from "../lib/filePreviewUtils";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ===========================================================================
// 1. filePreviewUtils tests
// ===========================================================================
describe("filePreviewUtils", () => {
  it("extracts file extensions correctly", () => {
    expect(getFileExtension("report.pdf")).toBe("pdf");
    expect(getFileExtension("data.analysis.csv")).toBe("csv");
    expect(getFileExtension("https://example.com/files/test.docx?token=123#sec")).toBe("docx");
    expect(getFileExtension("archive.xlsx")).toBe("xlsx");
    expect(getFileExtension("noextension")).toBe("");
  });

  it("checks supported preview extensions", () => {
    expect(isSupportedPreviewExtension("pdf")).toBe(true);
    expect(isSupportedPreviewExtension(".docx")).toBe(true);
    expect(isSupportedPreviewExtension("xlsx")).toBe(true);
    expect(isSupportedPreviewExtension("xls")).toBe(true);
    expect(isSupportedPreviewExtension("csv")).toBe(true);
    expect(isSupportedPreviewExtension("doc")).toBe(true);
    expect(isSupportedPreviewExtension("exe")).toBe(false);
  });

  it("checks direct in-browser preview support", () => {
    expect(canPreviewDirectly("pdf")).toBe(true);
    expect(canPreviewDirectly("docx")).toBe(true);
    expect(canPreviewDirectly("xlsx")).toBe(true);
    expect(canPreviewDirectly("csv")).toBe(true);
    // .doc binary cannot be rendered directly, requires fallback
    expect(canPreviewDirectly("doc")).toBe(false);
  });

  it("categorizes files accurately", () => {
    expect(getFileCategory("pdf")).toBe("pdf");
    expect(getFileCategory("docx")).toBe("word");
    expect(getFileCategory("doc")).toBe("word");
    expect(getFileCategory("xlsx")).toBe("excel");
    expect(getFileCategory("xls")).toBe("excel");
    expect(getFileCategory("csv")).toBe("csv");
    expect(getFileCategory("png")).toBe("image");
  });

  it("formats byte sizes cleanly", () => {
    expect(formatBytes(0)).toBe("");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(2500000, 1)).toBe("2.4 MB");
  });

  it("parses CSV content with headers, rows, and delimiters", () => {
    const csvContent = `Name,Age,Role\nNguyen Van A,21,Student\nTran Thi B,22,Teacher`;
    const result = parseCsv(csvContent);
    expect(result.headers).toEqual(["Name", "Age", "Role"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual(["Nguyen Van A", "21", "Student"]);
    expect(result.rows[1]).toEqual(["Tran Thi B", "22", "Teacher"]);
    expect(result.totalRows).toBe(2);
  });

  it("parses CSV with quoted strings and semicolons", () => {
    const csvContent = `"ID";"Description";"Price"\n"1";"Item A, with comma";"100"\n"2";"Item B";"200"`;
    const result = parseCsv(csvContent);
    expect(result.headers).toEqual(["ID", "Description", "Price"]);
    expect(result.rows[0]).toEqual(["1", "Item A, with comma", "100"]);
  });
});

// ===========================================================================
// 2. CodeBlock component tests
// ===========================================================================
describe("CodeBlock", () => {
  it("renders code block with language label and copy button", () => {
    render(
      <CodeBlock className="language-python">
        {`print("Hello World")`}
      </CodeBlock>
    );

    expect(screen.getByText("python")).toBeInTheDocument();
    expect(screen.getByText('print("Hello World")')).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sao chép mã" })).toBeInTheDocument();
  });

  it("copies code to clipboard and updates state", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(
      <CodeBlock className="language-javascript">
        {`const x = 42;`}
      </CodeBlock>
    );

    const copyBtn = screen.getByRole("button", { name: "Sao chép mã" });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith("const x = 42;");
      expect(screen.getByText("Đã sao chép!")).toBeInTheDocument();
    });
  });
});

// ===========================================================================
// 3. FileCard component tests
// ===========================================================================
describe("FileCard", () => {
  const samplePdf: PreviewFile = {
    id: "doc-1",
    name: "Tai_Lieu_Huong_Dan.pdf",
    url: "https://example.com/files/guide.pdf",
    extension: "pdf",
    size: 204800, // 200 KB
  };

  it("renders file information accurately", () => {
    render(<FileCard file={samplePdf} />);
    expect(screen.getByText("Tai_Lieu_Huong_Dan.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(screen.getByText("200 KB")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tải xuống/i })).toBeInTheDocument();
  });

  it("triggers onPreview when 'Xem ngay' button is clicked", () => {
    const previewMock = vi.fn();
    render(<FileCard file={samplePdf} onPreview={previewMock} />);

    const previewBtn = screen.getByRole("button", { name: /Xem ngay/i });
    fireEvent.click(previewBtn);
    expect(previewMock).toHaveBeenCalledWith(samplePdf);
  });
});

// ===========================================================================
// 4. FilePreviewPanel component tests
// ===========================================================================
describe("FilePreviewPanel", () => {
  it("renders toolbar with filename and close button", () => {
    const sampleDoc: PreviewFile = {
      id: "doc-legacy",
      name: "VanBanCu.doc",
      url: "https://example.com/vanban.doc",
      extension: "doc",
      size: 51200,
    };
    const closeMock = vi.fn();

    render(<FilePreviewPanel file={sampleDoc} onClose={closeMock} />);

    expect(screen.getByText("VanBanCu.doc")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đóng xem trước file" })).toBeInTheDocument();

    // Word .doc shows legacy explanation
    expect(screen.getByText("Định dạng Word .doc cũ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tải xuống file \.doc/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Đóng xem trước file" }));
    expect(closeMock).toHaveBeenCalledTimes(1);
  });

  it("closes preview panel when pressing Escape", () => {
    const sampleDoc: PreviewFile = {
      id: "doc-legacy-esc",
      name: "VanBanCu.doc",
      url: "https://example.com/vanban.doc",
      extension: "doc",
      size: 51200,
    };
    const closeMock = vi.fn();

    render(<FilePreviewPanel file={sampleDoc} onClose={closeMock} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(closeMock).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// 4b. ModifiedPromptInput streaming & stop controls
// ===========================================================================
describe("ModifiedPromptInput", () => {
  it("switches send button to stop button while streaming and invokes onStop", () => {
    const onStop = vi.fn();
    render(
      <ModifiedPromptInput
        value=""
        onChange={vi.fn()}
        onSubmit={vi.fn()}
        loading={true}
        streaming={true}
        onStop={onStop}
        level="L2"
        onLevelChange={vi.fn()}
      />
    );

    const stopBtn = screen.getByRole("button", { name: /Dừng trả lời|Stop/i });
    expect(stopBtn).toBeInTheDocument();
    fireEvent.click(stopBtn);
    expect(onStop).toHaveBeenCalledTimes(1);
  });
});

// ===========================================================================
// 5. SafeMarkdown integration tests
// ===========================================================================
describe("SafeMarkdown Typography & Preview integration", () => {
  it("renders code block with Copy button inside pre/code tags", () => {
    render(
      <SafeMarkdown content={"```bash\ncurl -X GET https://api.example.com\n```"} />
    );

    expect(document.querySelector("pre")).toBeInTheDocument();
    expect(document.querySelector("code")).toBeInTheDocument();
    expect(screen.getByText("bash")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sao chép mã" })).toBeInTheDocument();
  });

  it("renders file link as interactive FileCard when onPreviewFile is passed", () => {
    const onPreviewMock = vi.fn();
    render(
      <SafeMarkdown
        content={"Xem tài liệu tại [BaoCao.xlsx](https://example.com/files/BaoCao.xlsx)"}
        onPreviewFile={onPreviewMock}
      />
    );

    expect(screen.getByText("BaoCao.xlsx")).toBeInTheDocument();
    expect(screen.getByText("XLSX")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xem ngay/i })).toBeInTheDocument();
  });
});

// ===========================================================================
// 6. ConversationScrollbar hover-to-reveal + 10s delayed auto-hide tests
// ===========================================================================
describe("ConversationScrollbar", () => {
  const sampleItems: ScrollbarItem[] = [
    { id: "msg-1", label: "Lịch thi học kỳ 1 khi nào?", top: 15 },
    { id: "msg-2", label: "Hướng dẫn đăng ký tín chỉ", top: 50 },
    { id: "msg-3", label: "Đường đi đến phòng A203", top: 85 },
  ];

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when there are no chat items", () => {
    const { container } = render(
      <ConversationScrollbar items={[]} activeId={null} onSelect={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("hides chat points initially while keeping the right scroll rail hoverable, and reveals them on hover", () => {
    vi.useFakeTimers();
    const onSelect = vi.fn();

    render(
      <ConversationScrollbar
        items={sampleItems}
        activeId="msg-2"
        onSelect={onSelect}
      />
    );

    const scrollbar = screen.getByTestId("conversation-scrollbar");
    const rail = screen.getByTestId("conversation-scrollbar-rail");
    const points = screen.getByTestId("conversation-scrollbar-points");

    expect(scrollbar).toBeInTheDocument();
    expect(rail).toBeInTheDocument();
    expect(scrollbar).toHaveAttribute("data-state", "hidden");
    expect(points).toHaveAttribute("aria-hidden", "true");
    expect(points).toHaveClass("opacity-0", "pointer-events-none");
    expect(
      screen.queryByRole("button", { name: "Lịch thi học kỳ 1 khi nào?" })
    ).not.toBeInTheDocument();

    // Hovering the right-side scroll rail reveals all chat points
    fireEvent.mouseEnter(scrollbar);

    expect(scrollbar).toHaveAttribute("data-state", "visible");
    expect(points).toHaveAttribute("aria-hidden", "false");
    expect(points).toHaveClass("opacity-100", "pointer-events-auto");

    const firstPoint = screen.getByRole("button", {
      name: "Lịch thi học kỳ 1 khi nào?",
    });
    const activePoint = screen.getByRole("button", {
      name: "Hướng dẫn đăng ký tín chỉ",
    });
    expect(firstPoint).toBeInTheDocument();
    expect(activePoint).toHaveAttribute("aria-current", "location");

    // Hovering a chat point displays its prompt preview tooltip and clicking selects it
    fireEvent.mouseEnter(firstPoint);
    expect(screen.getByRole("tooltip")).toHaveTextContent(
      "Lịch thi học kỳ 1 khi nào?"
    );

    fireEvent.click(firstPoint);
    expect(onSelect).toHaveBeenCalledWith("msg-1");
  });

  it("keeps chat points visible for 9,999ms after mouse leaves and hides them at 10,000ms", () => {
    vi.useFakeTimers();
    expect(SCROLLBAR_HIDE_DELAY_MS).toBe(10_000);

    render(
      <ConversationScrollbar
        items={sampleItems}
        activeId="msg-1"
        onSelect={vi.fn()}
      />
    );

    const scrollbar = screen.getByTestId("conversation-scrollbar");
    const points = screen.getByTestId("conversation-scrollbar-points");

    fireEvent.mouseEnter(scrollbar);
    expect(scrollbar).toHaveAttribute("data-state", "visible");

    // Mouse moves away from scrollbar -> must NOT hide immediately
    fireEvent.mouseLeave(scrollbar);
    expect(scrollbar).toHaveAttribute("data-state", "visible");
    expect(points).toHaveClass("opacity-100");

    // Still visible at 9,999ms
    act(() => {
      vi.advanceTimersByTime(9_999);
    });
    expect(scrollbar).toHaveAttribute("data-state", "visible");
    expect(points).toHaveClass("opacity-100");

    // Hidden at exactly 10,000ms
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(scrollbar).toHaveAttribute("data-state", "hidden");
    expect(points).toHaveAttribute("aria-hidden", "true");
    expect(points).toHaveClass("opacity-0", "pointer-events-none");
  });

  it("does not count down while hovered on the rail, a chat point, or its preview tooltip, and resets the full 10s delay on re-enter", () => {
    vi.useFakeTimers();

    render(
      <ConversationScrollbar
        items={sampleItems}
        activeId="msg-2"
        onSelect={vi.fn()}
      />
    );

    const scrollbar = screen.getByTestId("conversation-scrollbar");
    const points = screen.getByTestId("conversation-scrollbar-points");

    // Hover rail and stay well past 10s -> must remain visible
    fireEvent.mouseEnter(scrollbar);
    act(() => {
      vi.advanceTimersByTime(25_000);
    });
    expect(scrollbar).toHaveAttribute("data-state", "visible");

    // Leave rail, wait 6s, then re-enter a chat point before 10s expires -> cancels countdown
    fireEvent.mouseLeave(scrollbar);
    act(() => {
      vi.advanceTimersByTime(6_000);
    });
    expect(scrollbar).toHaveAttribute("data-state", "visible");

    const secondPoint = screen.getByRole("button", {
      name: "Hướng dẫn đăng ký tín chỉ",
    });
    fireEvent.mouseEnter(secondPoint);

    // Stay hovered on the chat point well past 10s -> no countdown!
    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(scrollbar).toHaveAttribute("data-state", "visible");
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("Hướng dẫn đăng ký tín chỉ");

    // Moving from chat point onto its preview tooltip keeps points & tooltip visible with no countdown
    fireEvent.mouseLeave(secondPoint, { relatedTarget: tooltip });
    fireEvent.mouseEnter(tooltip);
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(scrollbar).toHaveAttribute("data-state", "visible");
    expect(screen.getByRole("tooltip")).toBeInTheDocument();

    // Leaving the tooltip outside the scrollbar starts a fresh full 10s countdown
    fireEvent.mouseLeave(tooltip);
    act(() => {
      vi.advanceTimersByTime(9_999);
    });
    expect(scrollbar).toHaveAttribute("data-state", "visible");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(scrollbar).toHaveAttribute("data-state", "hidden");
    expect(points).toHaveClass("opacity-0", "pointer-events-none");
  });

  it("handles keyboard focus/blur gracefully and cleans up pending hide timers on unmount", () => {
    vi.useFakeTimers();

    const { unmount } = render(
      <ConversationScrollbar
        items={sampleItems}
        activeId="msg-1"
        onSelect={vi.fn()}
      />
    );

    const scrollbar = screen.getByTestId("conversation-scrollbar");

    fireEvent.focus(scrollbar);
    expect(scrollbar).toHaveAttribute("data-state", "visible");

    // Still visible well past 10s while focused
    act(() => {
      vi.advanceTimersByTime(15_000);
    });
    expect(scrollbar).toHaveAttribute("data-state", "visible");

    // Blur starts the 10s timer; unmounting before it fires should cleanly cancel it without errors
    fireEvent.blur(scrollbar);
    unmount();
    expect(() => {
      act(() => {
        vi.advanceTimersByTime(15_000);
      });
    }).not.toThrow();
  });
});
