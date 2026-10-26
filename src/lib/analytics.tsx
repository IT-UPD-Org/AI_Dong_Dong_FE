import { UmamiAnalytics, identify, isUmamiLoaded } from '@giof/react-umami';

const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID ?? '';
const SCRIPT_URL = import.meta.env.VITE_UMAMI_SCRIPT_URL ?? '';
const ENABLED = import.meta.env.PROD && Boolean(WEBSITE_ID && SCRIPT_URL);

const RETRY_MS = 500;
const MAX_ATTEMPTS = 20;

/**
 * Loads the Umami tracker in production builds only. Pageviews, including
 * client-side route changes, are tracked by the script itself.
 */
export function Analytics() {
  if (!ENABLED) return null;

  // `tag` is passed explicitly: when unset the library falls back to
  // `process.env`, which does not exist in a Vite browser bundle.
  // `performance` also reports Web Vitals; every other option keeps its default.
  return <UmamiAnalytics websiteId={WEBSITE_ID} src={SCRIPT_URL} tag="" performance />;
}

/**
 * Attach the user ID to this visitor's Umami session. The tracker loads
 * asynchronously (and may be blocked), so wait briefly for it.
 */
export function identifyUser(id: string, data?: Record<string, string>): void {
  if (!ENABLED) return;
  let attempts = 0;
  const tryIdentify = () => {
    if (isUmamiLoaded()) {
      identify(id, data);
      return;
    }
    if (++attempts < MAX_ATTEMPTS) window.setTimeout(tryIdentify, RETRY_MS);
  };
  tryIdentify();
}
