// dong-dong_FE\src\components\landing\ChatShowcaseSection.tsx
import { AiSphereIllustration } from "./AiSphereIllustration";

interface FeatureCaption {
  text: string;
  positionClassName: string;
}

const CAPTIONS: FeatureCaption[] = [
  {
    text: "Phản hồi tự nhiên, chuẩn xác nhờ tích hợp các mô hình LLM thế hệ mới.",
    positionClassName: "top-[8%] right-[2%] text-right md:right-[10%]",
  },
  {
    text: "Thấu hiểu ngữ cảnh linh hoạt, đóng vai trò như một trợ lý riêng 24/7.",
    positionClassName: "top-[48%] right-0 text-right md:right-[-8%]",
  },
  {
    text: "Giải đáp tức thì mọi thắc mắc học tập với tốc độ xử lý siêu tốc.",
    positionClassName: "bottom-[10%] left-[2%] text-left md:left-[-4%]",
  },
];

export function ChatShowcaseSection() {
  return (
    <div>
      <p className="mono text-center text-xs uppercase tracking-[.18em] text-[#00a86b]">
        01 — Trò Chuyện Thông Minh
      </p>
      <div className="relative mx-auto mt-10 h-135 w-full max-w-140 md:h-[760px] md:max-w-[920px]">
        <div className="absolute inset-0 flex items-center justify-center">
          <AiSphereIllustration
            className="
                h-[470px]
                w-[470px]
                max-w-none
                md:h-[650px]
                md:w-[650px]
            "
          />
        </div>

        {CAPTIONS.map((caption) => (
          <p
            key={caption.text}
            className={`mono absolute hidden max-w-[320px] text-xs leading-5 text-[#04714a] md:block ${caption.positionClassName}`}
          >
            {caption.text}
          </p>
        ))}
      </div>
      <ul className="mt-8 space-y-3 md:hidden">
        {CAPTIONS.map((caption) => (
          <li
            key={caption.text}
            className="flex gap-2 text-sm leading-6 text-black/60"
          >
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#00a86b]" />
            {caption.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
