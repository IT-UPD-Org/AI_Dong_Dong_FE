import { Check, LoaderCircle, Wrench } from "lucide-react";
import type { BEToolCall } from "../../api/types";

const FALLBACK_NAME = "Công cụ";

/**
 * The tools the assistant used in one step of a reply, shown by their
 * user-facing names only (the API never sends arguments or results).
 */
export function ToolCallList({ toolCalls, running = false }: { toolCalls: BEToolCall[]; running?: boolean }) {
  if (!toolCalls.length) return null;
  return (
    <ul className="my-1 flex flex-wrap gap-1.5" aria-label="Công cụ đã dùng">
      {toolCalls.map((call) => (
        <li
          key={call.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-black/[0.03] px-2.5 py-1 text-xs text-black/60"
        >
          {running ? (
            <LoaderCircle size={12} className="animate-spin text-[#04714a]" aria-hidden />
          ) : (
            <Check size={12} className="text-[#04714a]" aria-hidden />
          )}
          <Wrench size={12} className="text-black/40" aria-hidden />
          <span>
            {running ? "Đang dùng" : "Đã dùng"}: {call.display_name || FALLBACK_NAME}
          </span>
        </li>
      ))}
    </ul>
  );
}
