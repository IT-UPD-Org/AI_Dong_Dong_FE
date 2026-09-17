import { useCallback, useEffect, useRef, useState } from "react";

import type { ChatMessage } from "./types";
import type { ScrollbarItem } from "./ConversationScrollbar";

const NEAR_BOTTOM_THRESHOLD = 120;

/**
 * Gom toàn bộ logic liên quan tới vùng cuộn tin nhắn của ChatPage:
 * - Tự cuộn xuống khi có tin nhắn mới (chỉ khi đang ở gần đáy).
 * - Nút "Tin nhắn mới nhất" khi user cuộn lên đọc lại tin cũ.
 * - Vị trí (%) của từng câu hỏi người dùng để vẽ ConversationScrollbar,
 *   và tin đang active (gần giữa khung nhìn nhất).
 */
export function useConversationNav(messages: ChatMessage[], loading: boolean) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messageElsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const refCallbacksRef = useRef<
    Map<string, (el: HTMLDivElement | null) => void>
  >(new Map());
  const isNearBottomRef = useRef(true);

  const [showJumpToLatest, setShowJumpToLatest] = useState(false);
  const [navItems, setNavItems] = useState<ScrollbarItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const userMessages = messages.filter((m) => m.role === "user");

  function isNearBottom() {
    const el = scrollRef.current;
    if (!el) return true;
    return (
      el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_THRESHOLD
    );
  }

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    bottomRef.current?.scrollIntoView({ behavior, block: "end" });
    setShowJumpToLatest(false);
  }

  function scrollToMessage(id: string) {
    messageElsRef.current
      .get(id)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  // Ref callback ổn định theo id (tránh tạo hàm mới mỗi render gây gắn/gỡ ref liên tục)
  const registerMessageRef = useCallback((id: string) => {
    let cb = refCallbacksRef.current.get(id);
    if (!cb) {
      cb = (el: HTMLDivElement | null) => {
        if (el) messageElsRef.current.set(id, el);
        else messageElsRef.current.delete(id);
      };
      refCallbacksRef.current.set(id, cb);
    }
    return cb;
  }, []);

  function recomputeNavItems() {
    const container = scrollRef.current;
    if (!container) return;

    const total = container.scrollHeight || 1;

    const items: ScrollbarItem[] = userMessages
      .map((m) => {
        const el = messageElsRef.current.get(m.id);
        if (!el) return null;
        return {
          id: m.id,
          label: m.content,
          top: (el.offsetTop / total) * 100,
        };
      })
      .filter((item): item is ScrollbarItem => item !== null);

    setNavItems(items);
  }

  function updateActiveFromScroll() {
    const container = scrollRef.current;
    if (!container) return;

    const center = container.scrollTop + container.clientHeight / 2;

    let closestId: string | null = null;
    let closestDistance = Infinity;

    userMessages.forEach((m) => {
      const el = messageElsRef.current.get(m.id);
      if (!el) return;
      const distance = Math.abs(el.offsetTop - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestId = m.id;
      }
    });

    setActiveId(closestId);
  }

  function handleScroll() {
    const nearBottom = isNearBottom();
    isNearBottomRef.current = nearBottom;
    setShowJumpToLatest(!nearBottom);
    updateActiveFromScroll();
  }

  // Gửi tin nhắn mới -> luôn kéo về đáy lần tới
  function markNearBottom() {
    isNearBottomRef.current = true;
  }

  // Mỗi khi số lượng tin nhắn (hoặc trạng thái loading) đổi: tính lại vị trí vạch
  // điều hướng, và tự cuộn xuống NẾU đang ở gần đáy — không ép cuộn nếu user
  // đang đọc lại đoạn cũ.
  useEffect(() => {
    recomputeNavItems();

    if (isNearBottomRef.current) {
      scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
    } else {
      setShowJumpToLatest(true);
    }

    updateActiveFromScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, loading]);

  // Khung cuộn đổi kích thước (resize cửa sổ, thu/phóng sidebar...) -> tính lại vị trí vạch
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => recomputeNavItems());
    observer.observe(container);

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    scrollRef,
    bottomRef,
    registerMessageRef,
    showJumpToLatest,
    navItems,
    activeId,
    handleScroll,
    scrollToBottom,
    scrollToMessage,
    markNearBottom,
  };
}
