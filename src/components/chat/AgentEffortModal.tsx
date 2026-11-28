import { useEffect, useRef } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

export type AgentLevel = "L1" | "L2" | "L3";

export interface AgentLevelConfig {
  id: AgentLevel;
  label: string;
  descriptionVi: string;
  descriptionEn: string;
  subAgents: string;
  managerAgent: string;
  usageMultiplier: string;
}

export const AGENT_LEVEL_CONFIGS: Record<AgentLevel, AgentLevelConfig> = {
  L1: {
    id: "L1",
    label: "Instant",
    descriptionVi: "Trả lời nhanh, súc tích",
    descriptionEn: "Fast, concise responses",
    subAgents: "None",
    managerAgent: "Gemini + Mistral 3 8B",
    usageMultiplier: "1x Token",
  },
  L2: {
    id: "L2",
    label: "Standard",
    descriptionVi: "Cân bằng tốc độ và chi tiết",
    descriptionEn: "Balanced speed and detail",
    subAgents: "Mistral 3 8B + Gemini",
    managerAgent: "LLM 27-120B",
    usageMultiplier: "1.5x Token",
  },
  L3: {
    id: "L3",
    label: "Detail",
    descriptionVi: "Phân tích sâu, đầy đủ với suy luận nâng cao",
    descriptionEn: "In-depth analysis with advanced reasoning",
    subAgents: "Mistral 3 8B + Gemini",
    managerAgent: "LLM 27-120B (High Reasoning)",
    usageMultiplier: "2x Token",
  },
};

interface AgentEffortModalProps {
  isOpen: boolean;
  onClose: () => void;
  level: AgentLevel;
  onLevelChange: (level: AgentLevel) => void;
}

const LEVEL_KEYS: AgentLevel[] = ["L1", "L2", "L3"];

export function AgentEffortModal({
  isOpen,
  onClose,
  level,
  onLevelChange,
}: AgentEffortModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentIndex = LEVEL_KEYS.indexOf(level);
  const currentConfig = AGENT_LEVEL_CONFIGS[level];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("effortTitle")}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-overlay p-3 sm:p-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xs"
    >
      {/* Backdrop overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md max-h-[88dvh] overflow-y-auto rounded-2xl bg-elevated p-4 sm:p-5 shadow-xl border border-border transition-colors"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-border">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-foreground">
              {t("effortTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t("effortSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={language === "vi" ? "Đóng" : "Close"}
            className="flex size-10 sm:size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-hover hover:text-foreground cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 3-Step Slider / Bar */}
        <div className="my-5">
          <div className="grid grid-cols-3 gap-1 text-xs font-semibold mb-2">
            {LEVEL_KEYS.map((key, idx) => (
              <button
                key={key}
                type="button"
                onClick={() => onLevelChange(key)}
                className={`min-h-[36px] rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                  idx === 0 ? "text-left" : idx === 1 ? "text-center" : "text-right"
                } ${
                  level === key ? "text-brand-text font-bold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {AGENT_LEVEL_CONFIGS[key].label}
              </button>
            ))}
          </div>

          <div className="relative flex h-11 items-center">
            {/* Track Line */}
            <div className="h-2 w-full rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-brand transition-all duration-300"
                style={{ width: `${(currentIndex / 2) * 100}%` }}
              />
            </div>

            {/* Clickable Dots with 44px touch targets */}
            <div className="absolute inset-0 flex justify-between items-center">
              {LEVEL_KEYS.map((key, index) => (
                <button
                  key={key}
                  type="button"
                  aria-label={AGENT_LEVEL_CONFIGS[key].label}
                  aria-pressed={level === key}
                  onClick={() => onLevelChange(key)}
                  className="flex size-11 items-center justify-center rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-brand"
                >
                  <span
                    className={`size-5 rounded-full border-2 transition-all ${
                      index <= currentIndex
                        ? "border-brand bg-elevated ring-2 ring-brand/20"
                        : "border-border bg-elevated"
                    } ${level === key ? "scale-125 bg-brand" : ""}`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Model & Usage Details */}
        <div className="rounded-xl bg-surface p-3.5 sm:p-4 border border-border-subtle text-xs space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-semibold text-fg-secondary shrink-0">Level:</span>
            <span className="font-bold text-brand-text text-right">
              {currentConfig.label} ({currentConfig.id})
            </span>
          </div>
          <div>
            <span className="font-semibold text-fg-secondary">
              {language === "vi" ? "Mô tả:" : "Description:"}
            </span>
            <p className="text-muted-foreground mt-0.5 leading-relaxed">
              {language === "vi" ? currentConfig.descriptionVi : currentConfig.descriptionEn}
            </p>
          </div>
          <div className="pt-2 border-t border-border-subtle space-y-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground shrink-0">{t("managerModelLabel")}</span>
              <span className="font-medium text-foreground text-right [overflow-wrap:anywhere]">
                {currentConfig.managerAgent}
              </span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="text-muted-foreground shrink-0">{t("subAgentsLabel")}</span>
              <span className="font-medium text-foreground text-right [overflow-wrap:anywhere]">
                {currentConfig.subAgents}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 pt-1">
              <span className="text-muted-foreground shrink-0">{t("tokenMultiplierLabel")}</span>
              <span className="inline-flex shrink-0 items-center rounded-md bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-text ring-1 ring-inset ring-brand/20">
                {currentConfig.usageMultiplier}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="mt-5 text-right">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] w-full rounded-xl bg-brand py-2.5 text-sm font-semibold text-brand-foreground shadow-sm hover:bg-brand-hover transition-colors cursor-pointer"
          >
            {language === "vi" ? "Xác nhận" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
