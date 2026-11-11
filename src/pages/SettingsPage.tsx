import { useLanguage, Language } from "../contexts/LanguageContext";
import { ThemeModeSelector } from "../components/theme/ThemeToggle";
import { Languages, Palette, Sliders } from "lucide-react";

export function SettingsPage() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 text-foreground transition-colors">
      <div className="max-w-3xl mx-auto">
        <p className="font-mono text-xs uppercase tracking-[.18em] text-brand-text font-semibold">
          {t("preferences")}
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
          {t("settingsTitle")}
        </h1>

        <div className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card shadow-xs transition-colors">
          {/* Ngôn ngữ giao diện (Interface Language) */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-brand/10 text-brand-text mt-0.5">
                <Languages size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-base">
                  {t("interfaceLanguage")}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  {t("interfaceLanguageDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-center rounded-xl bg-muted p-1 text-xs font-medium">
              <button
                type="button"
                onClick={() => setLanguage("vi")}
                className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  language === "vi"
                    ? "bg-elevated font-semibold text-brand-text shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Tiếng Việt
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`rounded-lg px-3 py-1.5 transition-all cursor-pointer ${
                  language === "en"
                    ? "bg-elevated font-semibold text-brand-text shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Giao diện Sáng/Tối (Theme Mode) */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-brand/10 text-brand-text mt-0.5">
                <Palette size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-base">
                  {t("themeMode")}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  {t("themeModeDesc")}
                </p>
              </div>
            </div>

            <ThemeModeSelector />
          </div>

          {/* Trích dẫn nguồn (Source citations) */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-brand/10 text-brand-text mt-0.5">
                <Sliders size={20} />
              </div>
              <div>
                <h2 className="font-semibold text-base">{t("citations")}</h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  {t("citationsDesc")}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 rounded-full bg-muted peer peer-checked:bg-brand peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-border/80 after:bg-card after:shadow-xs after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-transparent peer-checked:after:bg-brand-foreground dark:after:bg-foreground"></div>
            </label>
          </div>
        </div>
      </div>
    </main>
  );
}
