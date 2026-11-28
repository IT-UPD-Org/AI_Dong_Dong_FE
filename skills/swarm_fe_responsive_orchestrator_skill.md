---
name: swarm-fe-responsive-orchestrator
description: >
  Điều phối Antigravity Swarm chia nhỏ và thực thi đồng thời các tác vụ sửa Frontend,
  tối ưu Responsive đa thiết bị (đặc biệt Mobile) và nâng cấp UI/UX trên nhiều trang/module
  mà không gây xung đột mã nguồn. Dùng khi nhận lệnh tổng dạng [swarm] sửa giao diện,
  layout, responsive hoặc luồng tương tác toàn hệ thống.
---

# Swarm FE & Responsive Orchestrator

## Nguyên tắc điều phối cốt lõi
1. **Audit trước khi sửa:** Quét toàn bộ route, layout shell, breakpoint, CSS/Tailwind tokens và các component dùng chung trước khi chia task.
2. **Chia theo ownership (vùng sở hữu rõ ràng):** Mỗi sub-agent phụ trách một nhóm route/component độc lập; **Layout Shell (Top bar/Sidebar/Bottom prompt dock)** được chốt contract trước để các trang con bám theo.
3. **Mobile-First bắt buộc:** Thiết kế và kiểm thử từ viewport `375px` -> `390px` -> `768px` -> `1280px+`. Không dùng `100vh` thô gây cấn thanh địa chỉ/bàn phím trên mobile (ưu tiên `100dvh` và `env(safe-area-inset-*)`).
4. **Chống tràn ngang & kẹt thao tác:** Mọi màn hình phải kiểm tra `overflow-x: hidden` ở root/container phù hợp, vùng chạm tối thiểu `44x44px`, không che nội dung quan trọng bằng fixed bar/prompt dock.
5. **Tổng hợp & đối chiếu (Verification):** Sau khi các agent hoàn tất, agent điều phối gom báo cáo, rà soát cross-page consistency (spacing, typography, z-index, focus/keyboard/touch) và liệt kê các điểm cần kiểm thử thực tế trên thiết bị thật.

## Quy trình chia Swarm (5 bước)

### Bước 1: Recon & Architecture Map
- Liệt kê các trang/module hiện có (ví dụ: Landing Page, Chat Page, Map, Tài liệu/Docs, Cây hướng nghiệp/Career Tree, Navigation/Sidebar, AI Prompt Bar).
- Xác định file layout chung, theme variables, breakpoint chuẩn và các component có nguy cơ xung đột cao.

### Bước 2: Phân công Sub-Agent song song
Chia thành các nhánh chuyên biệt:
- **Agent A – Global Shell & Navigation:** Sidebar/Drawer, Top Header (đẩy navigation/sidebar lên trên và ẩn/mở gọn trên mobile), Bottom AI Prompt Input Dock, `z-index` layering & safe-area.
- **Agent B – Landing & Content/Docs Views:** Landing Page (hero, grid, CTA, spacing), trang Tài liệu (đọc thoải mái trên mobile, TOC/bộ lọc không chiếm màn hình).
- **Agent C – Interactive & Spatial Views:** Map (full-height responsive, sheet/panel không che bản đồ trên mobile), Cây hướng nghiệp / Career Tree (zoom/pan/scroll hoặc chuyển chế độ xem gọn trên màn hình nhỏ, node dễ chạm).
- **Agent D – Chat & AI Workspace:** Chat Page (lịch sử tin nhắn, vùng cuộn độc lập, trạng thái loading/streaming, tương tác mượt với thanh prompt dưới).
- **Agent E – QA, Responsive Audit & Polish:** Kiểm tra breakpoint, overflow, contrast, touch target, trạng thái rỗng/lỗi/đang tải và lập checklist nghiệm thu.

### Bước 3: Thực thi song song theo Contract
- Các sub-agent bám sát quy chuẩn từ skill `ui-ux-mobile-first-fe`.
- Không tự ý sửa đổi token/contract chung của Agent A nếu chưa đồng bộ; nếu cần đổi contract, ghi rõ vào shared interface note.

### Bước 4: Tích hợp & Resolve Conflict
- Hợp nhất thay đổi theo thứ tự: Global Shell -> Các trang độc lập -> Shared UI primitives.
- Xử lý chồng chéo `z-index` (header, drawer, modal/sheet, prompt bar, tooltip/popover).

### Bước 5: Báo cáo tổng hợp
Trình bày rõ:
- Những gì đã sửa theo từng agent/trang.
- Các quy ước responsive & UI/UX đã áp dụng.
- Các rủi ro/edge case còn lại (đặc biệt trên iOS Safari / Android Chrome / màn hình nhỏ).