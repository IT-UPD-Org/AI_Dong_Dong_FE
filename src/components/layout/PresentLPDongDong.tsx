import { useState } from "react";

interface PresentLPDongDongProps {
  onHoverLogo?: (hovered: boolean) => void;
}

export function PresentLPDongDong({ onHoverLogo }: PresentLPDongDongProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="brand-hero relative z-10 my-auto flex min-h-80 w-full items-center gap-5 py-6 md:gap-7"
      onMouseLeave={() => {
        setIsOpen(false);
        onHoverLogo?.(false);
      }}
    >
      <button
        type="button"
        aria-label="Xem lời giới thiệu của IT UPD GenAI"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        onMouseEnter={() => onHoverLogo?.(true)}
        onMouseLeave={() => onHoverLogo?.(false)}
        className="group/logo w-[38%] max-w-48 shrink-0 cursor-pointer rounded-2xl focus-visible:outline-offset-8"
      >
        <img
          src="/assets/upd-logo-transparent.png"
          alt="Biểu tượng IT UPD"
          className="w-full object-contain drop-shadow-[0_12px_20px_rgba(0,60,40,0.12)] transition-transform duration-500 ease-out group-hover/logo:-translate-y-1 group-hover/logo:scale-105"
        />
      </button>

      <div
        className={`brand-hero__message relative min-w-0 flex-1 rounded-[24px] bg-[#b2d0b7]/95 px-4 py-4 text-[#193527] shadow-[0_14px_28px_rgba(0,70,43,0.08)] md:px-5 ${
          isOpen ? "brand-hero__message--open" : ""
        }`}
      >
        <span
          aria-hidden="true"
          className="absolute -left-2.5 top-1/2 size-5 -translate-y-1/2 rotate-45 bg-[#b2d0b7]"
        />
        <p className="relative text-xs leading-relaxed sm:text-sm">
          Mình là IT UPD GenAI mã <strong>#UAI-UNIT_01</strong>, sẽ hỗ trợ bạn
          trong học tập.
        </p>
      </div>
    </div>
  );
}
