import { useEffect, useRef, useState } from "react";

export function ProductDemoVideo() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.25,
      },
    );

    observer.observe(section);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Chờ animation reveal hoàn thành
    const timer = window.setTimeout(() => {
      videoRef.current?.play().catch(() => {});
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [isVisible]);

  return (
    <section
      ref={sectionRef}
      className="border-t border-black/10 px-6 py-16 md:px-12 md:py-24"
    >
      <div className="mx-auto max-w-6xl">
        {/* HEADER */}
        <div
          className={`
            mb-8 text-center
            transition-all
            duration-1000
            ease-out

            ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-16 opacity-0"
            }
          `}
        >
          <p className="mono text-xs uppercase tracking-[.18em] text-[#04714a]">
            EXPERIENCE UAI-01
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#04714a] md:text-5xl">
            Khám phá Đông Đông AI
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-black/55 md:text-base">
            Trải nghiệm cách trí tuệ nhân tạo hỗ trợ học tập, tra cứu thông tin
            và khai thác kho tri thức số.
          </p>
        </div>

        {/* VIDEO */}
        <div
          className={`
            overflow-hidden
            rounded-[10px]
            border border-black/10
            bg-[#f8faf9]
            shadow-xl
            transition-all
            duration-1400
            ease-[cubic-bezier(0.22,1,0.36,1)]

            ${
              isVisible
                ? "translate-y-0 scale-100 opacity-100"
                : "translate-y-32 scale-[0.94] opacity-0"
            }
          `}
        >
          <video
            ref={videoRef}
            className="block h-auto w-full"
            muted
            loop
            playsInline
            preload="metadata"
            controls={false}
            disablePictureInPicture
            onContextMenu={(event) => event.preventDefault()}
          >
            <source src="/assets/video/present_video.mp4" type="video/mp4" />
          </video>
        </div>

        {/* CAPTION */}
        <p
          className={`
            mt-4 text-center text-xs text-black/40
            transition-all
            duration-700
            ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0"
            }
          `}
        >
          UAI-01 · University Artificial Intelligence
        </p>
      </div>
    </section>
  );
}
