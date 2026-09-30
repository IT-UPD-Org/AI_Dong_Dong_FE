import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { PublicLayout } from "../components/layout/PublicLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { PublicRoute } from "../components/auth/PublicRoute";
import { PageLoader } from "../components/layout/PageLoader";

const LandingPage = lazy(() =>
  import("../pages/LandingPage").then(({ LandingPage }) => ({ default: LandingPage })),
);
const LoginPage = lazy(() =>
  import("../pages/LoginPage").then(({ LoginPage }) => ({ default: LoginPage })),
);
const RegisterPage = lazy(() =>
  import("../pages/RegisterPage").then(({ RegisterPage }) => ({ default: RegisterPage })),
);
const AuthVerifyPage = lazy(() =>
  import("../pages/AuthVerifyPage").then(({ AuthVerifyPage }) => ({ default: AuthVerifyPage })),
);
const ChatPage = lazy(() =>
  import("../pages/ChatPage").then(({ ChatPage }) => ({ default: ChatPage })),
);
const HistoryPage = lazy(() =>
  import("../pages/HistoryPage").then(({ HistoryPage }) => ({ default: HistoryPage })),
);
const KnowledgePage = lazy(() =>
  import("../pages/KnowledgePage").then(({ KnowledgePage }) => ({ default: KnowledgePage })),
);
const DocumentsPage = lazy(() =>
  import("../pages/DocumentsPage").then(({ DocumentsPage }) => ({ default: DocumentsPage })),
);
const ContributorsPage = lazy(() =>
  import("../pages/ContributorsPage").then(({ ContributorsPage }) => ({ default: ContributorsPage })),
);
const ProfilePage = lazy(() =>
  import("../pages/ProfilePage").then(({ ProfilePage }) => ({ default: ProfilePage })),
);
const SettingsPage = lazy(() =>
  import("../pages/SettingsPage").then(({ SettingsPage }) => ({ default: SettingsPage })),
);
const InfoPage = lazy(() =>
  import("../pages/InfoPage").then(({ InfoPage }) => ({ default: InfoPage })),
);

export function AppRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public pages */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/about"
            element={
              <InfoPage
                title="About IT UPD GenAI"
                eyebrow="A shared intelligence"
                body="A university assistant shaped by the people, language, and questions of Phương Đông."
              />
            }
          />
          <Route
            path="/donate"
            element={
              <InfoPage
                title="Keep knowledge open"
                eyebrow="Donate"
                body="Support the infrastructure that helps students find clearer answers."
              />
            }
          />
          <Route
            path="/approve"
            element={
              <InfoPage
                title="Approve to try"
                eyebrow="For university leaders"
                body="Help us bring a thoughtful, safe AI layer to your campus community."
              />
            }
          />

          <Route path="/auth/verify" element={<AuthVerifyPage />} />
          <Route path="/auth/callback" element={<AuthVerifyPage />} />

          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
        </Route>

        {/* Pages for signed-in students */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/contributors" element={<ContributorsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRouter;
