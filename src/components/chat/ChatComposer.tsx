import { FormEvent, KeyboardEvent } from "react";
import { Paperclip, Send } from "lucide-react";

interface ChatComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: FormEvent) => void;
  loading: boolean;
}

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  loading,
}: ChatComposerProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing &&
      e.keyCode !== 229
    ) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="shrink-0">
      <form
        onSubmit={onSubmit}
        className="
          mx-auto
          flex w-full
          max-w-4xl
          items-end gap-2
          rounded-full
          border border-black/15
          bg-white
          p-2
          shadow-sm
          transition-all
          focus-within:border-[#00a86b]/50
          focus-within:shadow-[0_0_0_3px_rgba(0,168,107,0.08)]
        "
      >
        <button
          type="button"
          aria-label="Tải lên tệp"
          className="
            shrink-0
            rounded-full
            p-3
            text-black/40
            transition-colors
            hover:bg-black/5
            hover:text-[#04714a]
          "
        >
          <Paperclip size={18} />
        </button>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Hỏi IT UPD GenAI bất cứ điều gì..."
          className="
            max-h-32
            min-h-12
            min-w-0
            flex-1
            resize-none
            bg-transparent
            px-2 py-3
            text-sm
            leading-6
            outline-none
            placeholder:text-black/35
          "
        />

        <button
          type="submit"
          aria-label="Gửi tin nhắn"
          disabled={!value.trim() || loading}
          className="
            shrink-0
            rounded-full
            bg-[#00a86b]
            p-3
            text-black
            transition-all
            hover:bg-[#04714a]
            hover:text-white
            disabled:cursor-not-allowed
            disabled:opacity-30
          "
        >
          <Send size={18} />
        </button>
      </form>

      <p className="mt-3 text-center text-[11px] text-black/35">
        IT UPD GenAI có thể mắc lỗi, vui lòng kiểm tra lại thông tin trước khi
        áp dụng vào thực tế.
      </p>
    </div>
  );
}
