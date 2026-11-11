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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      {/* Backdrop overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-[#1a1d21] p-5 shadow-xl border border-black/10 dark:border-white/10 transition-colors"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {t("effortTitle")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("effortSubtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
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
        <div className="my-6">
          <div className="flex justify-between text-xs font-semibold mb-2">
            {LEVEL_KEYS.map((key) => (
              <span
                key={key}
                onClick={() => onLevelChange(key)}
                className={`cursor-pointer transition-colors ${
                  level === key ? "text-[#04714a] dark:text-[#4ade80] font-bold" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {AGENT_LEVEL_CONFIGS[key].label}
              </span>
            ))}
          </div>

          <div className="relative flex items-center">
            {/* Track Line */}
            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-white/15">
              <div
                className="h-2 rounded-full bg-[#04714a] dark:bg-[#4ade80] transition-all duration-300"
                style={{ width: `${(currentIndex / 2) * 100}%` }}
              />
            </div>

            {/* Clickable Dots */}
            <div className="absolute inset-0 flex justify-between items-center px-0.5">
              {LEVEL_KEYS.map((key, index) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onLevelChange(key)}
                  className={`size-5 rounded-full border-2 transition-all cursor-pointer ${
                    index <= currentIndex
                      ? "border-[#04714a] dark:border-[#4ade80] bg-white dark:bg-[#1a1d21] ring-2 ring-[#04714a]/20"
                      : "border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1a1d21]"
                  } ${level === key ? "scale-125 bg-[#04714a] dark:bg-[#4ade80]" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Model & Usage Details */}
        <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] p-4 border border-gray-100 dark:border-white/10 text-xs space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-700 dark:text-gray-300">Level:</span>
            <span className="font-bold text-[#04714a] dark:text-[#4ade80]">
              {currentConfig.label} ({currentConfig.id})
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {language === "vi" ? "Mô tả:" : "Description:"}
            </span>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
              {language === "vi" ? currentConfig.descriptionVi : currentConfig.descriptionEn}
            </p>
          </div>
          <div className="pt-2 border-t border-gray-200/60 dark:border-white/10 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t("managerModelLabel")}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {currentConfig.managerAgent}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{t("subAgentsLabel")}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">
                {currentConfig.subAgents}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-500 dark:text-gray-400">{t("tokenMultiplierLabel")}</span>
              <span className="inline-flex items-center rounded-md bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 ring-1 ring-inset ring-emerald-600/20">
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
            className="w-full rounded-xl bg-[#04714a] py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#035a3b] transition-colors cursor-pointer"
          >
            {language === "vi" ? "Xác nhận" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
