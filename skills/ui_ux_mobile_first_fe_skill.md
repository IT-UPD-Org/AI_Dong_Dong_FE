---
name: ui-ux-mobile-first-fe
description: >
  Bộ kỹ năng thiết kế UI/UX và Responsive chuẩn mobile-first cho web app nhiều phân hệ
  (Landing page, Chat AI, Map, Tài liệu, Cây hướng nghiệp, Sidebar ẩn phía trên, ô nhập
  prompt AI ở phía dưới). Dùng khi tối ưu trải nghiệm người dùng, bố cục di động,
  khả năng đọc, điều hướng và tương tác chạm.
---

# UI/UX & Mobile-First Frontend Craft

## 1. Quy chuẩn Shell: Top Navigation/Sidebar ẩn được & Bottom AI Prompt Bar
- **Navigation / Sidebar trên Mobile:**
  - Đưa thanh điều hướng/nút mở sidebar lên **phía trên** (top bar gọn, chiều cao hợp lý, thao tác 1 tay dễ với).
  - Sidebar mặc định **ẩn** trên mobile (slide-over drawer / top-sheet hoặc off-canvas), có backdrop mờ, hỗ trợ đóng bằng nút đóng, bấm backdrop hoặc phím `Escape`.
  - Tránh để sidebar cố định chiếm chiều ngang trên mobile.
- **Ô nhập prompt AI ở phía dưới:**
  - Đặt cố định/neo ở **phía dưới** vùng làm việc chính, chừa đủ `padding-bottom` cho vùng nội dung phía trên để tin nhắn/nội dung cuối không bị che.
  - Hỗ trợ textarea tự giãn chiều cao có giới hạn tối đa (tránh chiếm hết màn hình khi gõ dài), nút gửi rõ ràng, trạng thái disabled/loading trực quan.
  - Tính đến `env(safe-area-inset-bottom)` và hiện tượng bàn phím ảo đẩy viewport trên mobile.

## 2. Quy chuẩn UI/UX theo từng loại trang
- **Landing Page:**
  - Hero rõ thông điệp chính + CTA chính ngay trên fold đầu tiên ở mobile.
  - Section phân tách nhịp điệu thoáng, chữ không sát mép màn hình (`px-4` trở lên trên mobile), các card/feature xếp cột gọn gàng, không vỡ layout do ảnh hoặc badge dài.
- **Chat Page:**
  - Phân biệt rõ tin nhắn người dùng và phản hồi AI; giữ chiều rộng dòng đọc thoải mái (tránh kéo giãn quá rộng trên màn hình lớn hoặc quá chật trên mobile).
  - Hỗ trợ cuộn mượt, nút nhảy xuống tin nhắn mới nhất khi đang đọc lại lịch sử, hiển thị rõ trạng thái đang xử lý/tạo phản hồi.
- **Map:**
  - Bản đồ chiếm không gian chính gọn gàng, các bảng thông tin/bộ lọc/chi tiết địa điểm dạng bottom sheet hoặc panel thu gọn được để không che kín bản đồ trên mobile.
  - Các nút điều khiển (zoom, vị trí, bộ lọc) tách biệt, kích thước chạm thoải mái.
- **Tài liệu (Docs):**
  - Ưu tiên khả năng đọc: cỡ chữ thân bài dễ đọc, line-height thoáng, heading phân cấp rõ, bảng/code block có thể cuộn ngang cục bộ thay vì làm tràn toàn trang.
  - Mục lục (TOC) hoặc cây thư mục trên mobile thu gọn vào nút/drawer riêng, không đẩy nội dung chính xuống quá sâu.
- **Cây hướng nghiệp (Career Tree):**
  - Trên mobile, đảm bảo người dùng không bị kẹt trong sơ đồ quá rộng/quá nhỏ: hỗ trợ pan/zoom mượt hoặc chuyển đổi linh hoạt giữa sơ đồ cây và danh sách/bậc lộ trình có thể mở rộng (collapsible nodes).
  - Khi chọn một nhánh/node, hiển thị thẻ chi tiết (kỹ năng, môn học, lộ trình, cơ hội) gọn gàng, dễ đọc và dễ quay lại.

## 3. Kiểm tra chất lượng UI/UX bắt buộc trước khi bàn giao
- Không tràn ngang (`scrollWidth <= clientWidth`) ở các độ rộng phổ biến (`360px`, `390px`, `414px`, `768px`, `1280px`, `1440px`).
- Nút bấm, icon tương tác, tab, chip lọc có vùng chạm đủ lớn và khoảng cách tránh bấm nhầm.
- Màu chữ, viền, trạng thái active/hover/focus và thông báo trống/lỗi rõ ràng, đồng bộ.