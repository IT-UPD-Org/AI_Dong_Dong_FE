import { useState } from "react";

export interface ScrollbarItem {
  id: string;
  label: string;
  /** Vị trí theo % chiều cao vùng cuộn (0–100), tính từ offsetTop thật của tin nhắn. */
  top: number;
}

interface ConversationScrollbarProps {
  items: ScrollbarItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

// Thanh điều hướng dạng "ruler" kiểu ChatGPT: mỗi vạch = 1 câu hỏi của người dùng.
// Hover vào 1 vạch -> phóng to + hiện tooltip câu hỏi đó; bấm -> cuộn tới đúng vị trí.
// Đặt flush sát mép phải (right-0) của khung chat, đè lên trên thanh cuộn mặc định
// (thanh cuộn mặc định đã bị ẩn ở ChatPage bằng scrollbar-width:none).
export function ConversationScrollbar({
  items,
  activeId,
  onSelect,
}: ConversationScrollbarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-y-2 right-0 z-20 hidden w-8 md:block">
      {/* Đường track mảnh chạy dọc */}
      <div className="absolute inset-y-0 right-3 w-px bg-border" />

      {items.map((item) => {
        const isHovered = hoveredId === item.id;
        const isActive = activeId === item.id;

        return (
          <div
            key={item.id}
            className="pointer-events-auto absolute right-0 flex -translate-y-1/2 items-center"
            style={{ top: `${item.top}%` }}
          >
            {/* Tooltip hiện câu hỏi của người dùng khi hover */}
            {isHovered && (
              <div
                className="
                  pointer-events-none absolute right-full mr-3
                  max-w-[240px]
                  truncate
                  rounded-lg
                  border border-border
                  bg-elevated
                  px-3 py-1.5
                  text-xs text-foreground
                  shadow-lg
                "
              >
                {item.label}
              </div>
            )}

            <button
              type="button"
              aria-label={item.label}
              onMouseEnter={() => setHoveredId(item.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelect(item.id)}
              className={`
                mr-2 rounded-full transition-all duration-150
                ${
                  isHovered
                    ? "h-2.5 w-5 bg-brand"
                    : isActive
                      ? "h-1.5 w-4 bg-foreground"
                      : "h-1 w-3 bg-muted-foreground/40 hover:bg-muted-foreground"
                }
              `}
            />
          </div>
        );
      })}
    </div>
  );
}
