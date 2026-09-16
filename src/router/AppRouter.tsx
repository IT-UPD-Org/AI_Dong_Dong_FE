import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { PublicLayout } from "../components/layout/PublicLayout";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ChatPage } from "../pages/ChatPage";
import { HistoryPage } from "../pages/HistoryPage";
import { KnowledgePage } from "../pages/KnowledgePage";
import { DocumentsPage } from "../pages/DocumentsPage";
import { ContributorsPage } from "../pages/ContributorsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { SettingsPage } from "../pages/SettingsPage";
import { InfoPage } from "../pages/InfoPage";

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/about"
          element={
            <InfoPage
              title="About Đông Đông"
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
      </Route>
      <Route element={<AppShell />}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/contributors" element={<ContributorsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRouter;
