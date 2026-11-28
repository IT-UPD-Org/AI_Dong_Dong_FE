import { useEffect } from "react";
import { BookOpen, FileText, Sparkles } from "lucide-react";
import { ProductDemoVideo } from "../components/landing/ProductDemoVideo";
import { HeroIntro } from "../components/landing/HeroIntro";
import { ChatShowcaseSection } from "../components/landing/ChatShowcaseSection";
import { KnowledgeRepositoryIllustration } from "../components/landing/KnowledgeRepositoryIllustration";
import { LandingFooter } from "../components/layout/LandingFooter";

export function LandingPage() {
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.slice(1);
      const el = document.getElementById(id);
      if (el) {
        const timeout = setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 150);
        return () => clearTimeout(timeout);
      }
    }
  }, []);

  return (
    <main className="overflow-x-clip text-foreground">
      <HeroIntro />
      <ProductDemoVideo />
      <section className="border-t border-border px-4 py-14 sm:px-6 sm:py-16 md:px-12 md:py-20">
        <p className="mono text-xs uppercase tracking-[.16em] sm:tracking-[.18em] text-muted-foreground">
          UAI-01 IT UPD GenAI sẽ làm được những gì
        </p>

        <div className="mt-8 space-y-20 sm:mt-12 md:space-y-32">
          <section id="ai-assistant" className="scroll-mt-24">
            <div className="mb-6 flex items-start gap-3 sm:items-center">
              <Sparkles className="mt-0.5 shrink-0 text-brand-bright sm:mt-0" size={24} />

              <h2 className="text-xl font-bold leading-snug text-brand-text sm:text-2xl">
                1. Trợ lý Trò chuyện & Tạo nội dung
                <span className="text-muted-foreground"> (Generative AI)</span>
              </h2>
            </div>

            <ChatShowcaseSection />
          </section>

          <section id="knowledge" className="relative scroll-mt-24">
            <div className="mb-2 flex items-start gap-3 sm:items-center">
              <BookOpen className="mt-0.5 shrink-0 text-brand-bright sm:mt-0" size={24} />

              <h2 className="text-xl font-bold leading-snug text-brand-text sm:text-2xl">
                2. Kho Tri Thức Số
              </h2>
            </div>

            <p className="mono text-xs uppercase tracking-[.16em] sm:tracking-[.18em] text-muted-foreground">
              DIGITAL KNOWLEDGE REPOSITORY
            </p>
            <div className="mx-auto mt-4 w-full max-w-[1100px] overflow-hidden">
              <KnowledgeRepositoryIllustration className="h-auto w-full" />
            </div>
            <div className="mx-auto mt-2 max-w-3xl text-center">
              <p className="text-sm leading-7 text-fg-secondary md:text-base">
                Kết nối trực tiếp với hệ thống thư viện và giáo trình của nhà
                trường. Trích xuất chính xác tài liệu, bài giảng và link sách
                tham khảo chuẩn xác. Gợi ý lộ trình đọc và tự học phù hợp theo
                từng môn chuyên ngành.
              </p>
            </div>
          </section>

          <section id="administration" className="scroll-mt-24">
            <div className="mb-6 flex items-start gap-3 sm:items-center">
              <FileText className="mt-0.5 shrink-0 text-brand-bright sm:mt-0" size={24} />

              <h2 className="text-xl font-bold leading-snug text-brand-text sm:text-2xl">
                3. Tra cứu & Hỗ trợ Hành chính Nội bộ
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <article className="rounded-2xl border border-border bg-card p-5 text-foreground transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg sm:rounded-3xl sm:p-7">
                <span className="mono text-sm text-brand-text">01</span>

                <h3 className="mt-4 text-lg font-semibold text-foreground sm:mt-6 sm:text-xl">Kho biểu mẫu</h3>

                <p className="mt-2.5 text-sm leading-7 text-fg-secondary sm:mt-3 sm:text-base">
                  Cung cấp đầy đủ các giấy tờ, đơn từ hành chính chuẩn form.
                </p>
              </article>

              <article className="rounded-2xl border border-border bg-card p-5 text-foreground transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg sm:rounded-3xl sm:p-7">
                <span className="mono text-sm text-brand-text">02</span>

                <h3 className="mt-4 text-lg font-semibold text-foreground sm:mt-6 sm:text-xl">Tra cứu nhanh</h3>

                <p className="mt-2.5 text-sm leading-7 text-fg-secondary sm:mt-3 sm:text-base">
                  Tra cứu điểm thi, học phí, lịch trình lớp học và thông tin môn
                  học.
                </p>
              </article>

              {/* CARD 03 */}
              <article className="rounded-2xl border border-border bg-card p-5 text-foreground transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-lg sm:col-span-2 sm:rounded-3xl sm:p-7 md:col-span-1">
                <span className="mono text-sm text-brand-text">03</span>

                <h3 className="mt-4 text-lg font-semibold text-foreground sm:mt-6 sm:text-xl">Cẩm nang PDU</h3>

                <p className="mt-2.5 text-sm leading-7 text-fg-secondary sm:mt-3 sm:text-base">
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
