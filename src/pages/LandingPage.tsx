import { useState } from "react";
import { ArrowUpRight, BookOpen, FileText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { contributors } from "../mocks/data";
import { PresentLPDongDong } from "../components/layout/PresentLPDongDong";
import { ChatShowcaseSection } from "../components/landing/ChatShowcaseSection";
import { KnowledgeRepositoryIllustration } from "../components/landing/KnowledgeRepositoryIllustration";

// 1 cái to làm điểm nhấn chính, 2 cái nhỏ làm điểm xuyết vệ tinh cân đối
const gems = [
  { id: "gem-large", size: "32%", top: "50%", left: "62%", center: true, delay: 0 },
  { id: "gem-small-top", size: "14%", top: "13%", right: "12%", delay: 120 },
  { id: "gem-small-bottom", size: "13%", bottom: "16%", right: "15%", delay: 220 },

];

export function LandingPage() {
  const [isLogoHovered, setIsLogoHovered] = useState(false);

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

        <div className="group relative flex min-h-155 flex-col justify-between overflow-hidden rounded-[2rem] bg-[#f8faf9] p-6 text-white shadow-2xl">
          {/* Background */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Emerald-to-mint background from the approved visual direction. */}
            <div
              className="absolute inset-0"
              style={{
                background: `
          radial-gradient(circle at 76% 22%, rgba(255,255,255,.9), transparent 43%),
          radial-gradient(circle at 22% 78%, rgba(144,229,202,.9), transparent 55%),
          linear-gradient(125deg, #04aa73 0%, #22c58c 38%, #a9e4d1 74%, #e9f8f1 100%)
        `,
              }}
            />

            {/* White light beam — tỏa tự nhiên từ phía sau logo CLB IT UPD sang phải */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  conic-gradient(
                    from 26deg at 16% 48%,
                    transparent 0deg,
                    transparent 20deg,
                    rgba(255, 255, 255, 0.04) 30deg,
                    rgba(255, 255, 255, 0.35) 48deg,
                    rgba(255, 255, 255, 0.85) 60deg,
                    rgba(255, 255, 255, 0.35) 72deg,
                    rgba(255, 255, 255, 0.04) 90deg,
                    transparent 100deg,
                    transparent 360deg
                  )
                `,
                maskImage: `
                  radial-gradient(
                    ellipse 95% 75% at 16% 48%,
                    black 20%,
                    rgba(0, 0, 0, 0.8) 45%,
                    rgba(0, 0, 0, 0.15) 80%,
                    transparent 100%
                  )
                `,
                WebkitMaskImage: `
                  radial-gradient(
                    ellipse 95% 75% at 16% 48%,
                    black 20%,
                    rgba(0, 0, 0, 0.8) 45%,
                    rgba(0, 0, 0, 0.15) 80%,
                    transparent 100%
                  )
                `,
              }}
            />

            {/* Vầng hào quang sáng dịu sau logo giúp ánh sáng tỏa ra liền mạch */}
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(
                    circle at 17% 48%,
                    rgba(255, 255, 255, 0.6) 0%,
                    rgba(255, 255, 255, 0.22) 28%,
                    rgba(255, 255, 255, 0.04) 55%,
                    transparent 75%
                  )
                `,
              }}
            />

            {/* Clean white highlight */}
            <div
              className="absolute -right-16 -top-20 size-80 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.45) 38%, rgba(255,255,255,0) 72%)",
              }}
            />

            {/* Subtle green depth — KHÔNG blur mạnh */}
            <div
              className="absolute -left-32 top-12 size-96 rounded-full"
              style={{
                background:
                  "radial-gradient(circle, rgba(0,168,107,0.22) 0%, rgba(0,168,107,0.08) 45%, transparent 72%)",
              }}
            />

            {/* Very subtle glass highlight */}
            <div
              className="absolute inset-0"
              style={{
                background: `
          linear-gradient(
            115deg,
            rgba(255,255,255,0.12) 0%,
            transparent 28%,
            transparent 72%,
            rgba(255,255,255,0.22) 100%
          )
        `,
              }}
            />
          </div>
          <div className="absolute inset-0 pointer-events-none">
            {gems.map((g) => (
              <div
                key={g.id}
                className={`absolute drop-shadow-[0_12px_32px_rgba(0,80,55,0.38)] transition-all duration-700 ease-out ${
                  isLogoHovered
                    ? "opacity-95"
                    : "opacity-0"
                }`}
                style={{
                  width: g.size,
                  aspectRatio: "1 / 1",
                  top: g.top,
                  left: g.left,
                  right: g.right,
                  bottom: g.bottom,
                  transform: g.center
                    ? `translate(-50%, -50%) ${isLogoHovered ? "scale(1)" : "scale(0.7)"}`
                    : `${isLogoHovered ? "scale(1)" : "scale(0.7)"}`,
                  transitionDelay: `${g.delay}ms`,

                }}
              >
                <img
                  src="/assets/UPD_Vertical Logo.png"
                  alt="Biểu tượng Phương Đông"
                  className="h-full w-full object-contain"
                />
              </div>
            ))}
          </div>
          {/* Header */}
          <div className="relative z-10 flex justify-between text-xs text-black/45">
            <span className="mono">UAI-series: IT UPD GenAI UAI01</span>

            <span>Được xây dựng bởi IT UPD</span>
          </div>

          {/* Dong Dong Avatar */}
          <PresentLPDongDong onHoverLogo={setIsLogoHovered} />

          {/* Footer */}
          <div className="relative z-10">
            <p className="mono text-center text-xs text-black/45 md:text-left">
              Version : UAI-01.0.0 / 2026-11-20. Tri thức nhân tạo tham khảo
              theo các mô hình LLM phổ biến, huấn luyện và tối ưu hóa cho các
              tác vụ học tập và hành chính nội bộ.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-black/10 px-6 py-20 md:px-12">
        <p className="mono text-xs uppercase tracking-[.18em] text-black/45">
          UAI-01 IT UPD GenAI sẽ làm được những gì
        </p>

        <div className="mt-12 space-y-32">
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
          <section className="relative">
            <div className="mb-2 flex items-center gap-3">
              <BookOpen className="text-[#00a86b]" size={24} />

              <h2 className="text-2xl font-bold text-[#04714a]">
                2. Kho Tri Thức Số
              </h2>
            </div>

            <p className="mono text-xs uppercase tracking-[.18em] text-black/35">
              DIGITAL KNOWLEDGE REPOSITORY
            </p>
            <div className="mx-auto mt-4 w-full max-w-[1100px]">
              <KnowledgeRepositoryIllustration className="h-auto w-full" />
            </div>
            <div className="mx-auto mt-2 max-w-3xl text-center">
              <p className="text-sm leading-7 text-black/55 md:text-base">
                Kết nối trực tiếp với hệ thống thư viện và giáo trình của nhà
                trường. Trích xuất chính xác tài liệu, bài giảng và link sách
                tham khảo chuẩn xác. Gợi ý lộ trình đọc và tự học phù hợp theo
                từng môn chuyên ngành.
              </p>
            </div>
          </section>

          <section>
            <div className="mb-6 flex items-center gap-3">
              <FileText className="text-[#00a86b]" size={24} />

              <h2 className="text-2xl font-bold text-[#04714a]">
                3. Tra cứu & Hỗ trợ Hành chính Nội bộ
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-3xl border border-black/10 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#00a86b]/30 hover:shadow-lg">
                <span className="mono text-sm text-[#00a86b]">01</span>

                <h3 className="mt-6 text-xl font-semibold">Kho biểu mẫu</h3>

                <p className="mt-3 leading-7 text-black/55">
                  Cung cấp đầy đủ các giấy tờ, đơn từ hành chính chuẩn form.
                </p>
              </article>

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
