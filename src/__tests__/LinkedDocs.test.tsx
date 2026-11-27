import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ApiError } from "../api/client";
import { splitLinkTags, hidePartialTag } from "../lib/linkTags";

vi.mock("../api/document.api", () => ({ documentApi: { getDocument: vi.fn() } }));
vi.mock("../api/library.api", () => ({ libraryApi: { getDocument: vi.fn() } }));

import { documentApi } from "../api/document.api";
import { libraryApi } from "../api/library.api";
import { SafeMarkdown } from "../components/chat/SafeMarkdown";
import { clearLinkedDocCache } from "../components/chat/LinkedDocCard";

const getFile = vi.mocked(documentApi.getDocument);
const getKnowledge = vi.mocked(libraryApi.getDocument);

const userFile = {
  document_id: "111",
  title: "Bao cao",
  filename: "bao-cao.docx",
  file_type: "docs" as const,
  size_bytes: 637133,
  file_url: "https://files.example.com/bao-cao.docx",
  status: "ready" as const,
};
const libDoc = {
  id: "222",
  title: "Quy chế đào tạo",
  description: null,
  filename: "quy-che.pdf",
  content_type: "application/pdf",
  size: 2 * 1024 * 1024,
  file_url: "https://files.example.com/quy-che.pdf",
};

beforeEach(() => {
  clearLinkedDocCache();
  vi.clearAllMocks();
  getFile.mockResolvedValue(userFile);
  getKnowledge.mockResolvedValue(libDoc);
});
afterEach(cleanup);

describe("splitLinkTags", () => {
  it("accepts both tags, quotes, spacing and the long closing form", () => {
    const segments = splitLinkTags(
      `A <LinkFile id="1"/> B <LinkKnowledge id='2' /> C <LinkFile  id = "3" ></LinkFile> D`,
    );
    expect(segments.filter((s) => s.type === "link")).toEqual([
      { type: "link", kind: "file", id: "1" },
      { type: "link", kind: "knowledge", id: "2" },
      { type: "link", kind: "file", id: "3" },
    ]);
  });

  it("ignores non-digit ids and extra attributes", () => {
    for (const bad of [
      '<LinkFile id="abc"/>',
      '<LinkFile id="1 onload=alert(1)"/>',
      '<LinkFile id="1" onclick="x"/>',
      '<LinkFile id=1/>',
      '<LinkFile id="1"/ >',
      '<linkfile id="1"/>',
      '<LinkFile id=""/>',
    ]) {
      expect(splitLinkTags(bad).some((s) => s.type === "link"), bad).toBe(false);
    }
  });

  it("drops a bare list marker left behind by a tag-only list item", () => {
    const segments = splitLinkTags('- <LinkFile id="1"/>\n- <LinkKnowledge id="2"/>');
    expect(segments.map((s) => s.type)).toEqual(["link", "link"]);
  });

  it("leaves tags inside code as text", () => {
    expect(splitLinkTags('`<LinkFile id="1"/>`').some((s) => s.type === "link")).toBe(false);
    expect(splitLinkTags('```\n<LinkFile id="1"/>\n```').some((s) => s.type === "link")).toBe(false);
  });

  it("hides a trailing unfinished tag but keeps normal text", () => {
    for (const partial of ["<", "<Li", "<LinkFi", "<LinkFile", '<LinkFile id="12', '<LinkFile id="12"', '<LinkFile id="12"/', '<LinkKnowledge id=\'5\'>', '<LinkFile id="1"></LinkFi']) {
      expect(hidePartialTag(`Xin chào ${partial}`), partial).toBe("Xin chào ");
    }
    expect(hidePartialTag("a < b")).toBe("a < b");
    expect(hidePartialTag("Tôi dùng <Link to> ở đây")).toBe("Tôi dùng <Link to> ở đây");
  });
});

