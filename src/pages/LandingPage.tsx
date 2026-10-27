import { ArrowUpRight, BookOpen, FileText, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductDemoVideo } from "../components/landing/ProductDemoVideo";
import { HeroIntro } from "../components/landing/HeroIntro";
import { ChatShowcaseSection } from "../components/landing/ChatShowcaseSection";
import { KnowledgeRepositoryIllustration } from "../components/landing/KnowledgeRepositoryIllustration";
import { LandingFooter } from "../components/layout/LandingFooter";
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
          <section id="ai-assistant" className="scroll-mt-24">
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className="text-[#00a86b]" size={24} />

              <h2 className="text-2xl font-bold text-[#04714a]">
                1. Trợ lý Trò chuyện & Tạo nội dung
                <span className="text-black/35"> (Generative AI)</span>
              </h2>
            </div>

            <ChatShowcaseSection />
          </section>
          <section id="knowledge" className="relative scroll-mt-24">
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

          <section id="administration" className="scroll-mt-24">
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

      <LandingFooter />
    </main>
  );
}
