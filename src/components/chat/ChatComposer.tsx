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
    <div className="shrink-0 px-3 sm:px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <form
        onSubmit={onSubmit}
        className="
          mx-auto
          flex w-full
          max-w-4xl
          items-end gap-2
          rounded-3xl
          border border-border
          bg-field
          p-1.5 sm:p-2
          shadow-sm
          transition-all
          focus-within:border-brand-bright/50
          focus-within:ring-2 focus-within:ring-brand/20
        "
      >
        <button
          type="button"
          aria-label="Tải lên tệp"
          className="
            flex size-11 shrink-0 items-center justify-center
            rounded-full
            text-muted-foreground
            transition-colors
            hover:bg-hover
            hover:text-brand-text
            cursor-pointer
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
            min-h-11
            min-w-0
            flex-1
            resize-none
            bg-transparent text-foreground
            px-2 py-2.5
            text-base sm:text-sm
            leading-6
            outline-none
            placeholder:text-muted-foreground
          "
        />

        <button
          type="submit"
          aria-label="Gửi tin nhắn"
          disabled={!value.trim() || loading}
          className="
            flex size-11 shrink-0 items-center justify-center
            rounded-full
            bg-brand
            text-brand-foreground
            transition-all
            hover:bg-brand-hover
            cursor-pointer
            disabled:cursor-not-allowed
            disabled:opacity-30
          "
        >
          <Send size={18} />
        </button>
      </form>

      <p className="mt-2 text-center text-[11px] leading-snug text-muted-foreground">
        IT UPD GenAI có thể mắc lỗi, vui lòng kiểm tra lại thông tin trước khi
        áp dụng vào thực tế.
      </p>
    </div>
  );
}
