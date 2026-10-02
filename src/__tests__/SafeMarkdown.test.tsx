/**
 * SafeMarkdown.test.tsx
 *
 * TODO: File này chỉ dùng trong phase phát triển để verify SafeMarkdown security.
 * Sau khi merge BE và xác nhận hoạt động ổn định trên môi trường thật,
 * cân nhắc giữ lại hoặc xoá bỏ tuỳ chính sách test của team.
 *
 * URL policy của Đông Đông AI:
 *   PASS  → absolute URL với scheme http:// hoặc https://
 *   BLOCK → tất cả URL còn lại:
 *           relative (/about, ./about, ../about),
 *           fragment (#section), query (?q=1),
 *           protocol-relative (//evil.com),
 *           javascript:, data:, vbscript:, file:, ftp:, mailto:, blob:,
 *           và mọi scheme không xác định.
 *
 * Image policy:
 *   BLOCK → ![alt](url)  dù url là gì — kể cả relative, protocol-relative
 *   BLOCK → <img src="...">  raw HTML (skipHtml)
 *   Không tạo network request tới bất kỳ image URL nào.
 *
 * HTML nguy hiểm:
 *   BLOCK → iframe, script, object, embed, form, img  (disallowedElements)
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SafeMarkdown } from "../components/chat/SafeMarkdown";

afterEach(() => cleanup());

function renderMd(content: string) {
  return render(<SafeMarkdown content={content} />);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Trả về href của tất cả anchor trong document (sau render). */
function allHrefs(): string[] {
  return Array.from(document.querySelectorAll("a")).map(
    (a) => a.getAttribute("href") ?? "",
  );
}

// ===========================================================================
// 1. SAFE — Links hợp lệ (absolute http / https)
// ===========================================================================

