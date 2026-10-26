/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend origin; leave empty to use the same origin (dev proxy or reverse proxy). */
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_MICROSOFT_TENANT_ID?: string;
  readonly VITE_MICROSOFT_CLIENT_ID?: string;
  /** Must match MICROSOFT_REDIRECT_URI on the backend; defaults to `<origin>/auth/callback`. */
  readonly VITE_MICROSOFT_REDIRECT_URI?: string;
  /** Sentry DSN; Sentry stays inactive when unset. */
  readonly VITE_SENTRY_DSN?: string;
  /** Umami analytics loads in production builds only, and only when both are set. */
  readonly VITE_UMAMI_WEBSITE_ID?: string;
  readonly VITE_UMAMI_SCRIPT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
