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
          border border-border
          bg-field
          p-2
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
            shrink-0
            rounded-full
            p-3
            text-muted-foreground
            transition-colors
            hover:bg-hover
            hover:text-brand-text
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
            bg-transparent text-foreground
            px-2 py-3
            text-sm
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
            shrink-0
            rounded-full
            bg-brand
            p-3
            text-brand-foreground
            transition-all
            hover:bg-brand-hover

            disabled:cursor-not-allowed
            disabled:opacity-30
          "
        >
          <Send size={18} />
        </button>
      </form>

      <p className="mt-3 text-center text-[11px] text-muted-foreground">
        IT UPD GenAI có thể mắc lỗi, vui lòng kiểm tra lại thông tin trước khi
        áp dụng vào thực tế.
      </p>
    </div>
  );
}
