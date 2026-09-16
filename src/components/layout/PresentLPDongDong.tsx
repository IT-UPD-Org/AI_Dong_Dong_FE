import { useState } from "react";

const dongDongMessages = [
  "Mình là Đông Đông mã #UAI-UNIT_01, sẽ hỗ trợ bạn trong học tập.",
  "Cùng mình đạt những thành tựu trong học tập nhé!",
  "Bạn có thể hỏi bất cứ điều gì, mình sẽ cố gắng giải đáp cho bạn.",
  "Đại học Phương Đông - Vững gốc để vươn xa, dưỡng ngọc thành hình nhoaaaa!",
];

export function PresentLPDongDong() {
  const [message, setMessage] = useState(dongDongMessages[0]);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    const randomIndex = Math.floor(Math.random() * dongDongMessages.length);

    setMessage(dongDongMessages[randomIndex]);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className="relative z-10 my-auto flex min-h-96 w-full items-center justify-center py-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Speech Bubble */}
      <div
        className={`
          absolute left-1/2 top-2 z-20
          w-[min(90%,380px)]
          -translate-x-1/2
          md:left-auto md:right-2 md:top-1/2
          md:w-82.5
          md:translate-x-0 md:-translate-y-1/2

          rounded-2xl
          border border-[#00a86b]/30
          bg-white/95
          px-5 py-4
          text-sm
          leading-6
          text-[#11130f]
          shadow-[0_15px_50px_rgba(0,168,107,0.18)]
          backdrop-blur-md

          transition-all
          duration-500
          ease-out

          ${
            isHovered
              ? "translate-y-0 opacity-100 md:translate-x-0 md:-translate-y-1/2"
              : "-translate-y-3 opacity-0 pointer-events-none md:translate-x-8 md:-translate-y-1/2"
          }
        `}
      >
        <p className="font-medium text-black/75">{message}</p>

        <span
          className="
            absolute
            left-1/2
            -bottom-2
            size-4
            -translate-x-1/2
            rotate-45
            border-b
            border-r
            border-[#00a86b]/30
            bg-white/95
            md:left-[-7px]
            md:top-1/2
            md:bottom-auto
            md:translate-x-0
            md:-translate-y-1/2
            md:rotate-[135deg]
          "
        />
      </div>

      <div
        className={`
          relative
          flex
          items-center
          justify-center
          transition-all
          duration-700
          ease-[cubic-bezier(.22,1,.36,1)]

          ${
            isHovered
              ? "translate-y-12 md:-translate-x-28.75 md:translate-y-0"
              : "translate-x-0 translate-y-0"
          }
        `}
      >
        <div
          className={`
            absolute
            h-48
            w-48
            rounded-full
            bg-[#00a86b]/10
            blur-3xl
            transition-all
            duration-700
            ${isHovered ? "scale-125 opacity-100" : "scale-90 opacity-60"}
          `}
        />

        <img
          src="/assets/dongdong_avt_01.png"
          alt="Đông Đông GenAI Avatar"
          className={`
            relative
            z-10
            h-80
            w-auto
            rounded-2xl
            object-contain
            drop-shadow-[0_10px_20px_rgba(0,168,107,0.2)]
            transition-all
            duration-700
            ease-[cubic-bezier(.22,1,.36,1)]

            ${isHovered ? "scale-105" : "scale-100"}
          `}
        />
      </div>

      <div
        className={`
          absolute
          bottom-1
          left-1/2
          -translate-x-1/2
          mono
          text-[9px]
          uppercase
          tracking-[0.18em]
          text-white/30
          transition-opacity
          duration-300
          ${isHovered ? "opacity-0" : "opacity-100"}
        `}
      >
        Di chuột để xem thông điệp từ Đông Đông
      </div>
    </div>
  );
}
