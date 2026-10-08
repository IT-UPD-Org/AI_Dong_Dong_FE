// \dong-dong_FE\src\pages\LandingPage.tsx

import { ArrowUpRight, BookOpen, FileText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductDemoVideo } from "../components/landing/ProductDemoVideo";
import { contributors } from "../mocks/data";
import { HeroIntro } from "../components/landing/HeroIntro";
import { ChatShowcaseSection } from "../components/landing/ChatShowcaseSection";
import { KnowledgeRepositoryIllustration } from "../components/landing/KnowledgeRepositoryIllustration";
const gems = [
  {
    id: "v3",
    size: "90%",
    top: "50%",
    left: "50%",
    center: true,
    opacity: 0.1,
  },
];

export function LandingPage() {
  return (
    <main>
      <HeroIntro />
      <ProductDemoVideo />
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
