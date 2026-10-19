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
      <TempsAnalyticsProvider basePath="/api/_temps">
        <App />
      </TempsAnalyticsProvider>
    </BrowserRouter>
    <Toaster position="top-right" />
  </StrictMode>,
);
