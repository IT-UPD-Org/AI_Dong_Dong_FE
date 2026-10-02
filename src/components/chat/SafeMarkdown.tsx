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

const markdownComponents: Components = {
  img() {
    return null;
  },

  a({ href, children }) {
    const safe = safeHref(href);
    if (!safe) {
      return <span className="text-[#04714a]">{children}</span>;
    }
    return (
      <a
        href={safe}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#04714a] underline underline-offset-2 hover:text-[#035e3f]"
      >
        {children}
      </a>
    );
  },

  h1({ children }) {
    return (
      <h1 className="mb-3 mt-5 text-xl font-bold text-[#11130f]">{children}</h1>
    );
  },
  h2({ children }) {
    return (
      <h2 className="mb-2 mt-4 text-lg font-semibold text-[#11130f]">
        {children}
      </h2>
    );
  },
  h3({ children }) {
    return (
      <h3 className="mb-2 mt-3 text-base font-semibold text-[#11130f]">
        {children}
      </h3>
    );
  },

  p({ children }) {
    return <p className="mb-2 last:mb-0">{children}</p>;
  },
  code({ className, children, ...rest }) {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <code
          className={`${className ?? ""} block rounded bg-black/5 px-3 py-2 font-mono text-xs leading-relaxed`}
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
    return (
      <pre className="mb-3 mt-2 overflow-x-auto rounded-lg bg-black/5 p-4 text-sm">
        {children}
      </pre>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-2 border-l-4 border-[#04714a]/40 pl-4 italic text-black/60">
        {children}
      </blockquote>
    );
  },
  ul({ children }) {
    return <ul className="mb-2 ml-5 list-disc space-y-1">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="mb-2 ml-5 list-decimal space-y-1">{children}</ol>;
  },
  li({ children }) {
    return <li className="leading-6">{children}</li>;
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
      <div className="my-3 overflow-x-auto">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    );
  },
  thead({ children }) {
    return <thead className="bg-black/5">{children}</thead>;
  },
  tbody({ children }) {
    return <tbody>{children}</tbody>;
  },
  tr({ children }) {
    return <tr className="border-b border-black/10">{children}</tr>;
  },
  th({ children }) {
    return (
      <th className="px-3 py-2 text-left font-semibold text-[#11130f]">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="px-3 py-2 text-[#11130f]">{children}</td>;
  },
};

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

export function SafeMarkdown({ content, className }: SafeMarkdownProps) {
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
