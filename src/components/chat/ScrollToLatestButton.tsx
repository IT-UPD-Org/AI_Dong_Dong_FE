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
        absolute bottom-4 left-1/2
        z-10
        flex -translate-x-1/2
        items-center gap-1.5
        rounded-full
        border border-black/10
        bg-white
        px-4 py-2
        text-xs font-medium
        text-[#11130f]
        shadow-md
        transition-all
        hover:scale-105 hover:shadow-lg
      "
    >
      <ArrowDown size={14} />
      Tin nhắn mới nhất
    </button>
  );
}
