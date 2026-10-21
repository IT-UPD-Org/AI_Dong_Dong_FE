import * as Sentry from "@sentry/react";
import { TempsAnalyticsProvider } from "@temps-sdk/react-analytics";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import App from "./App";
import "./index.css";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [Sentry.replayIntegration()],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {/* Pageviews follow client-side route changes; nothing is sent from localhost. */}
      <TempsAnalyticsProvider
        basePath="/api/_temps"
        enableSessionRecording
        sessionRecordingConfig={{
          // Sensitive pages are never recorded; the SDK also excludes its
          // built-in auth/checkout paths.
          excludedPaths: [
            "/admin/*",
            "/settings/*",
            "/profile/*",
            "/auth/*",
          ],
          useDefaultExcludedPaths: true,
          // Replay 10% of sessions to keep ingest volume (and rrweb overhead)
          // in line with the Sentry replay sampling. Use 1.0 for every session.
          sessionSampleRate: 0.1,
          // Never capture what users type.
          maskAllInputs: true,
          maskTextSelector: "[data-mask]",
          // Stop producing events once the visitor is idle or the tab is hidden.
          idleTimeout: 60_000,
          pauseOnHidden: true,
          debug: import.meta.env.DEV,
        }}
      >
        <App />
      </TempsAnalyticsProvider>
    </BrowserRouter>
    <Toaster position="top-right" />
  </StrictMode>,
);
