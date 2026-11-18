/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin; leave empty to use the same origin (dev proxy or reverse proxy). */
  readonly VITE_API_BASE_URL?: string;
  /** Sentry DSN; Sentry stays inactive when unset. */
  readonly VITE_SENTRY_DSN?: string;
  /** Umami analytics loads in production builds only, and only when both are set. */
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  readonly VITE_UMAMI_SCRIPT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
