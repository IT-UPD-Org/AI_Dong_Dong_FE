import { useCallback, useEffect, useRef, useState } from "react";

export interface ScrollbarItem {
  id: string;
  label: string;
  /** Vị trí theo % chiều cao vùng cuộn (0–100), tính từ offsetTop thật của tin nhắn. */
  top: number;
}

export const SCROLLBAR_HIDE_DELAY_MS = 10_000;

interface ConversationScrollbarProps {
  items: ScrollbarItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
  /** Thời gian trễ (ms) trước khi ẩn các chat point sau khi chuột rời khỏi thanh scroll. Mặc định 10 giây. */
  hideDelayMs?: number;
}

// Thanh cuộn điều hướng ở mép phải khung chat:
// - Mặc định chỉ hiện thanh rail mảnh tinh tế sát mép phải, các chat point bị ẩn.
// - Khi di chuyển chuột vào vùng thanh scroll bên phải -> hiện mượt toàn bộ chat point.
// - Khi đưa chuột ra khỏi thanh scroll và mọi chat point / tooltip -> giữ hiển thị thêm 10 giây rồi mới ẩn.
// - Khi người dùng vẫn đang hover (hoặc focus bàn phím) vào thanh scroll, chat point hoặc tooltip -> hủy đếm ngược ẩn.
export function ConversationScrollbar({
  items,
  activeId,
  onSelect,
  hideDelayMs = SCROLLBAR_HIDE_DELAY_MS,
}: ConversationScrollbarProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const containerRef = useRef<HTMLElement | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPointerInsideRef = useRef(false);
  const isFocusInsideRef = useRef(false);

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    if (isPointerInsideRef.current || isFocusInsideRef.current) return;
    hideTimerRef.current = setTimeout(() => {
      hideTimerRef.current = null;
      setIsRevealed(false);
      setHoveredId(null);
    }, hideDelayMs);
  }, [clearHideTimer, hideDelayMs]);

  const handlePointerEnter = useCallback(() => {
    isPointerInsideRef.current = true;
    clearHideTimer();
    setIsRevealed(true);
  }, [clearHideTimer]);

  const handlePointerLeave = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const nextTarget = e.relatedTarget;
      if (
        containerRef.current &&
        nextTarget instanceof Node &&
        containerRef.current.contains(nextTarget)
      ) {
        return;
      }
      isPointerInsideRef.current = false;
      scheduleHide();
    },
    [scheduleHide],
  );

  const handleItemEnter = useCallback(
    (id: string) => {
      handlePointerEnter();
      setHoveredId(id);
    },
    [handlePointerEnter],
  );

  const handleItemLeave = useCallback(
    (id: string, e: React.MouseEvent<HTMLElement>) => {
      const nextTarget = e.relatedTarget;
      const nextItemId =
        nextTarget instanceof Element
          ? nextTarget.closest("[data-scrollbar-item]")?.getAttribute("data-scrollbar-item")
          : null;
      if (nextItemId === id) {
        return;
      }
      setHoveredId((prev) => (prev === id ? null : prev));
      handlePointerLeave(e);
    },
    [handlePointerLeave],
  );

  const handleFocus = useCallback(() => {
    isFocusInsideRef.current = true;
    clearHideTimer();
    setIsRevealed(true);
  }, [clearHideTimer]);

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLElement>) => {
      const nextTarget = e.relatedTarget;
      if (
        containerRef.current &&
        nextTarget instanceof Node &&
        containerRef.current.contains(nextTarget)
      ) {
        return;
      }
      isFocusInsideRef.current = false;
      setHoveredId(null);
      scheduleHide();
    },
    [scheduleHide],
  );

  useEffect(() => {
    if (items.length === 0) {
      clearHideTimer();
      isPointerInsideRef.current = false;
      isFocusInsideRef.current = false;
      setIsRevealed(false);
      setHoveredId(null);
    }
  }, [items.length, clearHideTimer]);

  useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, [clearHideTimer]);

  if (items.length === 0) return null;

  return (
    <nav
      ref={containerRef}
      aria-label="Thanh cuộn điều hướng hội thoại"
      tabIndex={0}
      data-testid="conversation-scrollbar"
      data-state={isRevealed ? "visible" : "hidden"}
      onMouseEnter={handlePointerEnter}
      onPointerEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className="pointer-events-auto absolute inset-y-3 right-0 z-20 hidden w-8 select-none md:block focus:outline-none"
    >
      {/* Thanh scroll rail mảnh luôn hiện sát mép phải làm vùng kích hoạt hover */}
      <div
        aria-hidden="true"
        data-testid="conversation-scrollbar-rail"
        className={`pointer-events-none absolute inset-y-0 right-2 w-[3px] rounded-full transition-colors duration-200 ${
          isRevealed ? "bg-border" : "bg-muted-foreground/25"
        }`}
      />

      {/* Lớp các chat point: mặc định ẩn, chỉ hiện mượt khi hover/focus vào thanh scroll */}
      <div
        data-testid="conversation-scrollbar-points"
        aria-hidden={!isRevealed}
        className={`absolute inset-0 transition-all duration-200 ease-out ${
          isRevealed
            ? "pointer-events-auto translate-x-0 opacity-100"
            : "pointer-events-none translate-x-1 opacity-0"
        }`}
      >
        {items.map((item) => {
          const isHovered = hoveredId === item.id;
          const isActive = activeId === item.id;

          return (
            <div
              key={item.id}
              data-scrollbar-item={item.id}
              className="absolute right-0 flex -translate-y-1/2 items-center"
              style={{ top: `${Math.min(96, Math.max(4, item.top))}%` }}
              onMouseEnter={() => handleItemEnter(item.id)}
              onPointerEnter={() => handleItemEnter(item.id)}
              onMouseLeave={(e) => handleItemLeave(item.id, e)}
              onPointerLeave={(e) => handleItemLeave(item.id, e)}
            >
              {/* Tooltip xem trước câu hỏi — dùng padding pr-2 làm cầu nối hover liền mạch, không có khoảng hở chết */}
              {isRevealed && isHovered && (
                <div
                  className="pointer-events-auto absolute right-full top-1/2 -translate-y-1/2 pr-2"
                  onMouseEnter={() => handleItemEnter(item.id)}
                  onPointerEnter={() => handleItemEnter(item.id)}
                  onMouseLeave={(e) => handleItemLeave(item.id, e)}
                  onPointerLeave={(e) => handleItemLeave(item.id, e)}
                >
                  <div
                    role="tooltip"
                    data-testid="conversation-scrollbar-tooltip"
                    onClick={() => onSelect(item.id)}
                    className="
                      max-w-[210px] lg:max-w-[260px]
                      cursor-pointer truncate
                      rounded-lg
                      border border-border
                      bg-elevated/95
                      px-3 py-1.5
                      text-xs font-medium text-foreground
                      shadow-lg backdrop-blur-sm
                      transition-colors
                      hover:border-brand/40 hover:bg-brand-soft/60
                    "
                  >
                    {item.label}
                  </div>
                </div>
              )}

              <button
                type="button"
                aria-label={item.label}
                aria-current={isActive ? "location" : undefined}
                tabIndex={isRevealed ? 0 : -1}
                onMouseEnter={() => handleItemEnter(item.id)}
                onPointerEnter={() => handleItemEnter(item.id)}
                onMouseLeave={(e) => handleItemLeave(item.id, e)}
                onPointerLeave={(e) => handleItemLeave(item.id, e)}
                onFocus={() => setHoveredId(item.id)}
                onClick={(e) => {
                  onSelect(item.id);
                  if (e.detail > 0) {
                    e.currentTarget.blur();
                  }
                }}
                className="group/point flex cursor-pointer items-center justify-end py-1.5 pl-2 pr-1.5 focus:outline-none"
              >
                <span
                  className={`block rounded-full transition-all duration-150 ${
                    isHovered
                      ? "h-2 w-5 bg-brand-bright ring-2 ring-brand-soft"
                      : isActive
                        ? "h-2 w-4 bg-brand"
                        : "h-1 w-3 bg-muted-foreground/45 group-hover/point:bg-muted-foreground"
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
