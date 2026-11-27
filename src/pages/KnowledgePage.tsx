import { Navigate } from "react-router-dom";
import { LibraryManager } from "../components/library/LibraryManager";
import { useAuth } from "../contexts/AuthContext";

export function KnowledgePage() {
  const { user } = useAuth();
  if (user?.role !== "teacher" && user?.role !== "admin") {
    return <Navigate to="/chat" replace />;
  }
  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 text-foreground">
      <LibraryManager hideHeader={false} />
    </main>
  );
}

export default KnowledgePage;