describe("SAFE – absolute http/https links", () => {
  it("renders https://phuongdong.edu.vn as clickable anchor", () => {
    renderMd("[PDU](https://phuongdong.edu.vn)");
    const link = screen.getByRole("link", { name: "PDU" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://phuongdong.edu.vn/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders http://example.com as clickable anchor", () => {
    renderMd("[site](http://example.com)");
    const link = screen.getByRole("link", { name: "site" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "http://example.com/");
  });

  it("renders https link with path and query intact", () => {
    renderMd("[search](https://google.com/search?q=test)");
    const link = screen.getByRole("link", { name: "search" });
    expect(link).toHaveAttribute("href", "https://google.com/search?q=test");
  });
});

// ===========================================================================
// 2. BLOCK — Relative URLs
// ===========================================================================

describe("BLOCK – relative URLs render as inert span, not anchor", () => {
  const cases: [string, string][] = [
    ["/about", "/about"],
    ["./about", "./about"],
    ["../about", "../about"],
    ["#section", "#section"],
    ["?query=test", "?query=test"],
    ["//evil.example.com", "//evil.example.com"],
  ];

  for (const [url, label] of cases) {
    it(`blocks "${url}"`, () => {
      renderMd(`[${label}](${url})`);
      // Không được có anchor tag
      expect(document.querySelector("a")).toBeNull();
      // Text label vẫn hiển thị
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  }
});

// ===========================================================================
// 3. BLOCK — Dangerous scheme links
// ===========================================================================

describe("BLOCK – dangerous scheme links", () => {
  const dangerousCases: [string, string][] = [
    ["javascript:alert(1)", "xss-js"],
    ["data:text/html,<h1>xss</h1>", "xss-data"],
    ["vbscript:alert(1)", "xss-vbs"],
    ["file:///etc/passwd", "file-link"],
    ["ftp://example.com", "ftp-link"],
    ["mailto:test@example.com", "mailto-link"],
    ["blob:https://example.com/abc-123", "blob-link"],
    ["unknown://example.com", "unknown-link"],
  ];

  for (const [url, label] of dangerousCases) {
    it(`blocks "${url}" — no navigable anchor`, () => {
      renderMd(`[${label}](${url})`);
      // Không được có anchor với href nguy hiểm
      const hrefs = allHrefs();
      hrefs.forEach((href) => {
        expect(href).not.toMatch(/^javascript:/i);
        expect(href).not.toMatch(/^data:/i);
        expect(href).not.toMatch(/^vbscript:/i);
        expect(href).not.toMatch(/^file:/i);
        expect(href).not.toMatch(/^ftp:/i);
        expect(href).not.toMatch(/^mailto:/i);
        expect(href).not.toMatch(/^blob:/i);
        expect(href).not.toMatch(/^unknown:/i);
      });
      // Text label vẫn phải hiện ra
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  }
});

// ===========================================================================
// 4. BLOCK — Markdown images (tất cả dạng URL, kể cả relative/protocol-relative)
// ===========================================================================

describe("BLOCK – Markdown images: không render <img> dù URL là gì", () => {
  const imageCases: [string, string][] = [
    ["![image](https://example.com/a.png)", "absolute https"],
    ["![image](http://example.com/a.png)", "absolute http"],
    ["![image](/a.png)", "root-relative"],
    ["![image](//evil.example/a.png)", "protocol-relative"],
    ['![alt text](https://example.com/a.png "title")', "with title"],
  ];

  for (const [md, desc] of imageCases) {
    it(`does NOT render <img> for "${desc}"`, () => {
      renderMd(md);
      expect(document.querySelector("img")).toBeNull();
    });
  }
});

// ===========================================================================
// 5. BLOCK — Raw HTML <img> tag (skipHtml)
// ===========================================================================

describe("BLOCK – raw HTML <img> tag (skipHtml)", () => {
  it("does NOT render <img> from raw HTML in AI response", () => {
    renderMd('<img src="https://example.com/a.png" alt="test">');
    expect(document.querySelector("img")).toBeNull();
  });

  it("does NOT render <img> with relative src from raw HTML", () => {
    renderMd('<img src="/assets/secret.png">');
    expect(document.querySelector("img")).toBeNull();
  });
});

// ===========================================================================
// 6. BLOCK — Dangerous raw HTML elements (disallowedElements + skipHtml)
// ===========================================================================

describe("BLOCK – dangerous raw HTML elements", () => {
  it("does NOT render <script>", () => {
    renderMd("<script>alert(1)</script>");
    expect(document.querySelector("script")).toBeNull();
  });

  it("does NOT render <iframe>", () => {
    renderMd('<iframe src="https://example.com"></iframe>');
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("does NOT render <object>", () => {
    renderMd('<object data="https://example.com/file.swf"></object>');
    expect(document.querySelector("object")).toBeNull();
  });

  it("does NOT render <embed>", () => {
    renderMd('<embed src="https://example.com/file.swf">');
    expect(document.querySelector("embed")).toBeNull();
  });

  it("does NOT render <form>", () => {
    renderMd('<form action="https://evil.com"><button>submit</button></form>');
    expect(document.querySelector("form")).toBeNull();
  });
});

// ===========================================================================
// 7. SAFE — Standard Markdown elements render correctly
// ===========================================================================

describe("SAFE – standard Markdown elements", () => {
  it("renders heading h1", () => {
    renderMd("# Tiêu đề chính");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Tiêu đề chính");
  });

  it("renders heading h2", () => {
    renderMd("## Mục lớn");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Mục lớn");
  });

  it("renders heading h3", () => {
    renderMd("### Mục nhỏ");
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Mục nhỏ");
  });

  it("renders bold text", () => {
    renderMd("Văn bản **in đậm** ở đây");
    expect(document.querySelector("strong")).toHaveTextContent("in đậm");
  });

  it("renders italic text", () => {
    renderMd("Văn bản *in nghiêng*");
    expect(document.querySelector("em")).toHaveTextContent("in nghiêng");
  });

  it("renders strikethrough (GFM del)", () => {
    renderMd("~~nội dung bị gạch~~");
    expect(document.querySelector("del")).toHaveTextContent("nội dung bị gạch");
  });

  it("renders unordered list", () => {
    renderMd("- Item 1\n- Item 2\n- Item 3");
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Item 1");
  });

  it("renders ordered list", () => {
    renderMd("1. First\n2. Second");
    expect(document.querySelector("ol")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("First");
  });

  it("renders inline code", () => {
    renderMd("Use `npm install` to install");
    expect(document.querySelector("code")).toHaveTextContent("npm install");
  });

  it("renders fenced code block", () => {
    renderMd("```js\nconsole.log('hello')\n```");
    expect(document.querySelector("pre")).toBeInTheDocument();
    expect(document.querySelector("code")).toBeInTheDocument();
  });

  it("renders GFM table", () => {
    renderMd("| A | B |\n|---|---|\n| 1 | 2 |");
    expect(document.querySelector("table")).toBeInTheDocument();
    expect(document.querySelector("thead")).toBeInTheDocument();
    expect(document.querySelector("tbody")).toBeInTheDocument();
  });

  it("renders blockquote", () => {
    renderMd("> Đây là trích dẫn");
    const bq = document.querySelector("blockquote");
    expect(bq).toBeInTheDocument();
    expect(bq).toHaveTextContent("Đây là trích dẫn");
  });

  it("renders horizontal rule", () => {
    renderMd("---");
    expect(document.querySelector("hr")).toBeInTheDocument();
  });
});

// ===========================================================================
// 8. Streaming safety — partial / incomplete Markdown không crash
// ===========================================================================

describe("Streaming – partial Markdown is safe", () => {
  it("renders partial heading without crash", () => {
    expect(() => renderMd("## Đang stream...")).not.toThrow();
  });

  it("renders incomplete link without crash or img", () => {
    expect(() => renderMd("[link text](https://example.c")).not.toThrow();
  });

  it("renders incomplete image without <img>", () => {
    expect(() => renderMd("![alt](https://ex")).not.toThrow();
    expect(document.querySelector("img")).toBeNull();
  });

  it("renders empty string without crash", () => {
    expect(() => renderMd("")).not.toThrow();
  });

  it("renders partial code block without crash", () => {
    expect(() => renderMd("```js\nconsole.log('he")).not.toThrow();
  });
});
