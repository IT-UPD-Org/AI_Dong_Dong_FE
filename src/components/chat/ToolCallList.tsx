import { useState } from "react";
import { ChevronDown, ChevronRight, LoaderCircle, Wrench } from "lucide-react";
import type { BEToolCall } from "../../api/types";

const FALLBACK_NAME = "Công cụ";

function toolName(call: BEToolCall): string {
  return call.display_name || FALLBACK_NAME;
}

/** "A, B" without repeats, in the order the tools were called. */
function summary(toolCalls: BEToolCall[]): string {
  return [...new Set(toolCalls.map(toolName))].join(", ");
}

/**
 * The tools the assistant called in one step of a reply, as a collapsible
 * group: a header naming them ("Đã dùng Search Engine, Search My Files"),
 * which opens a list with one row per call. Only display names are shown;
 * the API never sends a tool's arguments or result.
 */
export function ToolCallList({ toolCalls, running = false }: { toolCalls: BEToolCall[]; running?: boolean }) {
  const [open, setOpen] = useState(false);
  if (!toolCalls.length) return null;

  const Chevron = open ? ChevronDown : ChevronRight;
  return (
    <div className="my-1.5">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="group inline-flex max-w-full items-center gap-1.5 rounded-lg px-1 py-0.5 text-left text-[13px] text-black/50 transition-colors hover:text-black/80 cursor-pointer"
      >
        {running && <LoaderCircle size={13} className="shrink-0 animate-spin text-[#04714a]" aria-hidden />}
        <span className="truncate">
          {running ? "Đang dùng" : "Đã dùng"} {summary(toolCalls)}
        </span>
        <Chevron size={14} className="shrink-0 opacity-70 group-hover:opacity-100" aria-hidden />
      </button>

      {open && (
        <ul className="mt-1.5 overflow-hidden rounded-xl border border-black/10 bg-black/[0.02] text-[13px] text-black/65 animate-in fade-in duration-150">
          {toolCalls.map((call) => (
            <li key={call.id} className="flex items-center gap-2 border-b border-black/5 px-3.5 py-2.5 last:border-b-0">
              <Wrench size={13} className="shrink-0 text-black/35" aria-hidden />
              <span className="truncate">{toolName(call)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
