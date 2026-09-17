// \dong-dong_FE\src\pages\LandingPage.tsx

import { ArrowUpRight, BookOpen, FileText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { contributors } from "../mocks/data";
import { PresentLPDongDong } from "../components/layout/PresentLPDongDong";
import { ChatShowcaseSection } from "../components/landing/ChatShowcaseSection";
import { KnowledgeRepositoryIllustration } from "../components/landing/KnowledgeRepositoryIllustration";

export function LandingPage() {
  return (
    <main>
      {/* =========================================================
          HERO SECTION
      ========================================================= */}
      <section className="grid min-h-[calc(100vh-80px)] items-center gap-12 px-6 py-16 md:grid-cols-[1.15fr_.85fr] md:px-12 md:py-24">
        {/* LEFT — INTRO */}
        <div>
          <p className="mono mb-7 text-xs uppercase tracking-[.18em] text-[#04714a]">
            University Artificial Intelligence / barcode : UAI-01
          </p>

          <h1 className="max-w-4xl text-6xl font-extrabold leading-[.94] tracking-[-.08em] text-[#04714a] md:text-8xl">
            <div className="inline-block pb-10">IT UPD GenAI</div>

            <br />

            <span className="text-justify text-2xl leading-tight tracking-tighter text-black/35 md:text-6xl">
              Đạt những thành tựu học tập với sự trợ giúp của trí tuệ nhân tạo.
            </span>
          </h1>

          <p className="mt-8 max-w-2/3 text-justify text-lg leading-8 text-black/60">
            IT UPD GenAI là một nền tảng trí tuệ nhân tạo được thiết kế để hỗ
            trợ sinh viên và giảng viên trong việc tìm kiếm thông tin, giải đáp
            thắc mắc và nâng cao trải nghiệm học tập tại Đại học Phương Đông.
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              to="/login"
              className="flex items-center justify-center rounded-full border border-[#00a86b] bg-[#11130f] px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-95 hover:bg-white/5 hover:text-[#00a86b]"
            >
              Thử Ngay
              <ArrowUpRight className="ml-2 inline" size={16} />
            </Link>

            <Link
              to="/approve"
              className="rounded-full border border-black/15 px-6 py-3 text-sm transition-colors hover:border-[#00a86b] hover:text-[#04714a]"
            >
              Xin cấp phép ngoài
            </Link>
          </div>
        </div>

        {/* RIGHT — DONG DONG CARD */}
        <div className="relative flex min-h-155 flex-col justify-between overflow-hidden rounded-[2rem] bg-[#11130f] p-6 text-white shadow-2xl">
          {/* Background glow */}
          <div className="pointer-events-none absolute -right-20 -top-16 size-72 rounded-full bg-[#00a86b]/30 blur-3xl" />

          {/* Header */}
          <div className="relative z-10 flex justify-between text-xs text-white/45">
            <span className="mono">UAI-series: IT UPD GenAI UAI01</span>

            <span>Được xây dựng bởi IT UPD</span>
          </div>

          {/* Dong Dong Avatar */}
          <PresentLPDongDong />

          {/* Footer */}
          <div className="relative z-10">
            <p className="mono text-center text-xs text-white/45 md:text-left">
              Version : UAI-01.0.0 / 2026-11-20. Tri thức nhân tạo tham khảo
              theo các mô hình LLM phổ biến, huấn luyện và tối ưu hóa cho các
              tác vụ học tập và hành chính nội bộ.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================
          FEATURES SECTION
      ========================================================= */}
      <section className="border-t border-black/10 px-6 py-20 md:px-12">
        {/* Section label */}
        <p className="mono text-xs uppercase tracking-[.18em] text-black/45">
          UAI-01 IT UPD GenAI sẽ làm được những gì
        </p>

        <div className="mt-12 space-y-32">
          {/* =====================================================
              01 — TRÒ CHUYỆN THÔNG MINH
          ===================================================== */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className="text-[#00a86b]" size={24} />

              <h2 className="text-2xl font-bold text-[#04714a]">
                1. Trợ lý Trò chuyện & Tạo nội dung
                <span className="text-black/35"> (Generative AI)</span>
              </h2>
            </div>

            <ChatShowcaseSection />
          </section>

          {/* =====================================================
              02 — KHO TRI THỨC SỐ
          ===================================================== */}
          <section className="relative">
            {/* Heading */}
            <div className="mb-2 flex items-center gap-3">
              <BookOpen className="text-[#00a86b]" size={24} />

              <h2 className="text-2xl font-bold text-[#04714a]">
                2. Kho Tri Thức Số
              </h2>
            </div>

            <p className="mono text-xs uppercase tracking-[.18em] text-black/35">
              DIGITAL KNOWLEDGE REPOSITORY
            </p>

            {/* SVG illustration */}
            <div className="mx-auto mt-4 w-full max-w-[1100px]">
              <KnowledgeRepositoryIllustration className="h-auto w-full" />
            </div>

            {/* Description */}
            <div className="mx-auto mt-2 max-w-3xl text-center">
              <p className="text-sm leading-7 text-black/55 md:text-base">
                Kết nối trực tiếp với hệ thống thư viện và giáo trình của nhà
                trường. Trích xuất chính xác tài liệu, bài giảng và link sách
                tham khảo chuẩn xác. Gợi ý lộ trình đọc và tự học phù hợp theo
                từng môn chuyên ngành.
              </p>
            </div>
          </section>

          {/* =====================================================
              03 — TRA CỨU & HỖ TRỢ HÀNH CHÍNH
          ===================================================== */}
          <section>
            <div className="mb-6 flex items-center gap-3">
              <FileText className="text-[#00a86b]" size={24} />

              <h2 className="text-2xl font-bold text-[#04714a]">
                3. Tra cứu & Hỗ trợ Hành chính Nội bộ
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {/* CARD 01 */}
              <article className="rounded-3xl border border-black/10 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#00a86b]/30 hover:shadow-lg">
                <span className="mono text-sm text-[#00a86b]">01</span>

                <h3 className="mt-6 text-xl font-semibold">Kho biểu mẫu</h3>

                <p className="mt-3 leading-7 text-black/55">
                  Cung cấp đầy đủ các giấy tờ, đơn từ hành chính chuẩn form.
                </p>
              </article>

              {/* CARD 02 */}
              <article className="rounded-3xl border border-black/10 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#00a86b]/30 hover:shadow-lg">
                <span className="mono text-sm text-[#00a86b]">02</span>

                <h3 className="mt-6 text-xl font-semibold">Tra cứu nhanh</h3>

                <p className="mt-3 leading-7 text-black/55">
                  Tra cứu điểm thi, học phí, lịch trình lớp học và thông tin môn
                  học.
                </p>
              </article>

              {/* CARD 03 */}
              <article className="rounded-3xl border border-black/10 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#00a86b]/30 hover:shadow-lg">
                <span className="mono text-sm text-[#00a86b]">03</span>

                <h3 className="mt-6 text-xl font-semibold">Cẩm nang PDU</h3>

                <p className="mt-3 leading-7 text-black/55">
                  Hướng dẫn quy trình xin cấp phép/xác nhận, sơ đồ di chuyển, vị
                  trí phòng học/khoa/phòng ban và cập nhật lịch các sự kiện
                  thường niên.
                </p>
              </article>
            </div>
          </section>
        </div>
      </section>

      {/* =========================================================
          CONTRIBUTORS SECTION
      ========================================================= */}
      <section className="bg-[#11130f] px-6 py-20 text-white md:px-12">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          {/* Heading */}
          <div>
            <p className="mono text-xs uppercase tracking-[.18em] text-[#68d9a7]">
              Bảng đóng góp
            </p>

            <h2 className="mt-5 max-w-xl text-4xl font-bold tracking-tighter md:text-6xl">
              Được xây dựng bởi chính những người sử dụng.
            </h2>
          </div>

          {/* Link */}
          <Link
            to="/contributors"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Gặp gỡ các nhà đóng góp
            <ArrowUpRight className="ml-2 inline" size={16} />
          </Link>
        </div>

        {/* Contributors */}
        <div className="mt-16 flex -space-x-4">
          {contributors.map((c) => (
            <div
              key={c.id}
              title={c.name}
              className="flex size-16 items-center justify-center rounded-full border-4 border-[#11130f] text-sm font-bold text-black"
              style={{
                background: c.color,
              }}
            >
              {c.initials}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