describe("SafeMarkdown link tags", () => {
  it("renders a user file as the file card with metadata", async () => {
    render(<SafeMarkdown content={'Đây là file: <LinkFile id="111"/>'} onPreviewFile={vi.fn()} />);
    expect(screen.getByRole("status")).toBeInTheDocument(); // skeleton first
    expect(await screen.findByText("Bao cao.docx")).toBeInTheDocument();
    expect(screen.getByText("DOCX")).toBeInTheDocument();
    expect(screen.getByText("622.2 KB")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Xem ngay/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tải xuống/ })).toBeInTheDocument();
    expect(screen.getByText(/Đây là file/)).toBeInTheDocument();
    expect(getFile).toHaveBeenCalledWith("111");
  });

  it("renders a knowledge document and previews it with the safe url", async () => {
    const onPreview = vi.fn();
    render(<SafeMarkdown content={'<LinkKnowledge id="222"/>'} onPreviewFile={onPreview} />);
    expect(await screen.findByText("Quy chế đào tạo.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Xem ngay/ }));
    expect(onPreview).toHaveBeenCalledWith(
      expect.objectContaining({ url: "https://files.example.com/quy-che.pdf", extension: "pdf", size: 2 * 1024 * 1024 }),
    );
    expect(getKnowledge).toHaveBeenCalledWith("222");
  });

  it("shows a muted unavailable card on 404 and 403", async () => {
    getFile.mockRejectedValue(new ApiError("not found", 404));
    getKnowledge.mockRejectedValue(new ApiError("forbidden", 403));
    render(<SafeMarkdown content={'<LinkFile id="1"/>\n\n<LinkKnowledge id="2"/>'} />);
    expect(await screen.findAllByText("Tài liệu không khả dụng")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: /Tải xuống/ })).not.toBeInTheDocument();
  });

  it("offers a retry after a temporary failure and does not cache it", async () => {
    getFile.mockRejectedValueOnce(new ApiError("boom", 500));
    render(<SafeMarkdown content={'<LinkFile id="111"/>'} />);
    fireEvent.click(await screen.findByRole("button", { name: /Thử lại/ }));
    expect(await screen.findByText("Bao cao.docx")).toBeInTheDocument();
    expect(getFile).toHaveBeenCalledTimes(2);
  });

  it("ignores invalid and injected tags: no fetch, no HTML", () => {
    const { container } = render(
      <SafeMarkdown content={'<LinkFile id="1 onerror=alert(1)"/> <LinkFile id="x"/> <script>alert(1)</script> <img src=x onerror=alert(1)>'} />,
    );
    expect(getFile).not.toHaveBeenCalled();
    expect(getKnowledge).not.toHaveBeenCalled();
    expect(container.querySelector("script, img, linkfile")).toBeNull();
  });

  it("never uses a non-http file_url", async () => {
    getKnowledge.mockResolvedValue({ ...libDoc, file_url: "javascript:alert(1)" });
    getFile.mockResolvedValue({ ...userFile, file_url: "javascript:alert(1)" });
    const onPreview = vi.fn();
    render(<SafeMarkdown content={'<LinkFile id="111"/>\n\n<LinkKnowledge id="222"/>'} onPreviewFile={onPreview} />);
    await screen.findByText("Bao cao.docx");
    // knowledge docs need a usable url; user files fall back to the authenticated API path
    expect(await screen.findByText("Tài liệu không khả dụng")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Xem ngay/ }));
    expect(onPreview.mock.calls[0][0].url).not.toMatch(/^javascript:/);
    expect(onPreview.mock.calls[0][0].url).toMatch(/\/api\/files\/111$/);
  });

  it("hides a partial tag while streaming", () => {
    const { container } = render(<SafeMarkdown content={'Đang soạn <LinkFile id="12'} />);
    expect(container.textContent).toBe("Đang soạn");
    expect(getFile).not.toHaveBeenCalled();
  });

  it("fetches each document once, even when repeated across messages", async () => {
    render(
      <>
        <SafeMarkdown content={'<LinkFile id="111"/> và lại <LinkFile id="111"/>'} />
        <SafeMarkdown content={'- mục <LinkFile id="111"/>\n- <LinkKnowledge id="222"/>'} />
      </>,
    );
    await waitFor(() => expect(screen.getAllByText("Bao cao.docx")).toHaveLength(3));
    expect(await screen.findByText("Quy chế đào tạo.pdf")).toBeInTheDocument();
    expect(getFile).toHaveBeenCalledTimes(1);
    expect(getKnowledge).toHaveBeenCalledTimes(1);
  });

  it("keeps surrounding markdown around a card mid-paragraph", async () => {
    render(<SafeMarkdown content={'Trước **đậm** <LinkFile id="111"/> sau _nghiêng_'} />);
    expect(await screen.findByText("Bao cao.docx")).toBeInTheDocument();
    expect(screen.getByText("đậm").tagName).toBe("STRONG");
    expect(screen.getByText("nghiêng").tagName).toBe("EM");
  });
});