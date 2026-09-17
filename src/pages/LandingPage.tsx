import {
  ArrowUpRight,
  BrainCircuit,
  BookOpen,
  FileText,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { contributors } from "../mocks/data";
import { PresentLPDongDong } from "../components/layout/PresentLPDongDong";

export function LandingPage() {
  return (
    <main>
      {/* Hero Section */}
      <section className="grid min-h-[calc(100vh-80px)] items-center gap-12 px-6 py-16 md:grid-cols-[1.15fr_.85fr] md:px-12 md:py-24">
        <div>
          <p className="mono mb-7 text-xs uppercase tracking-[.18em] text-[#04714a]">
            University Artificial Intelligence / barcode : UAI-01
          </p>
          <h1 className="max-w-4xl text-6xl font-extrabold text-[#04714a] leading-[.94] tracking-[-.08em] md:text-8xl text-justify">
            <div className="inline-block pb-10">IT UPD GenAI</div>
            <br />
            <span className="text-black/35 md:text-6xl tracking-tighter leading-tight">
              Đạt những thành tựu học tập với sự trợ giúp của trí tuệ nhân tạo.
            </span>
          </h1>
          <p className="mt-8 max-w-2/3 text-lg leading-8 text-black/60 text-justify">
            IT UPD GenAIlà một nền tảng trí tuệ nhân tạo được thiết kế để hỗ trợ
            sinh viên và giảng viên trong việc tìm kiếm thông tin, giải đáp thắc
            mắc và nâng cao trải nghiệm học tập tại Đại học Phương Đông.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="rounded-full bg-[#11130f] px-6 py-3 text-sm font-semibold text-white hover:text-[#00a86b] hover:bg-white/5 transition-colors duration-300 border border-[#00a86b] flex items-center justify-center hover:scale-95 transform"
            >
              Thử Ngay <ArrowUpRight className="ml-2 inline" size={16} />
            </Link>
            <Link
              to="/approve"
              className="rounded-full border border-black/15 px-6 py-3 text-sm"
            >
              Xin cấp phép ngoài
            </Link>
          </div>
        </div>

        <div className="relative min-h-155 overflow-hidden rounded-[2rem] bg-[#11130f] p-6 text-white shadow-2xl flex flex-col justify-between">
          {/* Vùng hiệu ứng ánh sáng nền */}
          <div className="absolute -right-20 -top-16 size-72 rounded-full bg-[#00a86b]/30 blur-3xl pointer-events-none" />

          {/* Header thẻ */}
          <div className="relative z-10 flex justify-between text-xs text-white/45">
            <span className="mono">UAI-series: IT UPD GenAI UAI01</span>
            <span>Được xây dựng bởi IT UPD</span>
          </div>

          {/* Hiển thị hình ảnh Avatar */}
          <PresentLPDongDong />

          {/* Footer thẻ */}
          <div className="relative z-10">
            <p className="mono text-xs text-white/45 text-center md:text-left">
              Version : UAI-01.0.0 / 2026-11-20. Tri thức nhân tạo tham khảo
              theo các mô hình LLM phổ biến, huấn luyện và tối ưu hóa cho các
              tác vụ học tập và hành chính nội bộ.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-black/10 px-6 py-20 md:px-12">
        <p className="mono text-xs uppercase tracking-[.18em] text-black/45">
          UAI-01 IT UPD GenAIsẽ làm được những gì
        </p>

        <div className="mt-12 space-y-16">
          {/* Nhóm 1: Trợ lý Trò chuyện & Tạo nội dung */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="text-[#00a86b]" size={24} />
              <h2 className="text-2xl font-bold text-[#04714a]">
                1. Trợ lý Trò chuyện & Tạo nội dung (Generative AI)
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl border border-black/10 bg-white p-7">
                <span className="mono text-sm text-[#00a86b]">01</span>
                <h3 className="mt-6 text-xl font-semibold">
                  Hội thoại thông minh
                </h3>
                <p className="mt-3 leading-7 text-black/55">
                  Trò chuyện tự nhiên dựa trên các mô hình LLM tiên tiến nhất
                  hiện nay.
                </p>
              </article>
              <article className="rounded-3xl border border-black/10 bg-white p-7">
                <span className="mono text-sm text-[#00a86b]">02</span>
                <h3 className="mt-6 text-xl font-semibold">
                  Sáng tạo nội dung
                </h3>
                <p className="mt-3 leading-7 text-black/55">
                  Hỗ trợ sinh viên gen content bài viết, giải đáp thắc mắc môn
                  học, review/fix lỗi code, hướng dẫn viết báo cáo và bài tập
                  lớn.
                </p>
              </article>
              <article className="rounded-3xl border border-black/10 bg-white p-7">
                <span className="mono text-sm text-[#00a86b]">03</span>
                <h3 className="mt-6 text-xl font-semibold">Kho học liệu số</h3>
                <p className="mt-3 leading-7 text-black/55">
                  Tự động tìm kiếm, gửi lại tài liệu bài giảng và trích xuất
                  link sách tham khảo trực tiếp từ thư viện nhà trường.
                </p>
              </article>
            </div>
          </div>

          {/* Nhóm 2: Tra cứu & Hỗ trợ Hành chính Nội bộ */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <BookOpen className="text-[#00a86b]" size={24} />
              <h2 className="text-2xl font-bold text-[#04714a]">
                2. Tra cứu & Hỗ trợ Hành chính Nội bộ
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl border border-black/10 bg-white p-7">
                <span className="mono text-sm text-[#00a86b]">01</span>
                <h3 className="mt-6 text-xl font-semibold">Kho biểu mẫu</h3>
                <p className="mt-3 leading-7 text-black/55">
                  Cung cấp đầy đủ các giấy tờ, đơn từ hành chính chuẩn form.
                </p>
              </article>
              <article className="rounded-3xl border border-black/10 bg-white p-7">
                <span className="mono text-sm text-[#00a86b]">02</span>
                <h3 className="mt-6 text-xl font-semibold">Tra cứu nhanh</h3>
                <p className="mt-3 leading-7 text-black/55">
                  Tra cứu điểm thi, học phí, lịch trình lớp học và thông tin môn
                  học.
                </p>
              </article>
              <article className="rounded-3xl border border-black/10 bg-white p-7">
                <span className="mono text-sm text-[#00a86b]">03</span>
                <h3 className="mt-6 text-xl font-semibold">Cẩm nang PDU</h3>
                <p className="mt-3 leading-7 text-black/55">
                  Hướng dẫn quy trình xin cấp phép/xác nhận, sơ đồ di chuyển, vị
                  trí phòng học/khoa/phòng ban và cập nhật lịch các sự kiện
                  thường niên.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* Contributors Section */}
      <section className="bg-[#11130f] px-6 py-20 text-white md:px-12">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="mono text-xs uppercase tracking-[.18em] text-[#68d9a7]">
              Bảng đóng góp
            </p>
            <h2 className="mt-5 max-w-xl text-4xl font-bold tracking-tighter md:text-6xl">
              Được xây dựng bởi chính những người sử dụng.
            </h2>
          </div>
          <Link
            to="/contributors"
            className="text-sm text-white/60 hover:text-white"
          >
            Gặp gỡ các nhà đóng góp{" "}
            <ArrowUpRight className="ml-2 inline" size={16} />
          </Link>
        </div>
        <div className="mt-16 flex -space-x-4">
          {contributors.map((c) => (
            <div
              key={c.id}
              title={c.name}
              className="flex size-16 items-center justify-center rounded-full border-4 border-[#11130f] text-sm font-bold text-black"
              style={{ background: c.color }}
            >
              {c.initials}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
