import { useState, useCallback, ReactNode, isValidElement } from "react";
import { Check, Copy } from "lucide-react";
import { copyToClipboard } from "../../lib/clipboard";
import { toast } from "sonner";

interface CodeBlockProps {
  className?: string;
  children?: ReactNode;
}

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }
  if (
    typeof node === "object" &&
    node !== null &&
    "props" in node &&
    (node as { props?: { children?: ReactNode } }).props?.children
  ) {
    return extractText((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

export function CodeBlock({ className, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Extract language from className or child props
  let langClass = className || "";
  if (!langClass && isValidElement(children) && (children.props as { className?: string })?.className) {
    langClass = (children.props as { className?: string }).className || "";
  }
  const match = /language-([a-zA-Z0-9_-]+)/.exec(langClass);
  const language = match ? match[1].toLowerCase() : "";

  const handleCopy = useCallback(async () => {
    const rawCode = extractText(children);
    if (!rawCode) return;

    const ok = await copyToClipboard(rawCode);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Không thể sao chép vào bộ nhớ tạm");
    }
  }, [children]);

  const isCodeElement = isValidElement(children) && children.type === "code";

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-xl border border-code-border bg-code text-code-foreground shadow-xs">
      <div className="flex h-8 items-center justify-between border-b border-code-border bg-code-header px-3.5 text-xs text-code-muted select-none">
        <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-code-muted">
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Sao chép mã"
          title={copied ? "Đã sao chép" : "Sao chép mã"}
          className={`flex items-center gap-1.5 rounded-md px-2 py-0.8 text-[11px] font-medium transition-all cursor-pointer ${
            copied
              ? "bg-brand/30 text-brand-bright"
              : "text-code-muted hover:bg-code-hover hover:text-code-foreground"
          }`}
        >
          {copied ? (
            <>
              <Check size={12} className="text-brand-bright" />
              <span>Đã sao chép!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Sao chép</span>
            </>
          )}
        </button>
      </div>

      <pre className="overflow-x-auto p-3.5 text-xs sm:text-[13px] font-mono leading-relaxed text-code-foreground selection:bg-brand/40">
        {isCodeElement ? children : <code className={className}>{children}</code>}
      </pre>
    </div>
  );
}
