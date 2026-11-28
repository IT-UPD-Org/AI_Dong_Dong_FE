// dong-dong_FE\src\components\landing\ChatShowcaseSection.tsx
import { AiSphereIllustration } from "./AiSphereIllustration";

interface FeatureCaption {
  text: string;
  positionClassName: string;
}

const CAPTIONS: FeatureCaption[] = [
  {
    text: "Phản hồi tự nhiên, chuẩn xác nhờ tích hợp các mô hình LLM thế hệ mới.",
    positionClassName: "top-[8%] right-0 text-right lg:right-[6%]",
  },
  {
    text: "Thấu hiểu ngữ cảnh linh hoạt, đóng vai trò như một trợ lý riêng 24/7.",
    positionClassName: "top-[48%] right-0 text-right",
  },
  {
    text: "Giải đáp tức thì mọi thắc mắc học tập với tốc độ xử lý siêu tốc.",
    positionClassName: "bottom-[10%] left-0 text-left",
  },
];

export function ChatShowcaseSection() {
  return (
    <div className="overflow-hidden">
      <p className="mono text-center text-xs uppercase tracking-[.16em] sm:tracking-[.18em] text-brand-text">
        01 — Trò Chuyện Thông Minh
      </p>
      <div className="relative mx-auto mt-6 h-[290px] w-full max-w-[340px] sm:mt-10 sm:h-[420px] sm:max-w-[520px] md:h-[660px] md:max-w-[920px] lg:h-[760px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <AiSphereIllustration
            className="
                w-[270px]
                max-w-full
                sm:w-[390px]
                md:w-[560px]
                lg:w-[650px]
            "
          />
        </div>

        {CAPTIONS.map((caption) => (
          <p
            key={caption.text}
            className={`mono absolute hidden max-w-[260px] lg:max-w-[320px] text-xs leading-5 text-brand-text md:block ${caption.positionClassName}`}
          >
            {caption.text}
          </p>
        ))}
      </div>
      <ul className="mt-5 space-y-2.5 md:hidden">
        {CAPTIONS.map((caption) => (
          <li
            key={caption.text}
            className="flex gap-2.5 rounded-xl border border-border/60 bg-card/60 px-3.5 py-2.5 text-sm leading-6 text-fg-secondary"
          >
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-bright" />
            <span>{caption.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
