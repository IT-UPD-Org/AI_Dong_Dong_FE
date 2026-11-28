import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export function HeroIntro() {
  return (
    <section className="relative isolate flex min-h-[calc(100dvh-56px)] sm:min-h-[calc(100dvh-64px)] items-center justify-center overflow-hidden px-4 py-10 text-foreground sm:px-6 sm:py-16 md:px-12 md:py-24">
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
            h-[320px]
            w-[320px]
            sm:h-[520px]
            sm:w-[520px]
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
        <p className="mono mb-4 max-w-full break-words text-[11px] uppercase tracking-[.12em] text-brand-text sm:mb-6 sm:text-xs sm:tracking-[.18em] md:mb-8 md:text-sm">
          University Artificial Intelligence / barcode : UAI-01
        </p>

        {/* Main title */}
        <h1 className="max-w-full font-extrabold leading-[0.98] tracking-[-0.055em] text-brand-text">
          <span className="block text-4xl sm:text-6xl md:text-8xl lg:text-[7rem] xl:text-[8rem]">
            IT UPD GenAI
          </span>

          <span className="mx-auto mt-4 block max-w-4xl text-lg font-medium leading-snug tracking-[-0.03em] text-muted-foreground sm:mt-6 sm:text-2xl md:mt-8 md:text-4xl md:leading-tight">
            Đạt những thành tựu học tập với sự trợ giúp của trí tuệ nhân tạo.
          </span>
        </h1>

        {/* Description */}
        <p className="mx-auto mt-5 max-w-3xl text-center text-sm leading-6 text-fg-secondary sm:mt-7 sm:leading-7 md:mt-9 md:text-lg md:leading-8">
          IT UPD GenAI là một nền tảng trí tuệ nhân tạo được thiết kế để hỗ trợ
          sinh viên và giảng viên trong việc tìm kiếm thông tin, giải đáp thắc
          mắc và nâng cao trải nghiệm học tập tại Đại học Phương Đông.
        </p>

        {/* Buttons */}
        <div className="mt-6 flex w-full flex-col items-stretch justify-center gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            to="/login"
            className="
              flex min-h-11 items-center justify-center
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
              flex min-h-11 items-center justify-center
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
