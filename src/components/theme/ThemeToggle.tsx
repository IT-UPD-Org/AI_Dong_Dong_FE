import { useTheme } from "next-themes";
import { ChevronDown, Languages, Lock, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

const TRANSITION_CLASS = "theme-transition";
const TRANSITION_MS = 300;

/** Animate only colors, and only for the moment the theme flips. */
function withThemeTransition(apply: () => void) {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) root.classList.add(TRANSITION_CLASS);
  apply();
  window.setTimeout(() => root.classList.remove(TRANSITION_CLASS), TRANSITION_MS);
}

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Navbar theme switch, shared by every layout. Sun in light mode, moon in
 * dark mode; a click switches to the other theme.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";
  const label = isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối";

  return (
    <button
      type="button"
      onClick={() => withThemeTransition(() => setTheme(isDark ? "light" : "dark"))}
      title={label}
      aria-label={label}
      className={`relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-fg-secondary transition-colors hover:bg-hover hover:text-foreground sm:size-9 ${className}`}
    >
      {/* Both icons stay mounted so the swap cross-fades instead of popping. */}
      <Sun
        size={17}
        aria-hidden="true"
        className={`absolute transition-all duration-300 ${isDark ? "scale-50 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
      />
      <Moon
        size={17}
        aria-hidden="true"
        className={`absolute transition-all duration-300 ${isDark ? "scale-100 rotate-0 opacity-100" : "scale-50 -rotate-90 opacity-0"}`}
      />
    </button>
  );
}

/** Light / Dark / System picker for the Settings page; same global state. */
export function ThemeModeSelector() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const mounted = useMounted();
  const current = mounted ? theme : undefined;

  const options = [
    { value: "light", label: t("themeLight"), Icon: Sun },
    { value: "dark", label: t("themeDark"), Icon: Moon },
    { value: "system", label: t("themeSystem"), Icon: Monitor },
  ] as const;

  return (
    <div role="radiogroup" className="flex items-center rounded-xl bg-muted p-1 text-xs">
      {options.map(({ value, label, Icon }) => {
        const selected = current === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => withThemeTransition(() => setTheme(value))}
            className={`flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors ${
              selected
                ? "bg-elevated font-semibold text-brand-text shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={13} aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const languages = [
    { flag: "🇻🇳", label: "Tiếng Việt", value: "vi", locked: false },
    { flag: "🇬🇧", label: "English",    value: "en", locked: false },
    { flag: "🇨🇳", label: "Tiếng Trung", value: "zh", locked: true  },
    { flag: "🇯🇵", label: "Tiếng Nhật",  value: "ja", locked: true  },
    { flag: "🇰🇷", label: "Tiếng Hàn",  value: "ko", locked: true  },
  ] as const;

  const current = languages.find((l) => l.value === language) ?? languages[0];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Đổi ngôn ngữ"
        aria-expanded={open}
        className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-fg-secondary transition-colors hover:bg-hover hover:text-foreground sm:h-9"
      >
        <Languages size={15} aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-wider">
          {current.value === "vi" ? "VI" : "EN"}
        </span>
        <ChevronDown
          size={12}
          aria-hidden="true"
          className={`transition-transform duration-200 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 z-50 min-w-[160px] rounded-xl border border-border bg-elevated shadow-lg py-1">
          {languages.map(({ flag, label, value, locked }) => {
            const isSelected = language === value;
            return (
              <button
                key={value}
                type="button"
                disabled={locked}
                onClick={() => {
                  if (!locked) {
                    setLanguage(value as "vi" | "en");
                    setOpen(false);
                  }
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors ${
                  locked
                    ? "cursor-not-allowed opacity-50 text-muted-foreground"
                    : isSelected
                    ? "font-semibold text-brand-text bg-muted"
                    : "cursor-pointer text-fg-secondary hover:bg-hover hover:text-foreground"
                }`}
              >
                <span className="text-sm leading-none">{flag}</span>
                <span className="flex-1 text-left">{label}</span>
                {locked ? (
                  <Lock size={11} aria-hidden="true" />
                ) : isSelected ? (
                  <span className="text-brand-text">✓</span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
