import { useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, Lightbulb, Star, X } from "lucide-react";

import { IssueImagePicker } from "./IssueImagePicker";
import { useLanguage } from "../../contexts/LanguageContext";

export type FeedbackMode = "suggestion" | "issue";

interface MessageFeedbackPanelProps {
  onClose: () => void;
  /** Tab to open on: "suggestion" after like/dislike, "issue" from the report button. */
  initialMode?: FeedbackMode;
}

const issueTypesVi = [
  "Thông tin sai",
  "Không đúng câu hỏi",
  "Lỗi hiển thị",
  "Khác",
];

const issueTypesEn = [
  "Incorrect information",
  "Off-topic response",
  "Rendering bug",
  "Other",
];

const ratingLabelsVi = [
  "Rất không hài lòng",
  "Chưa hài lòng",
  "Bình thường",
  "Hài lòng",
  "Rất hài lòng",
];

const ratingLabelsEn = [
  "Very dissatisfied",
  "Dissatisfied",
  "Neutral",
  "Satisfied",
  "Very satisfied",
];

export function MessageFeedbackPanel({ onClose, initialMode = "suggestion" }: MessageFeedbackPanelProps) {
  const { lang } = useLanguage();
  const isEn = lang === "en";
  const [mode, setMode] = useState<FeedbackMode>(initialMode);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [suggestion, setSuggestion] = useState("");
  const [issueType, setIssueType] = useState("");
  const [issueDetail, setIssueDetail] = useState("");
  const [issueImage, setIssueImage] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const issueTypes = isEn ? issueTypesEn : issueTypesVi;
  const ratingLabels = isEn ? ratingLabelsEn : ratingLabelsVi;

  const canSubmit =
    mode === "suggestion"
      ? rating > 0
      : issueType !== "" && issueDetail.trim() !== "";

  function selectMode(nextMode: FeedbackMode) {
    setMode(nextMode);
    setSubmitted(false);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
  }

  return (
    <section
      aria-label={isEn ? "Feedback on response" : "Phản hồi về câu trả lời"}
      className="mt-4 w-full animate-in rounded-2xl border border-black/10 bg-[#f7f8f5] p-4 shadow-sm dark:border-white/10 dark:bg-[#1e1e1e] dark:text-gray-100 fade-in slide-in-from-bottom-2 duration-300 md:max-w-[88%]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#172b21] dark:text-white">
            {isEn ? "Feedback on response" : "Phản hồi về câu trả lời"}
          </h2>
          <p className="mt-1 text-xs leading-5 text-black/45 dark:text-gray-400">
            {isEn
              ? "Your feedback helps Dong Dong AI improve."
              : "Ý kiến của bạn giúp Đông Đông AI trả lời tốt hơn."}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={isEn ? "Close feedback" : "Đóng phần phản hồi"}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-black/40 hover:bg-black/5 hover:text-black dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div
        role="tablist"
        aria-label={isEn ? "Feedback type" : "Loại phản hồi"}
        className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-black/[.04] p-1 dark:bg-white/5"
      >
        <FeedbackTab
          active={mode === "suggestion"}
          icon={<Lightbulb size={15} />}
          label={isEn ? "Suggestion" : "Góp ý"}
          onClick={() => selectMode("suggestion")}
        />
        <FeedbackTab
          active={mode === "issue"}
          icon={<AlertTriangle size={15} />}
          label={isEn ? "Report issue" : "Báo lỗi"}
          onClick={() => selectMode("issue")}
        />
      </div>

      {submitted ? (
        <div
          role="status"
          className="mt-4 grid min-h-[250px] place-content-center rounded-xl border border-[#9fc4b0]/60 bg-[#e8f2ed] px-4 py-5 text-center dark:border-emerald-800 dark:bg-emerald-950/40"
        >
          <p className="text-sm font-semibold text-[#04714a] dark:text-emerald-400">
            {isEn
              ? `Thank you for submitting your ${mode === "suggestion" ? "feedback" : "issue report"}.`
              : `Cảm ơn bạn đã gửi ${mode === "suggestion" ? "góp ý" : "báo lỗi"}.`}
          </p>
          <p className="mt-1 text-xs text-black/50 dark:text-gray-400">
            {isEn
              ? "Feedback recorded for this session."
              : "Phản hồi đã được ghi nhận trên phiên làm việc này."}
          </p>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex min-h-[250px] flex-col"
        >
          <div className="flex-1">
            {mode === "suggestion" ? (
              <SuggestionForm
                rating={rating}
                hoveredRating={hoveredRating}
                suggestion={suggestion}
                onRatingChange={setRating}
                onRatingHover={setHoveredRating}
                onSuggestionChange={setSuggestion}
                ratingLabels={ratingLabels}
                isEn={isEn}
              />
            ) : (
              <IssueForm
                issueTypes={issueTypes}
                issueType={issueType}
                issueDetail={issueDetail}
                issueImage={issueImage}
                onIssueTypeChange={setIssueType}
                onIssueDetailChange={setIssueDetail}
                onImageChange={setIssueImage}
                isEn={isEn}
              />
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-xl bg-[#04714a] px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#035f3f] dark:bg-emerald-600 dark:hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
            >
              {mode === "suggestion"
                ? isEn ? "Submit suggestion" : "Gửi góp ý"
                : isEn ? "Submit report" : "Gửi báo lỗi"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

interface FeedbackTabProps {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function FeedbackTab({ active, icon, label, onClick }: FeedbackTabProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all duration-300 cursor-pointer ${
        active
          ? "bg-[#173b2b] text-white shadow-sm opacity-100 dark:bg-emerald-600"
          : "text-black/55 opacity-55 hover:bg-white/70 hover:opacity-85 dark:text-gray-300 dark:hover:bg-white/10 dark:opacity-75"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

interface SuggestionFormProps {
  rating: number;
  hoveredRating: number;
  suggestion: string;
  onRatingChange: (rating: number) => void;
  onRatingHover: (rating: number) => void;
  onSuggestionChange: (suggestion: string) => void;
  ratingLabels: string[];
  isEn: boolean;
}

function SuggestionForm({
  rating,
  hoveredRating,
  suggestion,
  onRatingChange,
  onRatingHover,
  onSuggestionChange,
  ratingLabels,
  isEn,
}: SuggestionFormProps) {
  const visibleRating = hoveredRating || rating;

  return (
    <div role="tabpanel">
      <fieldset>
        <legend className="text-xs font-medium text-black/60 dark:text-gray-400">
          {isEn ? "How satisfied are you with this answer?" : "Bạn hài lòng với câu trả lời này ở mức nào?"}
        </legend>
        <div
          className="mt-2 flex items-center gap-1"
          onMouseLeave={() => onRatingHover(0)}
        >
          {ratingLabels.map((label, index) => {
            const value = index + 1;
            const selected = value <= visibleRating;

            return (
              <button
                key={label}
                type="button"
                aria-label={`${value} star: ${label}`}
                aria-pressed={rating === value}
                title={label}
                onMouseEnter={() => onRatingHover(value)}
                onFocus={() => onRatingHover(value)}
                onBlur={() => onRatingHover(0)}
                onClick={() => onRatingChange(value)}
                className="rounded-md p-1 transition-transform duration-200 hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#04714a] cursor-pointer"
              >
                <Star
                  size={24}
                  className={
                    selected
                      ? "fill-[#00a86b] text-[#00a86b] dark:fill-emerald-400 dark:text-emerald-400"
                      : "fill-transparent text-black/20 dark:text-white/20"
                  }
                />
              </button>
            );
          })}
          {visibleRating > 0 && (
            <span className="ml-2 text-xs font-medium text-[#04714a] dark:text-emerald-400">
              {ratingLabels[visibleRating - 1]}
            </span>
          )}
        </div>
      </fieldset>

      <label className="mt-4 block text-xs font-medium text-black/60 dark:text-gray-400">
        {isEn ? "Your comment" : "Nhận xét của bạn"}
        <textarea
          value={suggestion}
          maxLength={500}
          rows={3}
          onChange={(event) => onSuggestionChange(event.target.value)}
          placeholder={isEn ? "What was good or needs improvement in the answer?" : "Câu trả lời có điểm nào tốt hoặc cần cải thiện?"}
          className="mt-2 w-full resize-none rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm leading-6 text-[#11130f] dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500 outline-none transition-colors placeholder:text-black/30 focus:border-[#00a86b]/60 dark:focus:border-emerald-500"
        />
      </label>
      <p className="mt-1 text-right text-[10px] text-black/35 dark:text-gray-500">
        {suggestion.length}/500
      </p>
    </div>
  );
}

interface IssueFormProps {
  issueTypes: string[];
  issueType: string;
  issueDetail: string;
  issueImage: File | null;
  onIssueTypeChange: (issueType: string) => void;
  onIssueDetailChange: (issueDetail: string) => void;
  onImageChange: (file: File | null) => void;
  isEn: boolean;
}

function IssueForm({
  issueTypes,
  issueType,
  issueDetail,
  issueImage,
  onIssueTypeChange,
  onIssueDetailChange,
  onImageChange,
  isEn,
}: IssueFormProps) {
  return (
    <div role="tabpanel">
      <fieldset>
        <legend className="text-xs font-medium text-black/60 dark:text-gray-400">
          {isEn ? "What issue did you encounter?" : "Bạn gặp vấn đề gì?"}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {issueTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onIssueTypeChange(type)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-all duration-200 cursor-pointer ${
                issueType === type
                  ? "border-[#04714a] bg-[#e1efe8] font-medium text-[#04714a] dark:border-emerald-500 dark:bg-emerald-950/60 dark:text-emerald-300"
                  : "border-black/10 bg-white text-black/45 hover:border-black/20 hover:text-black/65 dark:border-white/15 dark:bg-white/5 dark:text-gray-300 dark:hover:border-white/25"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_240px]">
        <div>
          <label className="block text-xs font-medium text-black/60 dark:text-gray-400">
            {isEn ? "Issue description" : "Mô tả lỗi"}
            <textarea
              value={issueDetail}
              maxLength={500}
              rows={3}
              required
              onChange={(event) => onIssueDetailChange(event.target.value)}
              placeholder={isEn ? "Describe what happened so we can investigate." : "Hãy mô tả điều đã xảy ra để chúng tôi có thể kiểm tra."}
              className="mt-2 h-[108px] w-full resize-none rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm leading-6 text-[#11130f] dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500 outline-none transition-colors placeholder:text-black/30 focus:border-[#00a86b]/60 dark:focus:border-emerald-500"
            />
          </label>
          <p className="mt-1.5 min-h-4 text-right text-[10px] text-black/35 dark:text-gray-500">
            {issueDetail.length}/500
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-black/60 dark:text-gray-400">
            {isEn ? "Screenshot" : "Ảnh lỗi"}{" "}
            <span className="font-normal text-black/35 dark:text-gray-500">
              {isEn ? "(optional)" : "(không bắt buộc)"}
            </span>
          </p>
          <IssueImagePicker file={issueImage} onChange={onImageChange} />
        </div>
      </div>
    </div>
  );
}
