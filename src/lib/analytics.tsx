import { useEffect } from "react";

const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID ?? "";
const SCRIPT_URL = import.meta.env.VITE_UMAMI_SCRIPT_URL ?? "";
const ENABLED = import.meta.env.PROD && Boolean(WEBSITE_ID && SCRIPT_URL);

const RETRY_MS = 500;
const MAX_ATTEMPTS = 20;

type UmamiWindow = Window & {
  umami?: {
    identify: (id: string, data?: Record<string, string>) => void;
  };
};

/**
 * Loads the Umami tracker in production builds only. Pageviews, including
 * client-side route changes, are tracked by the script itself.
 */
export function Analytics() {
  useEffect(() => {
    if (!ENABLED || document.getElementById("umami-analytics")) return;

    const script = document.createElement("script");
    script.id = "umami-analytics";
    script.async = true;
    script.src = SCRIPT_URL;
    script.dataset.websiteId = WEBSITE_ID;
    script.dataset.tag = "";
    script.dataset.performance = "";
    document.head.appendChild(script);
  }, []);

  return null;
}

/**
 * Attach the user ID to this visitor's Umami session. The tracker loads
 * asynchronously (and may be blocked), so wait briefly for it.
 */
export function identifyUser(id: string, data?: Record<string, string>): void {
  if (!ENABLED || typeof window === "undefined") return;
  let attempts = 0;
  const tryIdentify = () => {
    const umami = (window as UmamiWindow).umami;
    if (umami) {
      umami.identify(id, data);
      return;
    }
    if (++attempts < MAX_ATTEMPTS) window.setTimeout(tryIdentify, RETRY_MS);
  };
  tryIdentify();
}
