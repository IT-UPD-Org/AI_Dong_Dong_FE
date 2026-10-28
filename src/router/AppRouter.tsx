import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { PublicLayout } from "../components/layout/PublicLayout";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { AdminRoute } from "../components/auth/AdminRoute";
import { AdminPage } from "../pages/admin/AdminPage";
import { PublicRoute } from "../components/auth/PublicRoute";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { AuthVerifyPage } from "../pages/AuthVerifyPage";
import { ChatPage } from "../pages/ChatPage";
import { HistoryPage } from "../pages/HistoryPage";
import { KnowledgePage } from "../pages/KnowledgePage";
import { DocumentsPage } from "../pages/DocumentsPage";
import { ContributorsPage } from "../pages/ContributorsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SettingsPage } from "../pages/SettingsPage";
import { InfoPage } from "../pages/InfoPage";
import { ProjectTeamPage } from "../pages/ProjectTeamPage";
import { CreateAccountPage } from "../pages/CreateAccountPage";
import { ApprovePage } from "../pages/ApprovePage";

/**
 * Shared element for `/chat` (new chat) and `/c/:id` (existing chat).
 * Old `/chat?id=X` links redirect to `/c/X`.
 *
 * The fixed key keeps ChatPage mounted when a new chat's URL changes from
 * /chat to /c/:id, so the reply that is still streaming is not cancelled.
 */
function ChatEntry() {
  const [params] = useSearchParams();
  const legacyId = params.get("id");
  if (legacyId) return <Navigate to={`/c/${encodeURIComponent(legacyId)}`} replace />;
  return <ChatPage key="chat" />;
}

export function AppRouter() {
  return (
    <Routes>
      {/* PUBLIC ROUTES */}
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
        <Route path="/donate" element={<ProjectTeamPage />} />
        <Route path="/approve" element={<ApprovePage />} />
        <Route path="/contributors" element={<ContributorsPage />} />

        {/* MICROSOFT OAUTH REDIRECT: {origin}/callback is the default redirect URI.
            /auth/callback stays for sign-ins already registered under the old URI. */}
        <Route path="/callback" element={<AuthVerifyPage />} />
        <Route path="/auth/callback" element={<AuthVerifyPage />} />

        {/* Public on purpose: it creates the first account. The one-time key
            printed to the backend console is what protects it. */}
        <Route path="/admin/create" element={<CreateAccountPage />} />

        {/* CÁC ROUTE CHỈ CHO NGƯỜI CHƯA ĐĂNG NHẬP */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* PROTECTED ROUTES: CHỈ TRUY CẬP ĐƯỢC SAU KHI ĐƯỢC CẤP QUYỀN (PERMISSION) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          {/* One shared element (same key) for both paths: a new chat moves from
              /chat to /c/:id mid-stream, and remounting would cancel the reply. */}
          <Route path="/chat" element={<ChatEntry />} />
          <Route path="/c/:id" element={<ChatEntry />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/contributors" element={<ContributorsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
