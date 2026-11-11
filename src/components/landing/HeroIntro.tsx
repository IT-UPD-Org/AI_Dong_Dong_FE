import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroIntro() {
  return (
    <section className="relative isolate flex min-h-[calc(100vh-80px)] items-center justify-center overflow-hidden px-6 py-20 text-foreground md:px-12 md:py-28">
      {/* =========================================================
          BLURRED BACKGROUND IMAGE
      ========================================================= */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <img
          src="/assets/images/hero-blur.png"
          alt=""
          aria-hidden="true"
          className="
            absolute
            left-1/2
            top-1/2
            h-[520px]
            w-[520px]
            -translate-x-1/2
            -translate-y-1/2
            scale-125
            object-cover
            rounded-full
            opacity-30
            blur-[90px]
          "
        />

        {/* Lớp phủ để chữ luôn nổi bật và thích ứng theo theme */}
        <div className="absolute inset-0 bg-background/60" />
      </div>

      {/* =========================================================
          HERO CONTENT
      ========================================================= */}
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
        {/* Barcode */}
        <p className="mono mb-8 text-xs uppercase tracking-[.18em] text-brand-text md:text-sm">
          University Artificial Intelligence / barcode : UAI-01
        </p>

        {/* Main title */}
        <h1 className="font-extrabold leading-[0.95] tracking-[-0.055em] text-brand-text">
          <span className="block text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[8rem]">
            IT UPD GenAI
          </span>

          <span className="mx-auto mt-8 block max-w-4xl text-xl font-medium leading-tight tracking-[-0.03em] text-muted-foreground sm:text-2xl md:text-4xl">
            Đạt những thành tựu học tập với sự trợ giúp của trí tuệ nhân tạo.
          </span>
        </h1>

        {/* Description */}
        <p className="mx-auto mt-9 max-w-3xl text-center text-sm leading-7 text-fg-secondary md:text-lg md:leading-8">
          IT UPD GenAI là một nền tảng trí tuệ nhân tạo được thiết kế để hỗ trợ
          sinh viên và giảng viên trong việc tìm kiếm thông tin, giải đáp thắc
          mắc và nâng cao trải nghiệm học tập tại Đại học Phương Đông.
        </p>

        {/* Buttons */}
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            to="/login"
            className="
              flex items-center justify-center
              rounded-full
              bg-brand
              px-6 py-3
              text-sm font-semibold text-brand-foreground
              transition-all duration-300
              hover:scale-95
              hover:bg-brand-hover
              shadow-sm
            "
          >
            Thử Ngay
            <ArrowUpRight className="ml-2" size={16} />
          </Link>

          <Link
            to="/approve"
            className="
              rounded-full
              border border-border
              px-6 py-3
              text-sm
              text-foreground
              transition-colors
              hover:border-brand
              hover:text-brand-text
              hover:bg-hover
            "
          >
            Cấp phép tài khoản
          </Link>
        </div>
      </div>
    </section>
  );
}
