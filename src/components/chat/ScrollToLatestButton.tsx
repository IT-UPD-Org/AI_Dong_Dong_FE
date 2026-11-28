import { ArrowDown } from "lucide-react";

interface ScrollToLatestButtonProps {
  visible: boolean;
  onClick: () => void;
}

export function ScrollToLatestButton({
  visible,
  onClick,
}: ScrollToLatestButtonProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        absolute bottom-3 sm:bottom-4 left-1/2
        z-20
        flex min-h-[40px] sm:min-h-[36px] max-w-[calc(100%-2rem)] -translate-x-1/2
        items-center gap-1.5 whitespace-nowrap
        rounded-full
        border border-border
        bg-elevated/95 backdrop-blur-md
        px-4 py-2
        text-xs font-medium
        text-foreground
        shadow-md
        transition-all
        cursor-pointer
        hover:scale-105 hover:shadow-lg
      "
    >
      <ArrowDown size={14} className="shrink-0" />
      Tin nhắn mới nhất
    </button>
  );
}
