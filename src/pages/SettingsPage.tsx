import { useTheme } from "next-themes";
import { useLanguage, Language } from "../contexts/LanguageContext";
import { Moon, Sun, Monitor, Languages, Palette, Sliders } from "lucide-react";

export function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 text-[#11130f] dark:text-gray-100 transition-colors">
      <div className="max-w-3xl mx-auto">
        <p className="mono text-xs uppercase tracking-[.18em] text-[#04714a] font-semibold">
          {t("preferences")}
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
          {t("settingsTitle")}
        </h1>

        <div className="mt-8 divide-y divide-black/10 dark:divide-white/10 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181a1e] shadow-xs transition-colors">
          {/* Ngôn ngữ giao diện (Interface Language) */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#04714a]/10 text-[#04714a] mt-0.5">
                <Languages size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-base">
                  {t("interfaceLanguage")}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-black/50 dark:text-white/60">
                  {t("interfaceLanguageDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLanguage("vi")}
                className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  language === "vi"
                    ? "bg-white dark:bg-[#25282c] font-bold text-[#04714a] shadow-xs"
                    : "text-black/60 dark:text-white/70 hover:text-black dark:hover:text-white"
                }`}
              >
                Tiếng Việt
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-white dark:bg-[#25282c] font-bold text-[#04714a] shadow-xs"
                    : "text-black/60 dark:text-white/70 hover:text-black dark:hover:text-white"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Giao diện Sáng/Tối (Theme Mode) */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#04714a]/10 text-[#04714a] mt-0.5">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-base">
                  {t("themeMode")}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-black/50 dark:text-white/60">
                  {t("themeModeDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  theme === "light"
                    ? "bg-white dark:bg-[#25282c] font-bold text-[#04714a] shadow-xs"
                    : "text-black/60 dark:text-white/70 hover:text-black dark:hover:text-white"
                }`}
              >
                <Sun size={14} className={theme === "light" ? "text-amber-600" : ""} />
                <span>{t("themeLight")}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  theme === "dark"
                    ? "bg-white dark:bg-[#25282c] font-bold text-[#04714a] shadow-xs"
                    : "text-black/60 dark:text-white/70 hover:text-black dark:hover:text-white"
                }`}
              >
                <Moon size={14} className={theme === "dark" ? "text-amber-400" : ""} />
                <span>{t("themeDark")}</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("system")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  theme === "system"
                    ? "bg-white dark:bg-[#25282c] font-bold text-[#04714a] shadow-xs"
                    : "text-black/60 dark:text-white/70 hover:text-black dark:hover:text-white"
                }`}
              >
                <Monitor size={14} />
                <span>{t("themeSystem")}</span>
              </button>
            </div>
          </div>

          {/* Trích dẫn nguồn (Source citations) */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-[#04714a]/10 text-[#04714a] mt-0.5">
                <Sliders size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-base">{t("citations")}</h2>
                <p className="mt-0.5 text-xs sm:text-sm text-black/50 dark:text-white/60">
                  {t("citationsDesc")}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#04714a]"></div>
            </label>
          </div>
        </div>
      </div>
    </main>
  );
}
