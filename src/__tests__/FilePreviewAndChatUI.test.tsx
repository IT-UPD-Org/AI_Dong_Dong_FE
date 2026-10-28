import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { CodeBlock } from "../components/chat/CodeBlock";
import { FileCard } from "../components/chat/FileCard";
import { FilePreviewPanel } from "../components/chat/FilePreviewPanel";
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
