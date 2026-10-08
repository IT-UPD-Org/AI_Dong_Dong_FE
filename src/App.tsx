import { lazy, Suspense, useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppRouter from './router/AppRouter';
import { PageLoader } from './components/layout/PageLoader';

// Preview controls are available locally only, never in a production build.
const PageLoaderPreview = import.meta.env.DEV
  ? lazy(() => import('./components/layout/PageLoaderPreview'))
  : null;

function AppContent() {
  const { isLoading } = useAuth();
  const [showLoader, setShowLoader] = useState(true);
  const loaderVisible = isLoading || showLoader;

  useEffect(() => {
    if (isLoading) setShowLoader(true);
  }, [isLoading]);

  return (
    <>
      <div inert={loaderVisible} aria-busy={loaderVisible}>
        <AppRouter />
      </div>
      {loaderVisible && (
        <PageLoader loading={isLoading} onComplete={() => setShowLoader(false)} />
      )}
    </>
  );
}

export default function App() {
  if (PageLoaderPreview && new URLSearchParams(window.location.search).get('preview') === 'page-loader') {
    return (
      <Suspense fallback={null}>
        <PageLoaderPreview />
      </Suspense>
    );
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
