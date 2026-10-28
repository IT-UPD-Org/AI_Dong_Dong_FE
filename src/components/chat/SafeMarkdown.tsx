/**
 * SafeMarkdown.tsx
 *
 * Renders AI response Markdown safely in the presentation layer.
 *
 * Security guarantees:
 * - Images (![alt](url) and <img>) → stripped from output, never fetched
 * - Raw HTML (<iframe>, <script>, <object>, <embed>, <form>, <img>) → skipped via skipHtml=true + components override
 * - Links: only http:// and https:// are allowed; javascript:, data:, vbscript:, file: and
 *   unknown schemes are stripped (href set to "" so link is inert)
 * - URL validation uses the browser's built-in URL constructor (not regex alone)
 * - Streaming-safe: renders partial Markdown without crashing or causing side-effects
 *
 * Non-goals:
 * - Does NOT modify the raw Markdown string (caller always retains original)
 * - Does NOT handle user image uploads or OCR
 */

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { CodeBlock } from "./CodeBlock";
import { FileCard } from "./FileCard";
import {
  PreviewFile,
  getFileExtension,
  isSupportedPreviewExtension,
} from "../../lib/filePreviewUtils";

const ALLOWED_SCHEMES = new Set(["http:", "https:"]);
function safeHref(href: string | null | undefined): string {
  if (!href) return "";
  try {
    const url = new URL(href);
    if (!ALLOWED_SCHEMES.has(url.protocol)) {
      return "";
    }

    return url.href;
  } catch {
    return "";
  }
}

interface SafeMarkdownProps {
  content: string;
  className?: string;
  onPreviewFile?: (file: PreviewFile) => void;
}

export function SafeMarkdown({ content, className, onPreviewFile }: SafeMarkdownProps) {
  const markdownComponents: Components = {
    img() {
      return null;
    },

    a({ href, children }) {
      const safe = safeHref(href);
      if (!safe) {
        return <span className="text-[#04714a]">{children}</span>;
      }

      const ext = getFileExtension(safe);
      const isFile = isSupportedPreviewExtension(ext);

      if (isFile && onPreviewFile) {
        const fileName = typeof children === "string" ? children : safe.split("/").pop() || "Tài liệu";
        return (
          <span className="my-1.5 block w-full max-w-md not-prose">
            <FileCard
              file={{
                name: fileName,
                url: safe,
                extension: ext,
                source: "link",
              }}
              onPreview={onPreviewFile}
            />
          </span>
        );
      }

      return (
        <a
          href={safe}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#04714a] underline underline-offset-2 hover:text-[#035e3f] break-all"
        >
          {children}
        </a>
      );
    },

    h1({ children }) {
      return (
        <h1 className="mb-2 mt-4 text-[1.45em] font-bold tracking-tight text-[#11130f] first:mt-0 leading-tight">
          {children}
        </h1>
      );
    },
    h2({ children }) {
      return (
        <h2 className="mb-1.5 mt-3.5 text-[1.28em] font-semibold tracking-tight text-[#11130f] first:mt-0 leading-snug">
          {children}
        </h2>
      );
    },
    h3({ children }) {
      return (
        <h3 className="mb-1 mt-3 text-[1.12em] font-semibold text-[#11130f] first:mt-0 leading-snug">
          {children}
        </h3>
      );
    },

    p({ children }) {
      return <p className="mb-[0.7em] last:mb-0 leading-[1.65]">{children}</p>;
    },

    code({ className, children, ...rest }) {
      const isBlock = /language-/.test(className ?? "");
      if (isBlock) {
        return (
          <code
            className={`${className ?? ""} font-mono text-xs sm:text-[13px] leading-relaxed`}
            {...rest}
          >
            {children}
          </code>
        );
      }
      return (
        <code
          {...rest}
          className="rounded bg-black/8 px-1 py-0.5 font-mono text-xs text-[#11130f]"
        >
          {children}
        </code>
      );
    },

    pre({ children }) {
      return <CodeBlock>{children}</CodeBlock>;
    },

    blockquote({ children }) {
      return (
        <blockquote className="my-2.5 border-l-3 border-[#04714a]/60 pl-3.5 italic text-black/70 bg-black/[0.02] py-1 rounded-r leading-[1.6]">
          {children}
        </blockquote>
      );
    },

    ul({ children }) {
      return <ul className="mb-2.5 ml-5 list-disc space-y-1 pl-0.5 leading-[1.6]">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="mb-2.5 ml-5 list-decimal space-y-1 pl-0.5 leading-[1.6]">{children}</ol>;
    },
    li({ children }) {
      return <li className="leading-[1.6]">{children}</li>;
    },

    strong({ children }) {
      return <strong className="font-semibold text-[#11130f]">{children}</strong>;
    },
    em({ children }) {
      return <em className="italic">{children}</em>;
    },
    del({ children }) {
      return <del className="line-through opacity-60">{children}</del>;
    },
    hr() {
      return <hr className="my-4 border-black/10" />;
    },

    table({ children }) {
      return (
        <div className="my-3 overflow-x-auto rounded-xl border border-black/10 bg-white shadow-2xs">
          <table className="w-full border-collapse text-xs sm:text-sm">{children}</table>
        </div>
      );
    },
    thead({ children }) {
      return <thead className="bg-black/[0.03] border-b border-black/10">{children}</thead>;
    },
    tbody({ children }) {
      return <tbody>{children}</tbody>;
    },
    tr({ children }) {
      return <tr className="border-b border-black/10 last:border-b-0 hover:bg-black/[0.015] transition-colors">{children}</tr>;
    },
    th({ children }) {
      return (
        <th className="px-3.5 py-2.5 text-left font-semibold text-[#11130f] select-none whitespace-nowrap">
          {children}
        </th>
      );
    },
    td({ children }) {
      return <td className="px-3.5 py-2 text-[#11130f]">{children}</td>;
    },
  };

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        disallowedElements={[
          "img",
          "iframe",
          "object",
          "embed",
          "script",
          "form",
        ]}
        components={markdownComponents}
        urlTransform={safeHref}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
