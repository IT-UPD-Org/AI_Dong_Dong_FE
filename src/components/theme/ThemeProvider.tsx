import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from "next-themes";

/** localStorage key shared with the pre-paint script in index.html. */
export const THEME_STORAGE_KEY = "itupd-theme";

/**
 * The one global theme provider for the whole site (public pages and the app).
 * It writes the `dark` class on <html>; every color comes from the CSS tokens
 * in index.css, so no component keeps its own theme state.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      storageKey={THEME_STORAGE_KEY}
      defaultTheme="system"
      enableSystem
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
