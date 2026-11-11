import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Languages } from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "../../contexts/LanguageContext";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-8 w-8" />;
  }

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const isDark = theme === "dark";
  const isLight = theme === "light";

  if (compact) {
    return (
      <button
        type="button"
        onClick={cycleTheme}
        title={
          isDark
            ? "Đang dùng chế độ Tối (Nhấn để đổi sang Hệ thống)"
            : isLight
            ? "Đang dùng chế độ Sáng (Nhấn để đổi sang Tối)"
            : "Đang dùng chế độ Hệ thống (Nhấn để đổi sang Sáng)"
        }
        className="flex size-8 shrink-0 items-center justify-center rounded-lg text-black/60 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
        aria-label="Chuyển đổi giao diện sáng/tối"
      >
        {isDark ? (
          <Moon size={16} className="text-amber-400" />
        ) : isLight ? (
          <Sun size={16} className="text-amber-600" />
        ) : (
          <Monitor size={16} />
        )}
      </button>
    );
  }

  const { t } = useLanguage();

  return (
    <div className="flex items-center rounded-xl bg-black/[0.04] dark:bg-white/[0.06] p-1 text-xs">
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer ${
          theme === "light"
            ? "bg-white dark:bg-[#242424] font-semibold text-[#04714a] shadow-xs"
            : "text-black/55 dark:text-white/60 hover:text-black dark:hover:text-white"
        }`}
      >
        <Sun size={13} className={theme === "light" ? "text-amber-600" : ""} />
        <span>{t("themeLight")}</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer ${
          theme === "dark"
            ? "bg-white dark:bg-[#242424] font-semibold text-[#04714a] shadow-xs"
            : "text-black/55 dark:text-white/60 hover:text-black dark:hover:text-white"
        }`}
      >
        <Moon size={13} className={theme === "dark" ? "text-amber-400" : ""} />
        <span>{t("themeDark")}</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-all cursor-pointer ${
          theme === "system"
            ? "bg-white dark:bg-[#242424] font-semibold text-[#04714a] shadow-xs"
            : "text-black/55 dark:text-white/60 hover:text-black dark:hover:text-white"
        }`}
      >
        <Monitor size={13} />
        <span>{t("themeSystem")}</span>
      </button>
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
      className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-black/60 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/10 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
      aria-label="Đổi ngôn ngữ"
    >
      <Languages size={15} />
      <span className="font-mono text-[11px] uppercase tracking-wider">
        {language === "vi" ? "VI" : "EN"}
      </span>
    </button>
  );
}
