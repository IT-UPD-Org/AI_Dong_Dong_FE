import { useState, type FormEvent } from "react";
import { AlertTriangle, Lightbulb, Star, X } from "lucide-react";
import { toast } from "sonner";

import { IssueImagePicker } from "./IssueImagePicker";

type FeedbackMode = "suggestion" | "issue";

interface MessageFeedbackPanelProps {
  onClose: () => void;
}

const ISSUE_TYPES = [
  "Thông tin sai",
  "Không đúng câu hỏi",
  "Lỗi hiển thị",
  "Khác",
];

const RATING_LABELS = [
  "Rất không hài lòng",
  "Chưa hài lòng",
  "Bình thường",
  "Hài lòng",
  "Rất hài lòng",
];

const FEEDBACK_MODES = [
  { id: "suggestion" as const, label: "Góp ý", icon: Lightbulb },
  { id: "issue" as const, label: "Báo lỗi", icon: AlertTriangle },
];

export function MessageFeedbackPanel({ onClose }: MessageFeedbackPanelProps) {
  const [mode, setMode] = useState<FeedbackMode>("suggestion");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [issueType, setIssueType] = useState("");
  const [issueDetail, setIssueDetail] = useState("");
  const [issueImage, setIssueImage] = useState<File | null>(null);

  const isSuggestion = mode === "suggestion";
  const canSubmit = isSuggestion
    ? rating > 0
    : issueType !== "" && issueDetail.trim() !== "";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    toast.success(
      isSuggestion
        ? "Cảm ơn bạn đã gửi góp ý!"
        : "Cảm ơn bạn đã gửi báo lỗi!",
      {
        description: "Phản hồi đã được ghi nhận trên phiên làm việc này.",
      }
    );

    onClose();
  }

  return (
    <section
      aria-label="Phản hồi về câu trả lời"
      className="mt-4 w-full animate-in rounded-2xl border border-black/10 bg-[#f7f8f5] p-4 shadow-sm fade-in slide-in-from-bottom-2 duration-300 md:max-w-[88%]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#172b21]">
            Phản hồi về câu trả lời
          </h2>
          <p className="mt-1 text-xs leading-5 text-black/45">
            Ý kiến của bạn giúp Đông Đông AI trả lời tốt hơn.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng phần phản hồi"
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/5 hover:text-black"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs chọn Góp ý / Báo lỗi */}
      <div
        role="tablist"
        aria-label="Loại phản hồi"
        className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-black/[.04] p-1"
      >
        {FEEDBACK_MODES.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={mode === id}
            onClick={() => setMode(id)}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-300 ${
              mode === id
                ? "bg-[#173b2b] text-white shadow-sm opacity-100"
                : "text-black/55 opacity-55 hover:bg-white/70 hover:opacity-85"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex min-h-[250px] flex-col"
      >
        <div className="flex-1">
          {isSuggestion ? (
            <div role="tabpanel">
              <fieldset>
                <legend className="text-xs font-medium text-black/60">
                  Bạn hài lòng với câu trả lời này ở mức nào?
                </legend>
                <div
                  className="mt-2 flex items-center gap-1"
                  onMouseLeave={() => setHoveredRating(0)}
                >
                  {RATING_LABELS.map((label, index) => {
                    const value = index + 1;
                    const selected = value <= (hoveredRating || rating);

                    return (
                      <button
                        key={label}
                        type="button"
                        aria-label={`${value} sao: ${label}`}
                        aria-pressed={rating === value}
                        title={label}
                        onMouseEnter={() => setHoveredRating(value)}
                        onFocus={() => setHoveredRating(value)}
                        onBlur={() => setHoveredRating(0)}
                        onClick={() => setRating(value)}
                        className="rounded-md p-1 transition-transform duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04714a]"
                      >
                        <Star
                          size={24}
                          className={
                            selected
                              ? "fill-[#00a86b] text-[#00a86b]"
                              : "fill-transparent text-black/20"
                          }
                        />
                      </button>
                    );
                  })}
                  {(hoveredRating || rating) > 0 && (
                    <span className="ml-2 text-xs font-medium text-[#04714a]">
                      {RATING_LABELS[(hoveredRating || rating) - 1]}
                    </span>
                  )}
                </div>
              </fieldset>

              <FeedbackTextarea
                label="Nhận xét của bạn"
                value={suggestion}
                onChange={setSuggestion}
                placeholder="Câu trả lời có điểm nào tốt hoặc cần cải thiện?"
                className="mt-4"
              />
            </div>
          ) : (
            <div role="tabpanel">
              <fieldset>
                <legend className="text-xs font-medium text-black/60">
                  Bạn gặp vấn đề gì?
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ISSUE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setIssueType(type)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition-all duration-200 ${
                        issueType === type
                          ? "border-[#04714a] bg-[#e1efe8] font-medium text-[#04714a]"
                          : "border-black/10 bg-white text-black/45 hover:border-black/20 hover:text-black/65"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px]">
                <FeedbackTextarea
                  label="Mô tả lỗi"
                  value={issueDetail}
                  onChange={setIssueDetail}
                  placeholder="Hãy mô tả điều đã xảy ra để chúng tôi có thể kiểm tra."
                  required
                />

                <div>
                  <p className="mb-2 text-xs font-medium text-black/60">
                    Ảnh lỗi <span className="font-normal text-black/35">(không bắt buộc)</span>
                  </p>
                  <IssueImagePicker file={issueImage} onChange={setIssueImage} />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-xl bg-[#04714a] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#035f3f] disabled:cursor-not-allowed disabled:opacity-35"
          >
            {isSuggestion ? "Gửi góp ý" : "Gửi báo lỗi"}
          </button>
        </div>
      </form>
    </section>
  );
}

interface FeedbackTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength?: number;
  required?: boolean;
  className?: string;
}

function FeedbackTextarea({
  label,
  value,
  onChange,
  placeholder,
  maxLength = 500,
  required = false,
  className = "",
}: FeedbackTextareaProps) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-black/60">
        {label}
        <textarea
          value={value}
          maxLength={maxLength}
          rows={3}
          required={required}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="mt-2 h-[108px] w-full resize-none rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm leading-6 text-[#11130f] outline-none transition-colors placeholder:text-black/30 focus:border-[#00a86b]/60"
        />
      </label>
      <p className="mt-1 text-right text-[10px] text-black/35">
        {value.length}/{maxLength}
      </p>
    </div>
  );
}
