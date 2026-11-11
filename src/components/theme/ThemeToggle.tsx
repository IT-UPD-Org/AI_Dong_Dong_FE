import { useTheme } from "next-themes";
import { Languages, Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
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
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      title={language === "vi" ? "Switch to English" : "Chuyển sang Tiếng Việt"}
      className="flex h-10 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-fg-secondary transition-colors hover:bg-hover hover:text-foreground sm:h-9"
      aria-label="Đổi ngôn ngữ"
    >
      <Languages size={15} aria-hidden="true" />
      <span className="font-mono text-[11px] uppercase tracking-wider">
        {language === "vi" ? "VI" : "EN"}
      </span>
    </button>
  );
}
