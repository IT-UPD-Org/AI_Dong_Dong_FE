import { LibraryManager } from "../components/library/LibraryManager";

export function KnowledgePage() {
  return (
    <main className="px-4 py-6 sm:px-6 sm:py-8 text-foreground">
      <LibraryManager hideHeader={false} />
    </main>
  );
}

export default KnowledgePage;
